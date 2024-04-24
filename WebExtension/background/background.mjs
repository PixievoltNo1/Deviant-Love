/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
import "./contextMenu.mjs";
import "./syncByBrowser.mjs";
import "./versionCheck.mjs";

chrome.runtime.onMessage.addListener( function(thing, buddy, callback) {switch (thing.action) {
	case "showLove":
		chrome.pageAction.show(buddy.tab.id);
	break;
	case "hideLove":
		chrome.pageAction.hide(buddy.tab.id);
	break;
	case "showX":
		if (chrome.pageAction.setIcon) {
			chrome.pageAction.setIcon({tabId: buddy.tab.id, path: "/images/heart/32Close.png"});
		}
		if (chrome.pageAction.setTitle) {
			chrome.pageAction.setTitle({tabId: buddy.tab.id, title: chrome.i18n.getMessage("heartX")});
		}
	break;
	case "noX":
		if (chrome.pageAction.setIcon) {
			chrome.pageAction.setIcon({tabId: buddy.tab.id, path: "/images/heart/32.png"});
		}
		if (chrome.pageAction.setTitle) {
			chrome.pageAction.setTitle({tabId: buddy.tab.id, title: "Deviant Love"});
		}
	break;
	case "setHeartAction":
		chrome.tabs.query({active: true, lastFocusedWindow: true}, ([currentTab]) => {
			if (currentTab && buddy.id == currentTab.id) {
				heartAction = thing.to;
			}
			chrome.tabs.sendMessage(buddy.id, {action: "resendHeartAction"});
		});
	break;
	case "checkSidebarSupport":
		callback( Boolean(browser && browser.sidebarAction && browser.sidebarAction.open) );
	break;
	// For communication between panelManager.js and environment.esm.js
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
chrome.pageAction.onClicked.addListener( (buddy) => {
	chrome.tabs.sendMessage(buddy.id, {action: "spark"});
} );

chrome.runtime.onInstalled.addListener( function onUpdate(info) {
	if (info.reason != "update") { return; }
	if (localStorage.nextTip) {
		chrome.storage.local.set({nextTip: localStorage.nextTip - 1});
		localStorage.clear();
	}
} );