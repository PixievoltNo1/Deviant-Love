/*
	This file is part of Deviant Love.
	Copyright 2010-2012 Pikadude No. 1
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
	// Non-standard use of for...in. Can't use for...of as it would break Fx 10 compatibility.
	for (let window in windows()) {
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
	// See previous for...in
	for (let window in windows()) {
		window = window.QueryInterface(Components.interfaces.nsIDOMWindow);
		window.removeEventListener("load", loadedWindow, true);
		if (window.DeviantLove) {
			window.DeviantLove.shuttingDown();
			delete window.DeviantLove;
		}
	}
}