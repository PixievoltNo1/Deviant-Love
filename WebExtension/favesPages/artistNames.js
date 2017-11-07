/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
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
	// TODO: Write this
}
function getArtistFromThumb(thumb) {
	return thumb.querySelector("a.username").textContent;
}
chrome.runtime.onMessage.addListener(({action}, buddy, callback) => {
	if (action == "getArtistNames") { callback([...artistNames]); }
});