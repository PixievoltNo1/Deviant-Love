/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";

document.querySelector("#gruze-main").addEventListener("mouseover", function hi(event) {
	var thumb = event.target.closest(".thumb");
	if (thumb) {
		chrome.runtime.sendMessage({action: "showArtistLove",
			artist: thumb.querySelector("a.username").textContent});
		thumb.addEventListener("mouseout", function bye() {
			chrome.runtime.sendMessage({action: "noArtistLove"});
			thumb.removeEventListener("mouseout", bye, false);
			document.querySelector("#gruze-main").addEventListener("mouseover", hi);
		}, false);
		this.removeEventListener("mouseover", "hi");
	}
}, false);
var keepAlive;
function checkVisibility() {
	if (!document.hidden) {
		keepAlive = chrome.runtime.connect({name: "keepAlive"});
	} else if (keepAlive) {
		keepAlive.disconnect();
		chrome.runtime.sendMessage({action: "noArtistLove"});
	}
};
checkVisibility();
document.addEventListener("visibilitychange", checkVisibility, false);