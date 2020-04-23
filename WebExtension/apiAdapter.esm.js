/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
export function getL10nMsg(msgName, replacements) {
	return chrome.i18n.getMessage(msgName, replacements);
}
export function retrieve(keys) {
	var request = new $.Deferred();
	chrome.storage.local.get(keys, function(data) {
		for (var key in data) {
			var item = data[key];
			if (typeof item == "string") {
				data[key] = JSON.parse(item);
			}
		}
		request.resolve(data);
	});
	return request.promise();
}
export function store(key, data) {
	if (typeof data != "number" && typeof data != "boolean") {
		data = JSON.stringify(data);
	}
	var item = {};
	item[key] = data;
	chrome.storage.local.set(item);
}
export async function subscribeToSyncStatus(callback) {
	var localGet = new Promise((resolve) => { chrome.storage.local.get("syncError", resolve); });
	var syncGet = new Promise((resolve) => { chrome.storage.sync.get("lastSaved", resolve); });
	var supportCheck = new Promise((resolve) => {
		chrome.runtime.sendMessage({action: "checkSyncByBrowserSupport"}, resolve);
	});
	var [localVal, syncVal, allowed] = await Promise.all([localGet, syncGet, supportCheck]);
	if (!syncVal || !allowed) {
		// The browser forbids use of chrome.storage.sync or doesn't actually sync it
		callback({unsupported: "browser"});
		return;
	}
	var lastSaved = syncVal.lastSaved;
	callback({syncError: localVal.syncError, lastSaved});
	chrome.storage.onChanged.addListener((changes, areaName) => {
		if (areaName == "local" && "syncError" in changes && changes.syncError.newValue) {
			callback({syncError: changes.syncError.newValue, lastSaved});
		} else if (areaName == "sync" && "lastSaved" in changes) {
			lastSaved = changes.lastSaved.newValue;
			callback({lastSaved, syncError: undefined});
		}
	});
}