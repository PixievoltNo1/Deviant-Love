/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
"use strict";

function artistNamesSetup() {

var artistNames = new Set();
var root, linkSelector, getArtistFromLink;
var landmark = document.querySelector("[data-hook='gallection_folder']");
if (landmark) {
	// Eclipse
	root = landmark.parentElement.parentElement;
	linkSelector = ".user-link";
	getArtistFromLink = (linkElem) => linkElem.dataset.username;
} else {
	// Pre-Eclipse
	root = document.querySelector(".torpedo-container");
	linkSelector = "a.username";
	getArtistFromLink = (linkElem) => linkElem.textContent;
}
for ( let link of root.querySelectorAll(linkSelector) ) {
	artistNames.add( getArtistFromLink(link) );
}
chrome.runtime.sendMessage({ action: "addArtistNames", names: [...artistNames] });
(new MutationObserver(findAdditions)).observe(root, { childList: true, subtree: true });
function findAdditions() {
	var newNames = [];
	for (let link of root.querySelectorAll(linkSelector)) {
		let name = getArtistFromLink(link);
		if (artistNames.has(name)) { continue; }
		artistNames.add(name);
		newNames.push(name);
	}
	if (newNames.length) {
		chrome.runtime.sendMessage({ action: "addArtistNames", names: newNames });
	}
}

chrome.runtime.onMessage.addListener(messageHandler);
function messageHandler({ action }, buddy, callback) {
	if (action == "getArtistNames") { callback([...artistNames]); }
}

return () => {
	chrome.runtime.onMessage.removeListener(messageHandler);
}

}