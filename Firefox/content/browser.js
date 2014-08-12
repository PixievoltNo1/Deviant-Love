/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
/* At the cost of readability, the identifier "DeviantLove" is used a few different ways in this code. I'd rewrite it to use different identifiers for each purpose if I could think of identifiers as brief as "DeviantLove" without risking collisions with other extensions.
	- window.DeviantLove is used as a "message center" for communication between this file and others, as well as a second parameter for loadSubScript and import.
	- doc.DeviantLove stores per-page information.
	- document.getElementById("sidebar").contentWindow.DeviantLove is set by the sidebar to inform this file that it is present and loaded.
*/
"use strict";
window.DeviantLove = {};

(function() {
// TODO: Set doc.DeviantLove for tabs that were open when Deviant Love was installed
	var cleanupTasks = [];
	var currentFocus = 0;
	var contextMenuWhitelistingDone;
	var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
		.getService(Components.interfaces.mozIJSSubScriptLoader);
	Components.utils.import("chrome://DeviantLove/content/global.js", DeviantLove);
	function removalTask(node) {
		return Element.prototype.removeChild.bind(node.parentNode, node);
	}
	
	var stylesheet = document.createProcessingInstruction("xml-stylesheet",
		'href="chrome://DeviantLove/content/browser.css" type="text/css"');
	document.insertBefore(stylesheet, document.firstChild);
	cleanupTasks.push( removalTask(stylesheet) );
	
	var heart = document.createElement("button");
	heart.id = "DeviantLoveHeart"; heart.className = "plain urlbar-icon"; heart.hidden = true;
	let (heartDest = document.getElementById("urlbar-icons")) {
		heartDest.insertBefore(heart, heartDest.firstChild);
	}
	function updateHeart(closing) {
		if (content.document.DeviantLove) {
			heart.hidden = false;
			var clickToClose = closing !== true && (content.document.DeviantLove.focus == currentFocus) &&
				sidebar.hasAttribute("checked");
			heart.classList[clickToClose ? "add" : "remove"]("clickToClose");
			heart.tooltipText = clickToClose ? DeviantLove.l10n.getString("heartX") : "Deviant Love"; 
		} else {
			heart.hidden = true;
		}
	}
	heart.addEventListener("command", summonRawkitude, false);
	cleanupTasks.push( removalTask(heart) );
	
	gBrowser.addEventListener("DOMContentLoaded", tabSetup, false);
	gBrowser.addEventListener("pageshow", tabSetup, false);
	gBrowser.addEventListener("pagehide", tabTeardown, false);
	// From https://developer.mozilla.org/en-US/docs/Code_snippets/Tabbed_browser#Detecting_tab_selection
	gBrowser.tabContainer.addEventListener("TabSelect", updateHeart, false);
	function tabSetup(event) {
		var doc = event.originalTarget;
		if (!doc.DeviantLove &&
			(/http:\/\/[a-zA-Z\d\-]+\.deviantart\.com\/favourites\//).test(doc.URL)) {
			doc.DeviantLove = {};
			if (!DeviantLove.findLove) {
				loader.loadSubScript("chrome://DeviantLove/content/core/detector.js", DeviantLove);
			};
			doc.DeviantLove.pageData = DeviantLove.findLove(doc.defaultView);
			updateHeart();
		}
	}
	function tabTeardown(event) {
		var doc = event.originalTarget;
		if (doc.DeviantLove) {
			doc.DeviantLove = null;
			updateHeart();
		}
	}
	cleanupTasks.push( function() {
		gBrowser.removeEventListener("DOMContentLoaded", tabSetup, false);
		gBrowser.removeEventListener("pageshow", tabSetup, false);
		gBrowser.removeEventListener("pagehide", tabTeardown, false);
		gBrowser.tabContainer.removeEventListener("TabSelect", updateHeart, false);
	} );
	
	var sidebar = document.createElement("broadcaster");
	sidebar.id = "DeviantLoveSidebar"; sidebar.setAttribute("group", "sidebar");
	sidebar.setAttribute("sidebarurl", "chrome://DeviantLove/content/sidebar.html");
	sidebar.setAttribute("sidebartitle", "Deviant Love");
	document.getElementById("mainBroadcasterSet").appendChild(sidebar);
	cleanupTasks.push( removalTask(sidebar) );

	// The label property won't work for freshly-made elements. Some XBL thing.
	// Deviant Love doesn't actually need a reload button, but it's the most concise way to inform the user that the sidebar's report is static.
	var reload = document.createElement("button");
	reload.id = "DeviantLoveReload"; reload.setAttribute("label", "Reload"); reload.hidden = true;
	let (reloadDest = document.getElementById("sidebar-header")) {
		reloadDest.insertBefore(reload, reloadDest.firstChild.nextSibling);
	}
	cleanupTasks.push( removalTask(reload) );
	
	var artistCheck = document.createElement("menuitem");
	artistCheck.id = "DeviantLoveArtistCheck"; artistCheck.className = "menuitem-iconic";
	artistCheck.setAttribute("label", DeviantLove.l10n.get("artistCheck", ["________"])); // For Fx extensions like Menu Editor
	var webContextMenu = document.getElementById("contentAreaContextMenu");
	webContextMenu.insertBefore(artistCheck, webContextMenu.firstChild);
	function artistCheckRequested() {
		if (gContextMenu.target.ownerDocument.DeviantLove &&
			gContextMenu.target.mozMatchesSelector(".folderview-art a.u")) {
			artistCheck.label = DeviantLove.l10n.get("artistCheck", [gContextMenu.target.textContent]);
			artistCheck.hidden = false;
		} else {
			artistCheck.hidden = true;
		}
	}
	webContextMenu.addEventListener("popupshowing", artistCheckRequested);
	artistCheck.addEventListener("command", summonRawkitude);
	cleanupTasks.push( removalTask(artistCheck) );
	cleanupTasks.push( function() {
		webContextMenu.removeEventListener("popupshowing", artistCheckRequested);
	} );
	
	function summonRawkitude(event) {
		if (!contextMenuWhitelistingDone) {
			let whitelist = document.querySelectorAll("#context-openlink, #context-openlinkintab, " +
				"#context-copylink, #context-undo, #context-sep-undo, #context-cut, #context-copy, " +
				"#context-paste, #context-delete, #context-sep-paste, #context-selectall");
			for (let i = 0; i < whitelist.length; ++i) {
				whitelist[i].classList.add("DeviantLoveWhitelisted");
			}
			contextMenuWhitelistingDone = true;
			cleanupTasks.push( function() {
				let whitelisted = document.getElementsByClassName("DeviantLoveWhitelisted");
				for (let i = 0; i < whitelisted.length; ++i) {
					whitelisted[i].classList.remove("DeviantLoveWhitelisted");
				}
			} );
		}
		
		var doc = content.document;
		if (doc.DeviantLove.focus == currentFocus) {
			if (this == heart) {
				toggleSidebar("DeviantLoveSidebar");
			} else if (!document.getElementById("sidebar").contentWindow.DeviantLove) {
				DeviantLove.firstDeviant = gContextMenu.target.textContent;
				toggleSidebar("DeviantLoveSidebar", true);
			} else {
				document.getElementById("sidebar").contentWindow.showDeviant(gContextMenu.target.textContent);
			}
		} else {
			DeviantLove.currentPageData = doc.DeviantLove.pageData;
			if (this == artistCheck) {DeviantLove.firstDeviant = gContextMenu.target.textContent;};
			delete DeviantLove.currentScanData;
			doc.DeviantLove.focus = ++currentFocus;
			if (document.getElementById("sidebar").contentWindow.DeviantLove) {
				document.getElementById("sidebar").contentWindow.restart();
			}
			toggleSidebar("DeviantLoveSidebar", true);
		}
		
		updateHeart();
	}
	// TODO: Add a cleanupTask to ensure the sidebar is closed
	DeviantLove.iIsDed = function() {
		updateHeart(true);
	}
	DeviantLove.shuttingDown = function() {
		cleanupTasks.forEach( function(task) { task(); } );
	}
})();

DeviantLove.getTip = function() {
	var tips = JSON.parse(DeviantLove.l10n.getString("TipOfTheMoment"));
	// Unlike in the Chrome version, there is no need for discrepancies between nextTip and JavaScript array indexes.
	var nextTip = Application.prefs.getValue("extensions.deviantlove.nexttip", 0);
	var returnValue = tips[nextTip];
	nextTip++;
	if (nextTip == tips.length) {nextTip = 0;};
	Application.prefs.setValue("extensions.deviantlove.nexttip", nextTip);
	return returnValue;
}