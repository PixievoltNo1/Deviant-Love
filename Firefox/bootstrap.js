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
var frameScriptKey = Date.now();
var messageManager = Services.mm;
function* windows() {
	var winEnum = windowWatcher.getWindowEnumerator();
	while (winEnum.hasMoreElements()) {
		yield winEnum.getNext();
	}
}
function startup() {
	// TODO: Transition preference "nexttip" to "nextTip"
	windowWatcher.registerNotification(observer);
	for (let window of windows()) {
		foundWindow(window);
	}
	messageManager.addMessageListener("deviantlove@pikadudeno1.com:getDisableKey", getDisableKey);
	messageManager.loadFrameScript("chrome://DeviantLove/content/frame.js?" + frameScriptKey, true);
}
function foundWindow(window) {
	window = window.QueryInterface(Components.interfaces.nsIDOMWindow);
	if (window.document.readyState != "complete") {
		window.addEventListener("load", loadedWindow, true);
		return;
	}
	if (window.document.documentElement.getAttribute("windowtype") != "navigator:browser") { return; }
	Services.scriptloader.loadSubScriptWithOptions("chrome://DeviantLove/content/browserMod.js", {
		target: window,
		charset: "UTF-8",
		ignoreCache: true
	});
}
function loadedWindow() {
	foundWindow(this);
}
function getDisableKey() {
	return frameScriptKey;
}
function shutdown(data, reason) {
	var {browserMod} = Components.utils.import("chrome://DeviantLove/content/global.js", {});
	windowWatcher.unregisterNotification(observer);
	Components.utils.unload("chrome://DeviantLove/content/global.js");
	for (let window of windows()) {
		window = window.QueryInterface(Components.interfaces.nsIDOMWindow);
		window.removeEventListener("load", loadedWindow, true);
		if (window[browserMod]) {
			window[browserMod].shuttingDown();
			delete window[browserMod];
		}
	}
	messageManager.removeDelayedFrameScript("chrome://DeviantLove/content/frame.js?" + frameScriptKey);
	messageManager.removeMessageListener("deviantlove@pikadudeno1.com:getDisableKey", getDisableKey);
	messageManager.broadcastAsyncMessage("deviantlove@pikadudeno1.com:disable", getDisableKey());
}
function uninstall(data, reason) {
	if (reason == ADDON_UNINSTALL) {
		Services.prefs.getBranch("extensions.deviantlove.").deleteBranch("");
	}
}