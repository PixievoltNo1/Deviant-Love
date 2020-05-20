/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
import { start, mobile, showDeviant } from "./core.esm.js";
import NanoEvents from "nanoevents";
export * from "../apiAdapter.esm.js";

export var events = new NanoEvents();
chrome.runtime.sendMessage({action: "echoWithCallback", echoAction: "getStartData"},
	async function(startData) {
		await start(startData);
		chrome.runtime.sendMessage({action: "echo", echoAction: "panelReady"});
	}
);
history.pushState(true, "");
var historyVisibleState = true;
chrome.runtime.onMessage.addListener(function(thing, buddy, callback) {switch (thing.action) {
	case "showing":
		var waitFor = [];
		var delay = (waitForThis) => { waitFor.push(waitForThis); };
		events.emit("visibilityChange", true, delay);
		Promise.all(waitFor).then(() => {
			callback();
		});
		if (history.state == null) {
			history.pushState(true, "");
		}
		historyVisibleState = true;
		return true;
	break;
	case "hiding":
		events.emit("visibilityChange", false);
		if (history.state != null) {
			history.back();
		}
		historyVisibleState = false;
	break;
	case "artistRequested":
		showDeviant(thing.artist);
	break;
	case "setMobile":
		mobile.set(thing.mobile);
	break;
}});
export function closeDeviantLove() {
	chrome.runtime.sendMessage({action: "echo", echoAction: "spark"});
}

document.addEventListener("click", (event) => {
	var link = event.target.closest("a");
	if (!link) { return; }
	window.open(link.href);
	event.preventDefault();
});
window.addEventListener("popstate", () => {
	if ( (history.state != null) != historyVisibleState ) {
		chrome.runtime.sendMessage({ action: "echo", echoAction: "spark" });
	}
});