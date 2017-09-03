/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
Components.utils.import("resource://gre/modules/Services.jsm");
var loaded = {};
addEventListener("DOMContentLoaded", pageSetup);
addEventListener("pageshow", pageSetup);
function pageSetup() {
	if ( (/:\/\/[a-zA-Z\d\-]+\.deviantart\.com\/favourites\//).test(content.location.href) ) {
		if (!loaded.findLove) {
			Services.scriptloader.loadSubScriptWithOptions("chrome://DeviantLoveWebExt/content/core/detector.js", {
				target: loaded,
				charset: "UTF-8",
				ignoreCache: true
			});
		}
		sendAsyncMessage("deviantlove@pikadudeno1.com:foundLove", loaded.findLove(content));
		addEventListener("contextmenu", checkForArtistLove);
		addEventListener("pagehide", (event) => {
			if (event.target != content.document) { return; }
			pageTeardown();
		});
	}
}
if (content.document.readyState == "interactive" || content.document.readyState == "complete") {
	pageSetup();
}
function pageTeardown() {
	sendAsyncMessage("deviantlove@pikadudeno1.com:lostLove");
	removeEventListener("contextmenu", checkForArtistLove);
	removeEventListener("pagehide", pageTeardown);
}
function checkForArtistLove(event) {
	if (event.target.matches("#gruze-main a.u")) {
		sendSyncMessage("deviantlove@pikadudeno1.com:showArtistLove", event.target.textContent);
	} else {
		sendSyncMessage("deviantlove@pikadudeno1.com:noArtistLove");
	}
}

addMessageListener("deviantlove@pikadudeno1.com:disable", function frameScriptShutdown(msg) {
	/* Workaround for bug 1202125 in non-multiprocess Firefox, using Wladimir Palant's idea:
	https://palant.de/2014/11/19/unloading-frame-scripts-in-restartless-extensions */
	if (msg.data != Components.stack.filename) { return; }
	removeEventListener("DOMContentLoaded", pageSetup);
	removeEventListener("pageshow", pageSetup);
	pageTeardown();
	removeMessageListener("deviantlove@pikadudeno1.com:disable", frameScriptShutdown);
});