/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
(function() {
	var cleanupTasks = [];
	var currentFocus, sidebarWindow;
	var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
		.getService(Components.interfaces.mozIJSSubScriptLoader);
	var {l10n, prefs, browserMod, loaded} =
		Components.utils.import("chrome://DeviantLove/content/global.js", {});
	function handleMessage(name, handler) {
		messageManager.addMessageListener("deviantlove@pikadudeno1.com:" + name, handler);
		cleanupTasks.push( function() {
			messageManager.removeMessageListener("deviantlove@pikadudeno1.com:" + name, handler);
		} );
	}
	function removalTask(node) {
		return Element.prototype.removeChild.bind(node.parentNode, node);
	}
	var foundLove = new WeakMap();
	window[browserMod] = {};

	var stylesheet = document.createProcessingInstruction("xml-stylesheet",
		'href="chrome://DeviantLove/content/browser.css" type="text/css"');
	document.insertBefore(stylesheet, document.firstChild);
	cleanupTasks.push( removalTask(stylesheet) );

	// Can't explain it, but using <image> with a click event instead of <button> with a command event seems to be the best (or most common) practice
	// Doing it that way ensures consistent "button" spacing with other extensions
	var heart = document.createElement("image");
	heart.id = "DeviantLoveHeart"; heart.className = "urlbar-icon"; heart.hidden = true;
	heart.setAttribute("src", "chrome://DeviantLoveWebExt/content/core/heart/scalable.svg");
	let heartDest = document.getElementById("urlbar-icons");
	heartDest.insertBefore(heart, heartDest.firstChild);
	function updateHeart() {
		if (foundLove.has(gBrowser.selectedBrowser)) {
			heart.hidden = false;
			var clickToClose = sidebarWindow && gBrowser.selectedBrowser == currentFocus;
			if (clickToClose) {
				heart.tooltipText = l10n.get("heartX");
				heart.setAttribute("src", "chrome://DeviantLove/content/heartClose.svg");
			} else {
				heart.tooltipText = "Deviant Love";
				heart.setAttribute("src", "chrome://DeviantLoveWebExt/content/core/heart/scalable.svg");
			}
		} else {
			heart.hidden = true;
		}
	}
	heart.addEventListener("click", summonRawkitude, false);
	cleanupTasks.push( removalTask(heart) );

	// Using info from https://developer.mozilla.org/en-US/docs/Code_snippets/Tabbed_browser
	gBrowser.tabContainer.addEventListener("TabSelect", updateHeart, false);
	gBrowser.tabContainer.addEventListener("TabClose", checkClosedTab, false);
	function checkClosedTab(event) {
		if (gBrowser.getBrowserForTab(event.target) == currentFocus) {
			currentFocus = null;
		}
	}
	handleMessage("foundLove", function(msg) {
		foundLove.set(msg.target, msg.data);
		updateHeart();
	});
	handleMessage("lostLove", function(msg) {
		foundLove.delete(msg.target);
		if (msg.target == currentFocus) {
			currentFocus = null;
		}
		updateHeart();
	});
	cleanupTasks.push( function() {
		gBrowser.tabContainer.removeEventListener("TabSelect", updateHeart, false);
		gBrowser.tabContainer.removeEventListener("TabClose", checkClosedTab, false);
	} );

	// Deviant Love doesn't actually need a reload button, but it's the most concise way to inform the user that the sidebar's report is static.
	var reload = document.createElement("button");
	reload.id = "DeviantLoveReload"; reload.setAttribute("label", "Reload"); reload.hidden = true;
	let reloadDest = document.getElementById("sidebar-header");
	reloadDest.insertBefore(reload, reloadDest.firstChild.nextSibling);
	cleanupTasks.push( removalTask(reload) );

	var artistCheck = document.createElement("menuitem");
	artistCheck.id = "DeviantLoveArtistCheck"; artistCheck.className = "menuitem-iconic";
	artistCheck.setAttribute("label", l10n.get("artistCheck", ["________"])); // For Fx extensions like Menu Editor
	artistCheck.hidden = true;
	var webContextMenu = document.getElementById("contentAreaContextMenu");
	webContextMenu.insertBefore(artistCheck, webContextMenu.firstChild);
	artistCheck.addEventListener("command", summonRawkitude);
	cleanupTasks.push( removalTask(artistCheck) );
	handleMessage("showArtistLove", function(msg) {
		artistCheck.artist = msg.data;
		artistCheck.setAttribute("label", l10n.get("artistCheck", [msg.data]));
		artistCheck.hidden = false;
	});
	handleMessage("noArtistLove", hideArtistLove);
	gBrowser.tabContainer.addEventListener("TabSelect", hideArtistLove);
	function hideArtistLove() {
		artistCheck.hidden = true;
	}
	cleanupTasks.push( function() {
		gBrowser.tabContainer.removeEventListener("TabSelect", hideArtistLove);
	} );

	function summonRawkitude(event) {
		var browser = gBrowser.selectedBrowser;
		if (browser == currentFocus) {
			if (this == heart) {
				if (!sidebarWindow) {
					openWebPanel("Deviant Love", "chrome://DeviantLove/content/sidebar.html");
				} else {
					SidebarUI.hide();
				}
			} else { // this == artistCheck
				if (!sidebarWindow) {
					window[browserMod].firstDeviant = artistCheck.artist;
					openWebPanel("Deviant Love", "chrome://DeviantLove/content/sidebar.html");
				} else {
					sidebarWindow.showDeviant(artistCheck.artist);
				}
			}
		} else {
			window[browserMod].currentPageData = foundLove.get(gBrowser.selectedBrowser);
			if (this == artistCheck) {window[browserMod].firstDeviant = artistCheck.artist;};
			delete window[browserMod].currentScanData;
			currentFocus = browser;
			if (sidebarWindow) {
				sidebarWindow.restart();
			} else {
				openWebPanel("Deviant Love", "chrome://DeviantLove/content/sidebar.html");
			}
		}

		updateHeart();
	}

	window[browserMod].sidebarLoaded = function(win) {
		sidebarWindow = win;
		updateHeart();
	}
	window[browserMod].sidebarUnloaded = function() {
		sidebarWindow = null;
		updateHeart();
	}
	window[browserMod].shuttingDown = function() {
		cleanupTasks.forEach( function(task) { task(); } );
	}
})();