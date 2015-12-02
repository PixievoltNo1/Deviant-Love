/* Workaround for bug 1202125 in non-multiprocess Firefox. Disable messages are only honored if
they're from the same version of Deviant Love that provided the disable key. */
var [disableKey] = sendSyncMessage("deviantlove@pikadudeno1.com:getDisableKey");

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
	if (msg.data != disableKey) { return; }
	removeEventListener("DOMContentLoaded", pageSetup);
	removeEventListener("pageshow", pageSetup);
	pageTeardown();
	removeMessageListener("deviantlove@pikadudeno1.com:disable", frameScriptShutdown);
});