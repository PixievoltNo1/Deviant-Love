/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.src.mjs for the complete legal stuff.
*/
import "./contextMenu.mjs";
import "./syncByBrowser.mjs";
import "./versionCheck.mjs";

let pageAction = chrome.action ?? browser.pageAction;
if (chrome.action) {
	chrome.runtime.onInstalled.addListener( () => chrome.action.disable() );
	chrome.runtime.onStartup.addListener( () =>  chrome.action.disable() );
	chrome.runtime.onMessage.addListener( function(thing, buddy, callback) {switch (thing.action) {
		case "showLove":
			pageAction.enable(buddy.tab.id);
		break;
		case "hideLove":
			pageAction.disable(buddy.tab.id);
		break;
	}} );
} else {
	chrome.runtime.onMessage.addListener( function(thing, buddy, callback) {switch (thing.action) {
		case "showLove":
			pageAction.show(buddy.tab.id);
		break;
		case "hideLove":
			pageAction.hide(buddy.tab.id);
		break;
	}} );
}
chrome.runtime.onMessage.addListener( function(thing, buddy, callback) {switch (thing.action) {
	case "showX":
		pageAction.setIcon({tabId: buddy.tab.id, path: "/images/heart/32Close.png"})
		pageAction.setTitle({tabId: buddy.tab.id, title: chrome.i18n.getMessage("heartX")});
	break;
	case "noX":
		pageAction.setIcon({tabId: buddy.tab.id, path: "/images/heart/32.png"});
		pageAction.setTitle({tabId: buddy.tab.id, title: "Deviant Love"});
	break;
	// For communication between panelManager.js and environment.src.mjs
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
pageAction.onClicked.addListener( (buddy) => {
	chrome.tabs.sendMessage(buddy.id, {action: "spark"});
} );