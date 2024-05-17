/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.src.mjs for the complete legal stuff.
*/
"use strict";

function favesPageSetup() {
	var oldUrl = "", retryFindLove = false, panelTeardown = null, artistNamesTeardown = null;
	var pageObserver = new MutationObserver(reactToPage);
	pageObserver.observe(document.body, { childList: true, subtree: true });
	function reactToPage() {
		if (location.toString() == oldUrl && retryFindLove == false) { return; }
		uiTeardown();
		let [status, love] = findLove();
		retryFindLove = (status == "fetchable" && love.retryable);
		oldUrl = location.toString();
		chrome.runtime.sendMessage({ action: "showLove" });
		panelTeardown = panelSetup(love);
		artistNamesTeardown = (status != "broken") && artistNamesSetup();
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