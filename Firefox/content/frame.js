/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
addEventListener("DOMContentLoaded", pageSetup);
addEventListener("pageshow", pageSetup);
function pageSetup() {
	// TODO: Port tabSetup from browserMod to here
	/*
	addEventListener("contextmenu", checkForArtistLove);
	addEventListener("pagehide", pageTeardown);
	*/
}
function pageTeardown() {
	sendSyncMessage("deviantlove@pikadudeno1.com:lostLove");
	removeEventListener("contextmenu", checkForArtistLove);
	removeEventListener("pagehide", pageTeardown);
}
function checkForArtistLove(event) {
	if (event.target.mozMatchesSelector(".folderview-art a.u")) {
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