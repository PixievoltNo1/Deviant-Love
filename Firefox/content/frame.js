/* Workaround for bug 1202125 in non-multiprocess Firefox. Disable messages are only honored if
they're from the same version of Deviant Love that provided the disable key. */
var [disableKey] = sendSyncMessage("deviantlove@pikadudeno1.com:getDisableKey");

addEventListener("DOMContentLoaded", pageSetup, false);
addEventListener("pageshow", pageSetup, false);
function pageSetup() {
	// TODO: Port tabSetup from browserMod to here
	addEventListener("contextmenu", checkForArtistLove);
	addEventListener("pagehide", pageTeardown, false);
}
function pageTeardown() {
	sendSyncMessage("deviantlove@pikadudeno1.com:lostLove");
	removeEventListener("contextmenu", checkForArtistLove);
	removeEventListener("pagehide", pageTeardown, false);
}
function checkForArtistLove(event) {
	if (event.target.mozMatchesSelector(".folderview-art a.u")) {
		sendSyncMessage("deviantlove@pikadudeno1.com:showArtistLove", event.target.textContent);
	} else {
		sendSyncMessage("deviantlove@pikadudeno1.com:noArtistLove");
	}
}

// TODO: Implement handling of disable message