/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
Components.utils.import("resource://gre/modules/Services.jsm");
var windowWatcher = Services.ww;
var observer = {observe: function(window, eventType) {
	if (eventType == "domwindowopened") { foundWindow(window); }
} };
function windows() {
	var winEnum = windowWatcher.getWindowEnumerator();
	while (winEnum.hasMoreElements()) {
		yield winEnum.getNext();
	}
}
function startup() {
	windowWatcher.registerNotification(observer);
	for (let window of windows()) {
		foundWindow(window);
	}
}
function foundWindow(window) {
	window = window.QueryInterface(Components.interfaces.nsIDOMWindow);
	if (window.document.readyState != "complete") {
		window.addEventListener("load", loadedWindow, true);
		return;
	}
	if (window.document.documentElement.getAttribute("windowtype") != "navigator:browser") { return; }
	Services.scriptloader.loadSubScript("chrome://DeviantLove/content/browser.js", window);
}
function loadedWindow() {
	foundWindow(this);
}
function shutdown(data, reason) {
	windowWatcher.unregisterNotification(observer);
	Components.utils.unload("chrome://DeviantLove/content/global.js");
	Components.utils.unload("chrome://DeviantLove/content/StringBundle.js");
	for (let window of windows()) {
		window = window.QueryInterface(Components.interfaces.nsIDOMWindow);
		window.removeEventListener("load", loadedWindow, true);
		if (window.DeviantLove) {
			window.DeviantLove.shuttingDown();
			delete window.DeviantLove;
		}
	}
}
function uninstall(data, reason) {
	if (reason == ADDON_UNINSTALL) {
		Services.prefs.getBranch("extensions.deviantlove.").deleteBranch("");
	}
}