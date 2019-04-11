/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.esm.js for the complete legal stuff.
*/
"use strict";

var mirrorBlacklist = ["syncError"];
function checkForUnsync(changes, areaName) {
	if (Object.keys(changes).every( (key) => { return mirrorBlacklist.includes(key); } )) {
		return;
	}
	if (areaName == "local" && !("lastSaved" in changes)) {
		chrome.storage.local.set({ lastSaved: (new Date()).toISOString() });
	} else if ("lastSaved" in changes) {
		mirrorByBrowser(areaName);
	}
}
var localGet = new Promise((resolve) => { chrome.storage.local.get("lastSaved", resolve); });
var syncGet = new Promise((resolve) => { chrome.storage.sync.get("lastSaved", resolve); });
Promise.all([localGet, syncGet, allowSyncByBrowser]).then(([localVal, syncVal, allowed]) => {
	if (!syncVal || !allowed) {
		// The browser forbids use of chrome.storage.sync or doesn't actually sync it
		return;
	}
	chrome.storage.onChanged.addListener(checkForUnsync);
	var localSaveTime = localVal.lastSaved, syncSaveTime = syncVal.lastSaved;
	if (syncSaveTime == null) {
		chrome.storage.local.set({ lastSaved: (new Date()).toISOString() });
		// This will trigger mirroring in checkForUnsync
	} else if (localSaveTime == null) {
		mirrorByBrowser("sync");
	} else if (syncSaveTime != localSaveTime) {
		if (Date.parse(syncSaveTime) > Date.parse(localSaveTime)) {
			mirrorByBrowser("sync");
		} else {
			mirrorByBrowser("local");
		}
	}
});
function mirrorByBrowser(source) {
	var dest = (source == "sync") ? "local" : "sync";
	chrome.storage.onChanged.removeListener(checkForUnsync);
	chrome.storage[source].get(null, function(allData) {
		for (let blacklisted of mirrorBlacklist) {
			delete allData[blacklisted];
		}
		chrome.storage[dest].set(allData, () => {
			if (chrome.runtime.lastError) {
				chrome.storage.local.set({syncError: chrome.runtime.lastError.message});
			} else {
				chrome.storage.local.remove(["syncError"]);
			}
			chrome.storage.onChanged.addListener(checkForUnsync);
		});
	});
}