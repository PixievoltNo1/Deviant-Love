/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
import { writable } from "svelte/store";

export default function researchLove(favesURL, maxDeviations) {
	var paused = false, onResume = [grabMorePages], onRetry = [];
	var globalAborter = new AbortController(), { signal } = globalAborter;
	var parser = new DOMParser();

	var favesResolve, favesReject, watchedResolve, watchedReject;
	var api = {
		faves: new Promise( (res, rej) => { favesResolve = res, favesReject = rej; } ),
		progress: writable({ found: 0, percent: 0 }),
		watched: new Promise( (res, rej) => { watchedResolve = res, watchedReject = rej; } ),
		cancel: function() {
			globalAborter.abort();
		},
		retry: function() {
			onRetry.forEach( function(handler) { handler(); } );
			onRetry = [];
		},
		pause: function() { paused = true; },
		resume: function() {
			paused = false;
			onResume.forEach( function(handler) { handler(); } );
			onResume = [grabMorePages];
		}
	};

	var favesPerPage, allowedFetches = 6, requestedPages = 0, processedPages = 0, totalPages,
		pageData = [], found = 0, pageAborters = [];
	async function retrieveFaves(page) {
		var aborter = pageAborters[page - 1] = new AbortController();
		signal.addEventListener("abort", () => { aborter.abort(); });
		--allowedFetches;
		++requestedPages;
		try {
			let reponse = await fetch(favesURL + "&offset=" + ((page - 1) * favesPerPage),
				{ signal: aborter.signal });
			let xmlDoc = parser.parseFromString(await reponse.text(), "text/xml");
			processFavesXML(xmlDoc, page);
		} catch (o_o) {
			if (o_o instanceof AbortError) { return; }
			collectFailedPage(page);
		} finally {
			++allowedFetches;
		}
	}
	function processFavesXML(doc, page) {
		if (page > totalPages) { return; }
		if (!totalPages) {
			var linkToNext = doc.querySelector('channel > [rel="next"]');
			if (linkToNext) {
				if (!favesPerPage) {
					var offsetCheckResults = linkToNext.getAttribute("href").match(/offset\=(\d+)/);
					favesPerPage = Number(offsetCheckResults[1]);
					if (maxDeviations) {
						totalPages = Math.ceil(maxDeviations / favesPerPage);
					}
				}
			} else {
				totalPages = page;
				favesPerPage = maxDeviations;
				for (let aborter of pageAborters.slice(page)) {
					aborter.abort();
				}
			}
		}
		grabMorePages();
		var items = [];
		for ( let itemElem of doc.querySelectorAll("item") ) {
			let authorElems = itemElem.querySelectorAll('[role="author"]');
			let item = {
				deviationName: itemElem.querySelector("title").textContent,
				deviationPage: itemElem.querySelector("link").textContent,
				artistName: authorElems[0].textContent,
				artistAvatar: authorElems[1].textContent,
			};
			items.push(item);
			++found;
		}
		pageData[page - 1] = items;
		++processedPages;
		var progressData = { found: found };
		if (maxDeviations) {
			progressData.percent = Math.min( (processedPages * favesPerPage) / maxDeviations, 1);
		}
		api.progress.set(progressData);
		if (processedPages >= totalPages) {
			favesResolve( [].concat(...pageData) );
		}
	}
	retrieveFaves(1);
	function grabMorePages() {
		if (favesPerPage == null || paused) { return; }
		while (allowedFetches > 0 && (!totalPages || requestedPages < totalPages)) {
			retrieveFaves(requestedPages + 1);
		}
	}
	var firstFail = true;
	function collectFailedPage(page) {
		if (firstFail) {
			firstFail = false;
			onRetry.push( function() { firstFail = true; } );
			let oldReject = favesReject;
			let retryResult = new Promise( (res, rej) => { favesResolve = res, favesReject = rej; } );
			oldReject({retryResult});
		}
		onRetry.push( retrieveFaves.bind(null, page) );
	}

	var watchlistPage = 0, greatOnes = new Set();
	async function retrieveWatchlist() {
		try {
			var response = await fetch("http://my.deviantart.com/global/difi/"
				+ "?c%5B%5D=%22Friends%22%2C%22getFriendsList%22%2C%5Btrue%2C"
				+ watchlistPage + "%5D&t=json", {signal});
			var json = await response.text(); 
		} catch (o_o) {
			let oldReject = watchedReject;
			let retryResult = new Promise((res, rej) => { watchedResolve = res, watchedReject = rej; });
			oldReject({ reason: "netError", retryResult });
			onRetry.push(retrieveWatchlist);
			return;
		}
		try {
			processWatchJSON( JSON.parse(json) );
		} catch (o_o) {
			if (o_o.reason) {
				watchedReject(o_o);
			} else {
				console.error(o_o);
				watchedReject({ reason: "scannerIssue" });
			}
		}
	}
	function processWatchJSON(digHere) {
		var response = digHere.DiFi.response.calls[0].response;
		if (response.status === "NOEXEC_HALT") {
			throw { reason: "notLoggedIn" };
		}
		response.content[0].forEach( function(deviant) {
			if (deviant.attributes & 2) {
				greatOnes.add(deviant.username);
			}
		} );
		if (response.content[0].length == 100) { // That means there may be more friends
			++watchlistPage;
			if (!paused) {
				retrieveWatchlist();
			} else {
				onResume.push(retrieveWatchlist)
			}
		} else {
			watchedResolve(greatOnes);
		}
	}
	retrieveWatchlist();

	return api;
}