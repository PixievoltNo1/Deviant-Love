/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
import { start, store, showDeviant } from "./core.module.js";
export * from "../apiAdapter.module.js";

chrome.runtime.sendMessage({action: "echoWithCallback", echoAction: "getStartData"},
	async function(startData) {
		await start(startData);
		chrome.runtime.sendMessage({action: "echo", echoAction: "panelReady"});
	}
);
chrome.runtime.onMessage.addListener(function(thing, buddy, callback) {switch (thing.action) {
	case "showing":
		var waitFor = [];
		store.fire("beforeShow", (waitForThis) => { waitFor.push(waitForThis); });
		Promise.all(waitFor).then(() => {
			store.set({visible: true});
			callback();
		});
		return true;
	break;
	case "hiding":
		store.set({visible: false});
	break;
	case "artistRequested":
		showDeviant(thing.artist);
	break;
	case "setMobile":
		store.set({mobile: thing.mobile});
	break;
}});

$(document).delegate("a", "click", function(event) {
	if (event.button == 0) { window.open(this.href); }
	event.preventDefault();
} );