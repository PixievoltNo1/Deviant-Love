/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
"use strict";
// Some WebExtension features are not easily feature-detected. Anything that must be gated by browser & version will be dealt with here.
// There are currently no checks that concern browsers that don't support Promise-returning browser.* APIs.

var allowSyncByBrowser = Promise.resolve(true);
if (window.browser && browser.runtime.getBrowserInfo) {
	let versionCheckResults = browser.runtime.getBrowserInfo().then(versionCheck);
	allowSyncByBrowser = versionCheckResults.then((results) => { return !results.disableSyncByBrowser; });
}

function versionCheck({name, version}) {
	var results = {};
	// Firefox for Android <56 doesn't implement chrome.pageAction.show correctly. Older versions have more deficiencies.
	if (name == "Fennec" && parseInt(version) < 56) {
		browser.management.uninstallSelf({
			showConfirmDialog: true,
			dialogMessage: "Deviant Love will not run correctly in versions of Firefox for Android older than 56. Please update your browser before using Deviant Love."
		});
	}
	// Firefox for Android's chrome.storage.sync won't actually sync until an unknown future version.
	if (name == "Fennec" && parseInt(version) < Infinity) {
		results.disableSyncByBrowser = true;
	}
	return results;
}
(window.browser || chrome).runtime.onMessage.addListener(({action}, buddy, callback) => {
	if (action == "checkSyncByBrowserSupport") { allowSyncByBrowser.then(callback); return true; }
});