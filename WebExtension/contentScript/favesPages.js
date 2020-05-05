/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
"use strict";

function favesPageSetup() {
	var oldUrl = "", panelTeardown = null, artistNamesTeardown = null;
	var pageObserver = new MutationObserver(reactToPage);
	pageObserver.observe(document.body, { childList: true, subtree: true });
	function reactToPage() {
		if (location.toString() == oldUrl) { return; }
		uiTeardown();
		try {
			var love = findLove();
		} catch (o_o) {
			oldUrl = "";
			return;
		}
		oldUrl = location.toString();
		chrome.runtime.sendMessage({ action: "showLove" });
		panelTeardown = panelSetup(love);
		artistNamesTeardown = artistNamesSetup();
	}
	reactToPage();
	function uiTeardown() {
		chrome.runtime.sendMessage({ action: "hideLove" });
		if (panelTeardown) { panelTeardown(); }
		if (artistNamesTeardown) { artistNamesTeardown(); }
		panelTeardown = null, artistNamesTeardown = null;
	}
	// Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1485863
	function pageHideHandler() {
		chrome.runtime.sendMessage({ action: "hideLove" });
	}
	window.addEventListener("pagehide", pageHideHandler);
	return () => {
		pageObserver.disconnect();
		window.removeEventListener("pagehide", pageHideHandler);
		uiTeardown();
	};
}