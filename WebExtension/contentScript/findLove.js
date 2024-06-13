/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.src.mjs for the complete legal stuff.
*/
"use strict";

function findLove({document = window.document, location = window.location, strict} = {}) {
	var love = {};

	var eclipseCollections = ( () => {
		var candidate = document.querySelector(`a[href$="/favourites/all"]`);
		if (!candidate) { return; }
		while (candidate = candidate.parentElement) {
			if (candidate.querySelectorAll("a").length > 1) {
				return candidate;
			}
		}
	} )();

	var folderId;
	var folderIdMatch = (/\/(\d+)\//).exec(location.pathname) || (/\?(\d+)$/).exec(location.search);
	if ( (/\/(?:favourites\/?|featured)$/).test(location.pathname) ) {
		if (folderIdMatch) {
			folderId = folderIdMatch[1];
		} else if (eclipseCollections) {
			let link = eclipseCollections.querySelector(`a[href$="/featured"]`)
			folderId = (/\/(\d+)\//).exec(link.href)[1];
		}
		love.pageType = "featured";
	} else if (folderIdMatch) {
		folderId = folderIdMatch[1];
		love.pageType = "collection";
	} else if (location.pathname.endsWith("/all") || location.search == "?catpath=/") {
		love.pageType = "allFaves";
	}
	if (!love.pageType) {
		return ["broken", {error: "UnknownPageType"}];
	}

	var feed = document.querySelector('link[rel="alternate"][type="application/rss+xml"]');
	if (feed) {
		love.feedHref = feed.href;
	} else {
		let deviantName = (/^\/([^\/]*)/).exec(location.pathname)[1];
		if (love.pageType == "allFaves") {
			love.feedHref = "https://backend.deviantart.com/rss.xml?" +
				`q=favby%3A${deviantName}&type=deviation`;
		} else if (folderId) {
			love.feedHref = "https://backend.deviantart.com/rss.xml?" +
				`q=favby%3A${deviantName}%2F${folderId}&type=deviation`;
		}
	}

	if (eclipseCollections) {
		try {
			let urlPart = (love.pageType == "allFaves") ? "all" : folderId + "/";
			let collectionElem = eclipseCollections
				.querySelector(`a[href*="/favourites/${urlPart}"]`);
			let deviationsMatch = (/(\d+) deviations$/).exec(collectionElem.innerText);
			love.maxDeviations = deviationsMatch[1];
		} catch (o_o) {
			console.warn(o_o);
		}
	}

	if (!love.feedHref || !love.maxDeviations) {
		if (strict) {
			// maxDeviations is optional
			if (!love.feedHref) {
				let error = (love.pageType == "featured") ? "CouldntFindFeaturedFeed" : "CouldntFindFeed";
				return ["broken", {error}];
			} else {
				return ["complete", love];
			}
		} else {
			return ["fetchable", {
				async fetch() {
					let desktopUA = navigator.userAgent.replace(/Android \d+; Mobile/, "X11; Linux x86_64");
					let response = await fetch(location.href, {headers: {"User-Agent": desktopUA}});
					let document = (new DOMParser).parseFromString(await response.text(), "text/html");
					return findLove({document, strict: true});
				},
				retryable: !document.body.matches(".mobile"),
			}];
		}
	}

	return ["complete", love];
}