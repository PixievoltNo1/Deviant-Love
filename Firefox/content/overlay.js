/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
/* At the cost of readability, the identifier "DeviantLove" is used a few different ways in this code. I'd rewrite it to use different identifiers for each purpose if I could think of identifiers as brief as "DeviantLove" without risking collisions with other extensions.
	- The global variable DeviantLove is used as a "message center" for communication between this file and the sidebar, as well as a second parameter for loadSubScript.
	- doc.DeviantLove stores per-page information.
	- document.getElementById("sidebar").contentWindow.DeviantLove is set by the sidebar to inform this file that it is present and loaded.
*/

var DeviantLove = {};

window.addEventListener("load", function() {
	var currentFocus = 0;
	var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
		.getService(Components.interfaces.mozIJSSubScriptLoader);
	DeviantLove.loader = loader; // so that it can be available to nextTip
	DeviantLove.l10n = document.getElementById("DeviantLoveMessages");
	
	gBrowser.addEventListener("DOMContentLoaded", setup, false);
	gBrowser.addEventListener("pageshow", setup, false);
	function setup(event) {
		var doc = event.originalTarget;
		if (!doc.DeviantLove &&
			(/http:\/\/[a-zA-Z\d\-]+\.deviantart\.com\/favourites\//).test(doc.URL)) {
			doc.DeviantLove = {};
			if (!DeviantLove.findLove) {
				loader.loadSubScript("chrome://DeviantLove/content/core/detector.js", DeviantLove);
			};
			doc.DeviantLove.pageData = DeviantLove.findLove(doc.defaultView);
			checkLove();
		}
	}
	gBrowser.addEventListener("pagehide", function(event) {
		var doc = event.originalTarget;
		if (doc.DeviantLove) {
			doc.DeviantLove = null;
			checkLove();
		}
	}, false);
	// From https://developer.mozilla.org/en/Code_snippets/Tabbed_browser#Detecting_tab_selection
	gBrowser.tabContainer.addEventListener("TabSelect", checkLove, false);

	var heart = document.getElementById("DeviantLoveHeart");
	function checkLove() {
		var lovePresent = Boolean(content.document.DeviantLove);
		heart.hidden = !lovePresent;
	}
	heart.addEventListener("command", summonRawkitude, false);
	
	var artistCheck = document.getElementById("DeviantLoveArtistCheck");
	document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function() {
		if (gContextMenu.target.ownerDocument.DeviantLove &&
			gContextMenu.target.mozMatchesSelector(".folderview-art a.u")) {
			artistCheck.label = DeviantLove.l10n.getFormattedString("artistCheck", [gContextMenu.target.textContent]);
			artistCheck.hidden = false;
		} else {
			artistCheck.hidden = true;
		}
	}, false);
	artistCheck.addEventListener("command", summonRawkitude, false);
	
	function summonRawkitude(event) {
		var doc = content.document;
		if (doc.DeviantLove.focus == currentFocus) {
			if (this == heart) {
				toggleSidebar("DeviantLoveSidebar");
			} else if (!document.getElementById("sidebar").contentWindow.DeviantLove) {
				DeviantLove.firstDeviant = gContextMenu.target.textContent;
				toggleSidebar("DeviantLoveSidebar");
			} else {
				document.getElementById("sidebar").contentWindow.showDeviant(gContextMenu.target.textContent);
			}
		} else {
			if (!DeviantLove.popupText) {
				loader.loadSubScript("chrome://DeviantLove/locale/popupText.js", DeviantLove);
			}
			DeviantLove.currentPageData = doc.DeviantLove.pageData;
			if (this == artistCheck) {DeviantLove.firstDeviant = gContextMenu.target.textContent;};
			delete DeviantLove.currentScanData;
			doc.DeviantLove.focus = ++currentFocus;
			if (document.getElementById("sidebar").contentWindow.DeviantLove) {
				document.getElementById("sidebar").contentWindow.restart();
			}
			toggleSidebar("DeviantLoveSidebar", true);
		}
	}
}, false);

DeviantLove.getTip = function() {
	if (!DeviantLove.tips) {
		DeviantLove.loader.loadSubScript("chrome://DeviantLove/locale/TipOfTheMoment.js", DeviantLove);
	}
	// Unlike in the Chrome version, there is no need for discrepancies between nextTip and JavaScript array indexes.
	var nextTip = Application.prefs.getValue("extensions.deviantlove.nexttip", 0);
	var returnValue = DeviantLove.tips[nextTip];
	nextTip++;
	if (nextTip == DeviantLove.tips.length) {nextTip = 0;};
	Application.prefs.setValue("extensions.deviantlove.nexttip", nextTip);
	return returnValue;
}