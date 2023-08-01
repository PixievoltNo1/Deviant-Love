/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
"use strict";

function findLove(win = window) {
	var document = win.document;
	var location = win.location;
	var love = {};

	var eclipseCollections = document.querySelector(`[data-hook="gallection_folder"]`);
	
	var folderId;
	var folderIdMatch = (/\/(\d+)\//).exec(location.pathname) || (/\?(\d+)$/).exec(location.search);
	love.pageType = ( () => {
		if ( (/\/(?:favourites\/?|featured)$/).test(location.pathname) ) {
			if (folderIdMatch) {
				folderId = folderIdMatch[1];
			} else if (eclipseCollections) {
				let link = eclipseCollections.querySelector(`a[href$="/featured"]`)
				folderId = (/\/(\d+)\//).exec(link.href)[1];
			}
			return "featured";
		} else if (folderIdMatch) {
			folderId = folderIdMatch[1];
			return "collection";
		} else if (location.pathname.endsWith("/all") || location.search == "?catpath=/") {
			return "allFaves";
		}
		throw new Error("Can't determine page type");
	} )();

	var feed = document.querySelector('link[rel="alternate"][type="application/rss+xml"]');
	if (feed) {
		love.feedHref = feed.href;
	} else {
		let deviantName = (/^\/([^\/]*)/).exec(location.pathname)[1];
		if (love.pageType == "allFaves") {
			love.feedHref = "https://backend.deviantart.com/rss.xml?" +
				`q=favby%3A${deviantName}&type=deviation`;
		} else {
			if (!folderId) {
				throw new Error("Can't determine feed URL");
			}
			love.feedHref = "https://backend.deviantart.com/rss.xml?" +
				`q=favby%3A${deviantName}%2F${folderId}&type=deviation`;
		}
	}
	
	// Optional value. Do not attempt to throw if it can't be determined.
	love.maxDeviations = ( () => {
		if (!eclipseCollections) { return null; }
		try {
			let urlPart = (love.pageType == "allFaves") ? "all" : folderId + "/";
			var collectionElem = eclipseCollections
				.querySelector(`a[href*="/favourites/${urlPart}"]`);
			var deviationsMatch = (/\n(\d+) deviations$/).exec(collectionElem.innerText);
			return deviationsMatch[1];
		} catch (o_o) {
			console.warn(o_o);
			return null;
		};
	} )();

	return love;
}