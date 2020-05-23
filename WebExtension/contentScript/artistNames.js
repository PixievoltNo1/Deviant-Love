/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
"use strict";

function artistNamesSetup() {

var artistNames = new Set();
var linkSelector = "section[data-hook='deviation_std_thumb'] .user-link";
var getArtistFromLink = (linkElem) => linkElem.dataset.username;
for ( let link of document.body.querySelectorAll(linkSelector) ) {
	artistNames.add( getArtistFromLink(link) );
}
chrome.runtime.sendMessage({ action: "addArtistNames", names: [...artistNames] });
var pageObserver = new MutationObserver(findAdditions);
pageObserver.observe(document.body, { childList: true, subtree: true });
function findAdditions() {
	var newNames = [];
	for (let link of document.body.querySelectorAll(linkSelector)) {
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
	pageObserver.disconnect();
	chrome.runtime.onMessage.removeListener(messageHandler);
}

}