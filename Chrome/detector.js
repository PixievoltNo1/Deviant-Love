/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/

var baseFeedHref = document.querySelector('link[rel="alternate"][type="application/rss+xml"]')
	.getAttribute("href");
var pageType, feedHref;
	
function findLove() {
	// var deviantName = document.querySelector(".gruserbadge a.u").innerText;
	if (location.hash == "" || location.hash.indexOf("#_featured") == 0) {
		// On occasion, you can spot a wild search component prowling through the URLs of such Faves pages as LostKitten's.
		// In order for this code to work properly, it must be shot. Cruel, but that's extension development.
		if (location.search != "") {location.search = ""}
		
		pageType = "featured";
		document.body.removeEventListener("DOMSubtreeModified", CollectionCheck, false);
		checkNewness(baseFeedHref);
	} else if (location.hash.indexOf("#_browse") == 0) {
		pageType = "allFaves";
		document.body.removeEventListener("DOMSubtreeModified", CollectionCheck, false);
		checkNewness(baseFeedHref.replace(/(favby%3A.+?)%2F[0-9]+(&)/, "$1$2"));
	} else if (location.hash.charAt(1) == "/") {
		// This is a deviation page, so do nothing
	} else {
		// This is a Collection. Its ID number is hiding in an element of class "folderview-control folderview-control-gallery-<collectionID>".
		// Said element may be present now or in the future.
		CollectionCheck();
		document.body.addEventListener("DOMSubtreeModified", CollectionCheck, false);
	}
	function CollectionCheck() {
		var IDHolder = document.querySelector('.folderview-control');
		if (IDHolder === null) { return; }
		var CollectionID = /gallery-([0-9]+)/.exec(IDHolder.className)[1];
		pageType = "collection";
		checkNewness(baseFeedHref.replace(/(favby%3A.+?%2F)[0-9]+(&)/, "$1" + CollectionID + "$2"));
	}
}
findLove();
addEventListener("hashchange", findLove, false);

function checkNewness(possibleNewness) {
	if (possibleNewness != feedHref) {
		feedHref = possibleNewness;
		// background.html most be notified of this newness!
		chrome.extension.sendRequest({action: "newLove"});
	}
}
chrome.extension.onRequest.addListener( function(thing, buddy, callback) {switch (thing.action) {
	case "getLove":
		callback({"feedHref": feedHref, "pageType": pageType});
	break;
}} );