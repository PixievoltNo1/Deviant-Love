/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
var port = browser.runtime.connect();
const messageActions = {
	setPrefs({prefs}) {
		browser.storage.local.set(prefs);
	},
	importPrefs({prefs}) {
		// TODO: Make sure imported prefs don't override what's in browser.storage.sync
		browser.storage.local.set(prefs);
	},
	sendPrefs() {
		browser.storage.local.get().then( (prefs) => {
			port.postMessage({action: "allPrefs", prefs});
		} );
	}
}
port.onMessage.addListener((thing) => {
	messageActions[thing.action](thing);
});
browser.storage.onChanged.addListener((changes, areaName) => {
	if (areaName != "local") { return; }
	var newPrefs = {};
	for (let [key, {newValue}] of Object.entries(changes)) {
		newPrefs[key] = newValue;
	}
	port.postMessage({action: "changedPrefs", newPrefs});
});