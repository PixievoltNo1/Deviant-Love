/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
if (!(window.chrome && chrome.runtime)) { window.chrome = browser; }

var mirrorBlacklist = ["syncError"];
chrome.storage.onChanged.addListener(checkForUnsync);
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
var localSaveTime = new Promise((resolve) => { chrome.storage.local.get("lastSaved", resolve); });
var syncSaveTime = new Promise((resolve) => { chrome.storage.sync.get("lastSaved", resolve); });
Promise.all([localSaveTime, syncSaveTime]).then(([localGet, syncGet]) => {
	if (!syncGet) {
		// We're in Firefox 52, which doesn't support sync storage
		chrome.storage.onChanged.removeListener(checkForUnsync);
		return;
	}
	var localSaveTime = localGet.lastSaved, syncSaveTime = syncGet.lastSaved;
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
		for (let blacklisted in mirrorBlacklist) {
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