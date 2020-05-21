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
	var eclipseFolderGallery = document.querySelector("#sub-folder-gallery");
	
	var folderId;
	var folderIdMatch = (/\/(\d+)\//).exec(location.pathname) || (/\?(\d+)$/).exec(location.search);
	var searchText = ( new URLSearchParams(location.search) ).get("q");
	love.pageType = ( () => {
		if (folderIdMatch) {
			folderId = folderIdMatch[1];
			return "collection";
		} else if ( (/\/favourites\/?$/).test(location) ) {
			if (eclipseFolderGallery) {
				folderId = document.querySelector("#sub-folder-gallery > [id]").id;
			}
			return "featured";
		} else if (location.toString().endsWith("/all") || location.search == "?catpath=/") {
			return "allFaves";
		} else if (searchText) {
			return "search";
		}
		throw new Error("Can't determine page type");
	} )();

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
				love.feedHref = "https://backend.deviantart.com/rss.xml?" +
					`q=(${encodeURIComponent(searchText)})+AND+(favedbyid%3A${deviantId})&type=deviation`;
			}
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
		if (eclipseCollections) {
			// TODO: Revise this to work around collections no longer having links
			if (love.pageType == "search") { return null; }
			var linkUrl = (love.pageType == "featured")
				? `${location}/${folderId}/featured`
				: location.toString();
			var linkElem = eclipseCollections.querySelector(`a[href="${linkUrl}"]`);
			if (!linkElem) { return null; }
			var deviationsMatch = (/\n(\d+) deviations/).exec( linkElem.innerText );
			if (!deviationsMatch) { return null; }
			return deviationsMatch[1];
		}
	} )();

	return love;
}