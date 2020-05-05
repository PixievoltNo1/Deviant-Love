/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
"use strict";

var teardown, lastPage = "";
(new MutationObserver(reactToPage)).observe(document.body, {childList: true, subtree: true});
function reactToPage() {
	var page;
	if ( /^\/[^\/]*\/favourites/.test(location.pathname) ) {
		page = "faves";
	} else {
		page = "";
	}
	if (page == lastPage) { return; }
	lastPage = page;
	if (teardown) { teardown(); }
	if (page == "faves") {
		teardown = favesPageSetup();
	} else {
		teardown = null;
	}
}
reactToPage();