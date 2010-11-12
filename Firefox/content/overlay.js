/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/

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
	document.getElementById("appcontent").addEventListener("DOMContentLoaded", function(event) {
	// Using information obtained from https://developer.mozilla.org/en/Code_snippets/On_page_load
		var win = event.originalTarget.defaultView;
		if (win.location.toString().search(/http:\/\/[a-zA-Z\d\-]+\.deviantart\.com\/favourites\//) == 0) {
			if (!goodies.loveDetector) {loadGoodies();};
			goodies.loveDetector(loveFound, win);
		}
	}, false);
	function loveFound(pageData, win) {
		win.DeviantLove = "active";
		checkActiveness();
	}
	document.getElementById("appcontent").addEventListener("pagehide", function(event) {
		var win = event.originalTarget.defaultView;
		if (win.DeviantLove) { win.DeviantLove = "sleeping"; }
		checkActiveness();
	}, false);
	document.getElementById("appcontent").addEventListener("pageshow", function(event) {
		var win = event.originalTarget.defaultView;
		if (win.DeviantLove) { win.DeviantLove = "active"; }
		checkActiveness();
	}, false);
	// From https://developer.mozilla.org/en/Code_snippets/Tabbed_browser#Detecting_tab_selection
	gBrowser.tabContainer.addEventListener("TabSelect", checkActiveness, false);

	var heart = document.getElementById("Deviant-Love-Heart");
	function checkActiveness() {
		if (content.DeviantLove == "active") {
			heart.hidden = false;
		} else {
			heart.hidden = true;
		}
	}
	heart.addEventListener("command", function() {
		
	}, false);
}, false);
