/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
"use strict";

if (chrome.contextMenus) {
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
	chrome.contextMenus.onClicked.addListener( function(click, buddy) {
		var artist = click.menuItemId.substr( "artistLove:".length );
		chrome.tabs.sendMessage(buddy.id, {action: "artistRequested", artist: artist});
	} );
}

function processNames(names) {
	for (let name of names) {
		chrome.contextMenus.create({
			title: chrome.i18n.getMessage("artistCheck", name),
			id: "artistLove:" + name,
			contexts: ["link"],
			targetUrlPatterns: [
				`*://www.deviantart.com/${ name.toLowerCase() }/*`,
				`*://www.deviantart.com/${ name.toLowerCase() }`,
			]
		});
	}
}