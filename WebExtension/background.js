/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.esm.js for the complete legal stuff.
*/
"use strict";

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
// There is currently no browser that supports both a sidebar and a non-persistent background page.
// The below will need to be rewritten if Chrome adds a sidebar, or Firefox adds non-persistent background pages.
var heartAction = "spark";
chrome.pageAction.onClicked.addListener( (buddy) => {
	if (heartAction == "spark") {
		chrome.tabs.sendMessage(buddy.id, {action: "spark"});
	} else if (heartAction == "openSidebar") {
		browser.sidebarAction.open();
		// If the sidebar is already open, what happens next is controlled by the sidebar.
	} else if (heartAction == "closeSidebar") {
		browser.sidebarAction.close();
	}
} );
chrome.tabs.onActivated.addListener( ({tabId}) => {
	chrome.tabs.sendMessage(tabId, {action: "resendHeartAction"});
} );
chrome.windows.onFocusChanged.addListener( (windowId) => {
	chrome.tabs.query({active: true, lastFocusedWindow: true}, ([buddy]) => {
		if (!buddy) { return; }
		chrome.tabs.sendMessage(buddy.id, {action: "resendHeartAction"});
	});
} );

chrome.runtime.onInstalled.addListener( function onUpdate(info) {
	if (info.reason != "update") { return; }
	if (localStorage.nextTip) {
		chrome.storage.local.set({nextTip: localStorage.nextTip - 1});
		localStorage.clear();
	}
} );