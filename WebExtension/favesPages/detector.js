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
	if (folderIdMatch) {
		love.pageType = "collection";
		folderId = folderIdMatch[1];
	} else if ( (/\/favourites\/?$/).test(location) ) {
		love.pageType = "featured";
		if (eclipseCollections) {
			folderId = document.querySelector("#sub-folder-gallery > [id]").id;
		}
	} else if (location.toString().endsWith("/all") || location.search == "?catpath=/") {
		love.pageType = "allFaves";
	} else {
		// Assume search results
		love.pageType = "search";
	}

	var feed = document.querySelector('link[rel="alternate"][type="application/rss+xml"]');
	if (feed) {
		love.feedHref = feed.href;
	} else {
		let deviantName = (/^\/([^\/]*)/).exec(location.pathname)[1];
		if (love.pageType == "allFaves" || love.pageType == "search") {
			let deviantElem = document.querySelector(
				`.user-link[href="https://www.deviantart.com/${deviantName}"]`
			);
			let deviantId = deviantElem.dataset.userid;
			if (love.pageType == "allFaves") {
				love.feedHref = "https://backend.deviantart.com/rss.xml?" +
					`q=favedbyid%3A${deviantId}&type=deviation`;
			} else {
				let searchText = ( new URLSearchParams(location.search) ).get("q");
				love.feedHref = "https://backend.deviantart.com/rss.xml?" +
					`q=(${encodeURIComponent(searchText)})+AND+(favedbyid%3A${deviantId})&type=deviation`;
			}
		} else {
			love.feedHref = "https://backend.deviantart.com/rss.xml?" +
				`q=favby%3A${deviantName}%2F${folderId}&type=deviation`;
		}
	}
	
	if (eclipseCollections) {
		love.maxDeviations = ( () => {
			if (love.pageType == "search") { return null; }
			var linkUrl = (love.pageType == "featured")
				? `${location}/${folderId}/featured`
				: location.toString();
			var linkElem = eclipseCollections.querySelector(`a[href="${linkUrl}"]`);
			if (!linkElem) { return null; }
			var deviationsMatch = (/\n(\d+) deviations/).exec( linkElem.innerText );
			if (!deviationsMatch) { return null; }
			return deviationsMatch[1];
		} )();
	} else {
		let element = document.querySelector("#gallery_pager");
		love.maxDeviations = element ? Number(element.getAttribute("gmi-limit")) : null;
		// "1" is a junk value DeviantArt uses when it doesn't know
		if (love.maxDeviations == 1) {
			love.maxDeviations = null;
		}
	}

	return love;
}

chrome.runtime.sendMessage({action: "showLove"});
// Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1485863
window.addEventListener("pagehide", () => {
	chrome.runtime.sendMessage({action: "hideLove"});
});