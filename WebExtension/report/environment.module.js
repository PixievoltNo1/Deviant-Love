/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
import { start, store, showDeviant } from "./core.module.js";
import NanoEvents from "nanoevents";
export * from "../apiAdapter.module.js";

export var events = new NanoEvents();
chrome.runtime.sendMessage({action: "echoWithCallback", echoAction: "getStartData"},
	async function(startData) {
		await start(startData);
		chrome.runtime.sendMessage({action: "echo", echoAction: "panelReady"});
	}
);
chrome.runtime.onMessage.addListener(function(thing, buddy, callback) {switch (thing.action) {
	case "showing":
		var waitFor = [];
		var delay = (waitForThis) => { waitFor.push(waitForThis); };
		events.emit("visibilityChange", true, delay);
		Promise.all(waitFor).then(() => {
			callback();
		});
		return true;
	break;
	case "hiding":
		events.emit("visibilityChange", false);
	break;
	case "artistRequested":
		showDeviant(thing.artist);
	break;
	case "setMobile":
		store.set({mobile: thing.mobile});
	break;
}});
export function closeDeviantLove() {
	chrome.runtime.sendMessage({action: "echo", echoAction: "spark"});
}

$(document).delegate("a", "click", function(event) {
	if (event.button == 0) { window.open(this.href); }
	event.preventDefault();
} );