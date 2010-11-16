/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
// This code is very reliant on expando properties set on XPCNativeWrapper-wrapped windows.
// However, it appears that they don't survive pagehides.

window.addEventListener("load", function() {
	var goodies = {};
	function loadGoodies() {
		var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
			.getService(Components.interfaces.mozIJSSubScriptLoader);
		loader.loadSubScript("chrome://DeviantLove/content/core/detector.js", goodies);
		loader.loadSubScript("chrome://DeviantLove/content/core/jquery.js");
		goodies.$ = $;
		$.noConflict(true);
	}
	document.getElementById("appcontent").addEventListener("DOMContentLoaded", pageMod, false);
	document.getElementById("appcontent").addEventListener("pageshow", pageMod, false);
	function pageMod(event) {
		var win = event.originalTarget.defaultView;
		if (!win.DeviantLoveCleanup &&
			(/http:\/\/[a-zA-Z\d\-]+\.deviantart\.com\/favourites\//).test(win.location)) {
			if (!goodies.loveDetector) {loadGoodies();};
			win.DeviantLoveCleanup = goodies.loveDetector(loveFound, win);
		}
	}
	function loveFound(pageData, win) {
		win.DeviantLove = pageData;
		checkActiveness();
	}
	document.getElementById("appcontent").addEventListener("pagehide", function(event) {
		var win = event.originalTarget.defaultView;
		if (win.DeviantLoveCleanup) {win.DeviantLoveCleanup();};
		win.DeviantLove = null;
		checkActiveness();
	}, false);
	// From https://developer.mozilla.org/en/Code_snippets/Tabbed_browser#Detecting_tab_selection
	gBrowser.tabContainer.addEventListener("TabSelect", checkActiveness, false);

	var heart = document.getElementById("Deviant-Love-Heart");
	function checkActiveness() {
		var lovePresent = Boolean(content.DeviantLove);
		heart.hidden = !lovePresent;
	}
	heart.addEventListener("command", function() {

	}, false);
}, false);
