/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
"use strict";

function panelSetup(love) {

var modal = document.createElement("dialog");
modal.id = "DeviantLoveModal";
document.body.appendChild(modal);
var panel = document.createElement("iframe");
panel.id = "DeviantLovePanel";
var shield = document.createElement("div");
shield.id = "DeviantLoveShield";
shield.addEventListener("click", () => modal.close());
modal.append(shield, panel);
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
var panelState = "inactive";
var panelInitialized = false;

chrome.runtime.onMessage.addListener(messageHandler);
function messageHandler(thing, buddy, callback) {
	switch (thing.action) {
		case "spark":
			if (panelState == "inactive") {
				activate();
			} else if (panelState == "active") {
				modal.close();
			}
			break;
		case "artistRequested":
			if (panelState == "inactive") { activate(thing.artist); }
			break;
		case "getStartData":
			callback({ love, mobile: mobileCheck.matches });
			break;
	}
}

var mobileCheck = matchMedia("not all and (min-width: 550px)");
function handleMobile() {
	var {matches} = mobileCheck;
	panel.classList.toggle("mobile", matches);
	shield.classList.toggle("mobile", matches);
	chrome.runtime.sendMessage({action: "echo", echoAction: "setMobile", mobile: matches});
}
handleMobile();
mobileCheck.addEventListener("change", handleMobile);

async function activate(firstDeviant) {
	panelState = "preparing";
	if (!panelInitialized) {
		if (love.getFullInfo) {
			love = await love.getFullInfo();
		}
		chrome.runtime.onMessage.addListener( function startHelper(thing) {
			if (thing.action == "panelReady") {
				panelInitialized = true;
				if (firstDeviant) {
					chrome.runtime.sendMessage(
						{action: "echo", echoAction: "artistRequested", artist: firstDeviant}
					);
				}
				reveal();
				chrome.runtime.onMessage.removeListener(startHelper);
			}
		} );
		panel.contentWindow.location.replace( chrome.runtime.getURL("report/popup.html") );
	} else {
		chrome.runtime.sendMessage({action: "echoWithCallback", echoAction: "showing"}, reveal);
	}
	function reveal() {
		modal.showModal();
		panelState = "active";
		chrome.runtime.sendMessage({action: "showX"});
		for (let icon of normalIcons) {
			icon.remove();
		}
		for (let icon of heartIcons) {
			document.head.appendChild(icon);
		}
		document.title = "Deviant Love - " + document.title;
	}
}
modal.addEventListener("close", () => {
	panelState = "inactive";
	chrome.runtime.sendMessage({action: "noX"});
	chrome.runtime.sendMessage({action: "echo", echoAction: "hiding"});
	for (let icon of heartIcons) {
		icon.remove();
	}
	for (let icon of normalIcons) {
		document.head.appendChild(icon);
	}
	document.title = document.title.replace("Deviant Love - ", "");
});

return () => {
	modal.remove();
	chrome.runtime.onMessage.removeListener(messageHandler);
	mobileCheck.removeEventListener("change", handleMobile);
};

}