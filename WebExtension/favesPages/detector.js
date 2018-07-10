/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
"use strict";
if (!(window.chrome && chrome.runtime)) { window.chrome = browser; }

function findLove(win = window) {
	var document = win.document;
	var location = win.location;
	var love = {};

	love.feedHref = document.querySelector('link[rel="alternate"][type="application/rss+xml"]').href;
	if (location.pathname.endsWith("/favourites/") && location.search == "") {
		love.pageType = "featured";
	} else if (location.search == "?catpath=/") {
		love.pageType = "allFaves";
	} else if ((/\/\d+\//).test(location.pathname) || (/\?\d+/).test(location.search)) {
		love.pageType = "collection";
	} else {
		// Assume search results
		love.pageType = "search";
	}
	// While the mechanism for declaring RSS feeds is standardized, the dA layout is not and can change. Be careful!
	var element = document.querySelector("#gallery_pager");
	love.maxDeviations = element ? Number(element.getAttribute("gmi-limit")) : null;
	// "1" is a junk value DeviantArt uses when it doesn't know
	if (love.maxDeviations == 1) {
		love.maxDeviations = null;
	}

	return love;
}

chrome.runtime.sendMessage({action: "showLove"});
chrome.runtime.onMessage.addListener(({action}, buddy, callback) => {
	if (action == "getLove") { callback( findLove() ); }
});