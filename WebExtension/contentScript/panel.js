/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
"use strict";

function panelSetup(love) {

var panel = document.createElement("iframe");
panel.id = "DeviantLovePanel";
panel.classList.add("hide");
document.body.appendChild(panel);
var shield = document.createElement("div");
shield.id = "DeviantLoveShield";
shield.classList.add("hide");
document.body.appendChild(shield);
var heartIcons = [
	Object.assign(document.createElement("link"), {
		href: chrome.runtime.getURL("images/heart/48.png"),
		rel: "icon",
		sizes: "48x48"
	}),
	Object.assign(document.createElement("link"), {
		href: chrome.runtime.getURL("images/heart/scalable.svg"),
		rel: "icon",
		sizes: "any",
		type: "image/svg+xml"
	}),
];
var normalIcons = Array.from(document.querySelectorAll("link[rel~=icon]"));
var mobileCheck = matchMedia("not all and (min-width: 550px)");
var panelState = "inactive";
var panelInitialized = false;
var extraStartData = {};

chrome.runtime.onMessage.addListener(messageHandler);
function messageHandler(thing, buddy, callback) {
	switch (thing.action) {
		case "spark":
			if (panelState == "inactive") {
				activate();
			} else if (panelState == "active") {
				deactivate();
			}
			break;
		case "artistRequested":
			if (panelState == "inactive") { activate(thing.artist); }
			break;
		case "getStartData":
			callback(Object.assign({
				love,
				mobile: mobileCheck.matches,
			}, extraStartData));
			break;
	}
}

function handleMobile() {
	var {matches} = mobileCheck;
	panel.classList.toggle("mobile", matches);
	shield.classList.toggle("mobile", matches);
	chrome.runtime.sendMessage({action: "echo", echoAction: "setMobile", mobile: matches});
}
handleMobile();
mobileCheck.addListener(handleMobile);

return () => {
	panel.remove();
	shield.remove();
	chrome.runtime.onMessage.removeListener(messageHandler);
};

function activate(firstDeviant) {
	panelState = "preparing";
	if (!panelInitialized) {
		extraStartData.firstDeviant = firstDeviant;
		chrome.runtime.onMessage.addListener( function startHelper(thing) {
			if (thing.action == "panelReady") {
				delete extraStartData.firstDeviant;
				panelInitialized = true;
				reveal();
				chrome.runtime.onMessage.removeListener(startHelper);
			}
		} );
		panel.contentWindow.location.replace( chrome.runtime.getURL("report/popup.html") );
	} else {
		chrome.runtime.sendMessage({action: "echoWithCallback", echoAction: "showing"}, reveal);
	}
	function reveal() {
		panel.classList.remove("hide");
		shield.classList.remove("hide");
		panelState = "active";
		chrome.runtime.sendMessage({action: "showX"});
		shield.addEventListener("click", deactivate, false);
		for (let icon of normalIcons) {
			icon.remove();
		}
		for (let icon of heartIcons) {
			document.head.appendChild(icon);
		}
		document.title = "Deviant Love - " + document.title;
	}
}
function deactivate() {
	shield.removeEventListener("click", deactivate, false);
	panel.addEventListener("transitionend", function hide() {
		panel.removeEventListener("transitionend", hide, false);
		panelState = "inactive";
	}, false);
	panel.classList.add("hide");
	shield.classList.add("hide");
	panelState = "deactivating";
	chrome.runtime.sendMessage({action: "noX"});
	chrome.runtime.sendMessage({action: "echo", echoAction: "hiding"});
	for (let icon of heartIcons) {
		icon.remove();
	}
	for (let icon of normalIcons) {
		document.head.appendChild(icon);
	}
	document.title = document.title.replace("Deviant Love - ", "");
}

}