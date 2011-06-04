/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";

function findLove(favesWindow) {
	var win = favesWindow || window;
	var document = win.document;
	var location = win.location;

	var feedHref = document.querySelector('link[rel="alternate"][type="application/rss+xml"]').href;
	var pageType;
	if ((/\/\d+$/).test(location.pathname) || (/\?\d+/).test(location.search)) {
		pageType = "collection";
	} else if (location.search.indexOf("catpath=") != -1) {
		pageType = "allFaves";
	} else {
		// I sure hope it's the Featured view. Consider adding a check to be sure, and notifying the user if it fails.
		pageType = "featured";
	}
	// While the mechanism for declaring RSS feeds is standardized, the dA layout is not and can change. Be careful!
	var ownerOrTitle, element;
	if (pageType != "collection") {
		element = document.querySelector(".gruserbadge a.u");
		ownerOrTitle = element ? element.textContent : "???????";
	} else {
		element = document.querySelector(".folderview-top .folder-title");
		ownerOrTitle = element ? element.textContent : "???????";
	}

	return {"feedHref": feedHref, "pageType": pageType, "ownerOrTitle": ownerOrTitle};
}