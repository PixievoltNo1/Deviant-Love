/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
if (!(window.chrome && chrome.runtime)) { window.chrome = browser; }

chrome.runtime.onMessage.addListener( function(thing, buddy, callback) {switch (thing.action) {
	case "showLove":
		chrome.pageAction.show(buddy.tab.id);
	break;
	case "showX":
		chrome.pageAction.setIcon({tabId: buddy.tab.id, path: "/images/heart/38Close.png"});
		chrome.pageAction.setTitle({tabId: buddy.tab.id, title: chrome.i18n.getMessage("heartX")});
	break;
	case "noX":
		chrome.pageAction.setIcon({tabId: buddy.tab.id, path: "/images/heart/38.png"});
		chrome.pageAction.setTitle({tabId: buddy.tab.id, title: "Deviant Love"});
	break;
	// For communication between manager.js and popup.js
	case "echo":
		thing.action = thing.echoAction;
		chrome.tabs.sendMessage(buddy.tab.id, thing);
	break;
	case "echoWithCallback":
		thing.action = thing.echoAction;
		chrome.tabs.sendMessage(buddy.tab.id, thing, function(retVal) { callback(retVal); });
		return true;
	break;
}} );
chrome.pageAction.onClicked.addListener( function(buddy) {
	chrome.tabs.sendMessage(buddy.id, {action: "spark"});
} );

chrome.runtime.onInstalled.addListener( function onUpdate(info) {
	if (info.reason != "update") { return; }
	if (localStorage.nextTip) {
		chrome.storage.local.set({nextTip: localStorage.nextTip - 1});
		localStorage.clear();
	}
} );