/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
if (!baseFeedHref) {
	var baseFeedHref = document.querySelector('link[rel="alternate"][type="application/rss+xml"]')
		.getAttribute("href");
}
if (location.hash == "" || location.hash.indexOf("#_featured") == 0) {
	var pageType = "featured";
	var feedHref = baseFeedHref;
} else if (location.hash.indexOf("#_browse") == 0) {
	var pageType = "allFaves";
	var feedHref = feedHref.replace(/(favby%3A.+)%2F[0-9]+(&)/, "$1$2");
} else if (location.hash.charAt(1) == "/") {
	if (!pageType) { throw "STOP! Hammertime." } // This content script started running on a deviation page, so don't allow the heart to appear.
} else {
	var pageType = "collection";
	var feedHref = baseFeedHref;
	// TODO: Rewrite feedHref to use the ID number of this collection
}

// var deviantName = document.querySelector(".gruserbadge a.u").innerText;
chrome.extension.sendRequest({action: "showLove"});
chrome.extension.onRequest.addListener( function(thing, buddy, callback) {switch (thing.action) {
	case "getLove":
		callback({"feedHref": feedHref, "pageType": pageType});
	break;
}} );