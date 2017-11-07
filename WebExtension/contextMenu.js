/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";

chrome.runtime.onMessage.addListener(({action, names}, buddy, callback) => {
	if (action == "addArtistNames" && buddy.tab.selected) { processNames(names); }
});
chrome.tabs.onActivated.addListener(({tabId}) => {
	chrome.contextMenus.removeAll(() => {
		chrome.tabs.sendMessage(tabId, {action: "getArtistNames"}, (names) => {
			if (names) { processNames(names); }
		});
	});
});

function processNames(names) {
	for (let name of names) {
		chrome.contextMenus.create({
			title: chrome.i18n.getMessage("artistCheck", name),
			id: "artistLove:" + name,
			contexts: ["link"],
			targetUrlPatterns: ["*://" + name.toLowerCase() + ".deviantart.com/*"]
		});
	}
}
chrome.contextMenus.onClicked.addListener( function(click, buddy) {
	var artist = click.menuItemId.substr( "artistLove:".length );
	chrome.tabs.sendMessage(buddy.id, {action: "artistRequested", artist: artist});
} );