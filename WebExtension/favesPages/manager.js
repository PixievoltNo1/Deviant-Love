/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";

var popup = document.createElement("iframe");
popup.id = "DeviantLovePopup";
popup.hidden = true;
document.body.appendChild(popup);
var shield = document.createElement("div");
shield.id = "DeviantLoveShield";
shield.hidden = true;
document.body.appendChild(shield);
var popupState = "inactive";
var popupStage = "uninitialized";
var pageData = findLove();

chrome.runtime.onMessage.addListener( function(thing, buddy, callback) {switch (thing.action) {
	case "spark":
		if (popupState == "inactive") {activate()} else
		if (popupState == "active") {deactivate()};
	break;
	case "artistRequested":
		activate(thing.artist);
	break;
	case "scanningComplete":
		popupStage = "love";
	break;
	case "getResearchLoveParams":
		callback({feedHref: pageData.feedHref, maxDeviations: pageData.maxDeviations});
	break;
}} );
chrome.runtime.sendMessage({action: "showLove"});

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

function activate(firstDeviant) {
	popup.hidden = false;
	shield.hidden = false;
	popupState = "preparing";
	if (popupStage == "uninitialized") {
		chrome.runtime.onMessage.addListener( function popupReady(thing, buddy, callback) {
			if (thing.action == "popupSetup") {
				popupStage = "scanning";
				reveal();
				callback(pageData);
				chrome.runtime.onMessage.removeListener(popupReady);
			}
		} );
		popup.src = chrome.runtime.getURL("report/popup.html" + (firstDeviant ? "#" + firstDeviant : ""));
	} else if (popupStage == "scanning") {
		chrome.runtime.sendMessage({action: "echo", echoAction: "resumeScan"});
		// http://timtaubert.de/blog/2012/09/css-transitions-for-dynamically-created-dom-elements/
		window.getComputedStyle(popup).display;
		window.getComputedStyle(shield).display;
		// With our elements' display truly set, we are free to transition them! Thanks, Tim! ♡
		reveal();
	} else {
		chrome.runtime.sendMessage({action: "echoWithCallback", echoAction: "changeTip"}, reveal);
	}
	function reveal() {
		popup.classList.add("reveal");
		shield.classList.add("reveal");
		popupState = "active";
		chrome.runtime.sendMessage({action: "showX"});
		shield.addEventListener("click", deactivate, false);
	}
}
function deactivate() {
	shield.removeEventListener("click", deactivate, false);
	if (popupStage == "scanning") {
		chrome.runtime.sendMessage({action: "echo", echoAction: "pauseScan"})
	}
	popup.addEventListener("transitionend", function hide() {
		popup.hidden = true;
		shield.hidden = true;
		popup.removeEventListener("transitionend", hide, false);
		popupState = "inactive";
	}, false);
	popup.classList.remove("reveal");
	shield.classList.remove("reveal");
	popupState = "deactivating";
	chrome.runtime.sendMessage({action: "noX"});
}