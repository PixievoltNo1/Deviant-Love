/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
var feedHref = $('link[rel="alternate"][type="application/rss+xml"]').attr("href");
// var deviantName = jQuery(".gruserbadge h1 a").text();
chrome.extension.sendRequest({action: "showLove"});
chrome.extension.onRequest.addListener( function(thing, buddy, callback) {switch (thing.action) {
	case "getLove":
		callback({"feedHref": feedHref});
	break;
}} );