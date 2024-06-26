/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.src.mjs for the complete legal stuff.
*/
// Some WebExtension features are not easily feature-detected. Anything that must be gated by browser & version will be dealt with here.
// There are currently no checks that concern browsers that don't support Promise-returning browser.* APIs.

export let allowSyncByBrowser = Promise.resolve(true);
if (globalThis.browser?.runtime?.getBrowserInfo) {
	let versionCheckResults = browser.runtime.getBrowserInfo().then(versionCheck);
	allowSyncByBrowser = versionCheckResults.then((results) => { return !results.disableSyncByBrowser; });
}

async function versionCheck() {
	var results = {};
	var {name, version} = await browser.runtime.getBrowserInfo();
	var {os} = await browser.runtime.getPlatformInfo();
	// Firefox for Android's chrome.storage.sync won't actually sync until an unknown future version.
	if (name == "Firefox" && os == "android" && parseInt(version) < Infinity) {
		results.disableSyncByBrowser = true;
	}
	// "Fennec" (old Android Firefox) never synced chrome.storage.sync.
	if (name == "Fennec") {
		results.disableSyncByBrowser = true;
	}
	return results;
}
chrome.runtime.onMessage.addListener(({action}, buddy, callback) => {
	if (action == "checkSyncByBrowserSupport") { allowSyncByBrowser.then(callback); return true; }
});