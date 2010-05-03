/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
var feedHref = $('link[rel="alternate"][type="application/rss+xml"]').attr("href");
if (location.hash == "" || location.hash.indexOf("#_featured") == 0) {
	var pageType = "featured";
} else if (location.hash.indexOf("#_browse") == 0) {
	var pageType = "allFaves";
	feedHref = feedHref.replace(/(favby%3A.+)%2F[0-9]+(&)/, "$1$2");
} else {
	var pageType = "collection";
	// TODO: Rewrite feedHref to use the ID number of this collection
}
// var deviantName = jQuery(".gruserbadge h1 a").text();
chrome.extension.sendRequest({action: "showLove"});
chrome.extension.onRequest.addListener( function(thing, buddy, callback) {switch (thing.action) {
	case "getLove":
		callback({"feedHref": feedHref, "pageType": pageType});
	break;
}} );