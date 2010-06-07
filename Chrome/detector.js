/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/

var baseFeedHref = document.querySelector('link[rel="alternate"][type="application/rss+xml"]')
	.getAttribute("href");
var pageType, feedHref, firstInit = true;
	
function findLove() {
	if (location.hash == "" || location.hash.indexOf("#_featured") == 0) {
		pageType = "featured";
		feedHref = baseFeedHref;
	} else if (location.hash.indexOf("#_browse") == 0) {
		pageType = "allFaves";
		feedHref = baseFeedHref.replace(/(favby%3A.+?)%2F[0-9]+(&)/, "$1$2");
	} else if (location.hash.charAt(1) == "/") {
		return; // This content script started running on a deviation page, so don't allow the heart to appear.
	} else {
		pageType = "collection";
		var haystack = document.querySelector('.folderview-control').className; // The collection ID is in here somewhere
		// TODO: The above querySelector may return null if dA changes their layout. Rewrite this to fail gracefully.
		var collectionID = /gallery-([0-9]+)/.exec(haystack)[1];
		feedHref = baseFeedHref.replace(/(favby%3A.+?%2F)[0-9]+(&)/, "$1" + collectionID + "$2");
	}
	// var deviantName = document.querySelector(".gruserbadge a.u").innerText;
	
	chrome.extension.sendRequest({action: "showLove"});
	if (firstInit) {
		firstInit = false;
		chrome.extension.onRequest.addListener( function(thing, buddy, callback) {switch (thing.action) {
			case "getLove":
				callback({"feedHref": feedHref, "pageType": pageType});
			break;
		}} );
	}
}
findLove();
addEventListener("hashchange", findLove, false);