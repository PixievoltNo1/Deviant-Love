/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";

function findLove(favesWindow) {
	var win = favesWindow || window;
	var document = win.document;
	var location = win.location;
	var love = {};

	love.feedHref = document.querySelector('link[rel="alternate"][type="application/rss+xml"]').href;
	if ((/\/\d+$/).test(location.pathname) || (/\?\d+/).test(location.search)) {
		love.pageType = "collection";
	} else if (location.search.indexOf("catpath=") != -1) {
		love.pageType = "allFaves";
	} else {
		// I sure hope it's the Featured view. Consider adding a check to be sure, and notifying the user if it fails.
		love.pageType = "featured";
	}
	// While the mechanism for declaring RSS feeds is standardized, the dA layout is not and can change. Be careful!
	var element;
	if (love.pageType != "collection") {
		element = document.querySelector(".gruserbadge a.u");
		love.ownerOrTitle = element ? element.textContent : "???????";
	} else {
		element = document.querySelector(".folderview-top .folder-title");
		love.ownerOrTitle = element ? element.textContent : "???????";
	}
	element = document.querySelector("#gmi-ResourceStream, #gmi-EditableResourceStream");
	love.maxDeviations = element ? element.getAttribute("gmi-total") : null;

	return love;
}