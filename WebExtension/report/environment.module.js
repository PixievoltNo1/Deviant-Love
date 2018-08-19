/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
if (!(window.chrome && chrome.runtime)) { window.chrome = browser; }
import { beginPreparations, nextTip, store } from "./core.module.js";

export var adapter = apiAdapter;

chrome.runtime.sendMessage({action: "echoWithCallback", echoAction: "getLove"},
	function(love) {
		beginPreparations(love);
		if (location.hash) {showDeviant(location.hash.slice(1))};
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
}});

$(document).delegate("a", "click", function(event) {
	if (event.button == 0) { window.open(this.href); }
	event.preventDefault();
} );