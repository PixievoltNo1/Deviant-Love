/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
"use strict";

var artistNames = new Set();
var container = document.querySelector(".torpedo-container");
for (let thumb of Array.from( container.querySelectorAll(".thumb") )) {
	artistNames.add(getArtistFromThumb(thumb));
}
chrome.runtime.sendMessage({action: "addArtistNames", names: [...artistNames]});
(new MutationObserver(processMutations)).observe(container, {childList: true});
function processMutations(records) {
	var newNodes = [], newNames = [];
	for (let record of records) {
		newNodes.push(...Array.from(record.addedNodes));
	}
	for (let node of newNodes) {
		if (!(node instanceof Element && node.classList.contains("thumb"))) { continue; }
		let name = getArtistFromThumb(node);
		if (artistNames.has(name)) { continue; }
		artistNames.add(name);
		newNames.push(name);
	}
	if (newNames.length) {
		chrome.runtime.sendMessage({action: "addArtistNames", names: newNames});
	}
}
function getArtistFromThumb(thumb) {
	return thumb.querySelector("a.username").textContent;
}
chrome.runtime.onMessage.addListener(({action}, buddy, callback) => {
	if (action == "getArtistNames") { callback([...artistNames]); }
});