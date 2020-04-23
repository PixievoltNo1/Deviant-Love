/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
"use strict";

var artistNames = new Set();
var container, linkSelector, getArtistFromLink;
// First selector gets the All/collection container, second selector gets the search results container
container = document.querySelector("#sub-folder-gallery > :last-child,"
	+ "[data-hook='gallection_folder'] ~ :last-child");
if (container) {
	// Eclipse
	linkSelector = ".user-link";
	getArtistFromLink = (linkElem) => linkElem.dataset.username;
} else {
	// Pre-Eclipse
	container = document.querySelector(".torpedo-container");
	linkSelector = "a.username";
	getArtistFromLink = (linkElem) => linkElem.textContent;
}
for ( let link of container.querySelectorAll(linkSelector) ) {
	artistNames.add( getArtistFromLink(link) );
}
chrome.runtime.sendMessage({ action: "addArtistNames", names: [...artistNames] });
(new MutationObserver(findAdditions)).observe(container, { childList: true });
function findAdditions() {
	var newNames = [];
	for (let link of container.querySelectorAll(linkSelector)) {
		let name = getArtistFromLink(link);
		if (artistNames.has(name)) { continue; }
		artistNames.add(name);
		newNames.push(name);
	}
	if (newNames.length) {
		chrome.runtime.sendMessage({ action: "addArtistNames", names: newNames });
	}
}

chrome.runtime.onMessage.addListener(({action}, buddy, callback) => {
	if (action == "getArtistNames") { callback([...artistNames]); }
});