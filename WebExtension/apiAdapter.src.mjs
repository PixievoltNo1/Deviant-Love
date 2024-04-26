/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.src.mjs for the complete legal stuff.
*/
export function getL10nMsg(msgName, replacements) {
	return chrome.i18n.getMessage(msgName, replacements);
}
export var storageArea = chrome.storage.local;
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