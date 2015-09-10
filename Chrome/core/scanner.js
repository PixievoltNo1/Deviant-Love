/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";

function researchLove(favesURL, maxDeviations, handlers) {
// Handlers needed: onFavesError, faves, progress, onWatchError, watched, onDone
	var currentXHRs = {}, paused = false, onResume = [grabMorePages], todos = 2;
	
	var favesPerPage, allowedXHRs = 6, processedPages = 0, totalPages, pageData = [], found = 0;
	function retrieveFaves(page) {
		var xhr = currentXHRs["faves" + page] = $.get(favesURL +
			( page > 1 ? "&offset=" + ((page - 1) * favesPerPage) : "") );
		xhr.page = page;
		--allowedXHRs;
		
		xhr.done(processFavesXML).fail(collectFailedPage).always( function() {
			++allowedXHRs;
			delete currentXHRs["faves" + xhr.page];
		} );
	}
	function processFavesXML(feed, status, xhr) {
		if (xhr.page == 1) {
			var page2Link = $('channel > [rel="next"]', feed);
			if (page2Link.length) {
				var offsetCheckResults = page2Link.attr("href").match(/offset\=(\d+)/);
				favesPerPage = Number(offsetCheckResults[1]);
				totalPages = Math.ceil(maxDeviations / favesPerPage);
			} else {
				totalPages = 1;
				favesPerPage = maxDeviations;
			}
		}
		grabMorePages();
		var items = [];
		$("item", feed).each( function() {
			var item = {
				deviationName: $("title:eq(0)", this).text(),
				deviationPage: $("link", this).text(),
				artistName: $('[role="author"]:eq(0)', this).text(),
				artistAvatar: $('[role="author"]:eq(1)', this).text()
			};
			items.push(item);
			++found;
		} );
		pageData[xhr.page - 1] = items;
		++processedPages;
		var progressPercentage = Math.min( (processedPages * favesPerPage) / maxDeviations, 1);
		handlers.progress(progressPercentage, found);
		if (processedPages == totalPages) {
			handlers.faves(Array.prototype.concat.apply([], pageData));
			taskComplete();
		}
	}
	retrieveFaves(1);
	var requestedPages = 1;
	function grabMorePages() {
		if (totalPages == null || paused) { return; }
		while (allowedXHRs > 0 && requestedPages < totalPages) {
			++requestedPages;
			retrieveFaves(requestedPages);
		}
	}
	var failedPages = [];
	function collectFailedPage(xhr) {
		failedPages.push(xhr.page);
		if (failedPages.length == 1) {
			handlers.onFavesError();
		}
	}
	function retryFailedPages() {
		failedPages.forEach(retrieveFaves);
		failedPages = [];
	}
	
	var watchlistPage = 0, greatOnes = new Set();
	var watchlistSettings = {
		dataType: "json",
		success: processWatchJSON,
		error: watchFailure
	};
	function retrieveWatchlist() {
		currentXHRs.watch = $.ajax("http://my.deviantart.com/global/difi/?c%5B%5D=%22Friends%22%2C%22getFriendsList%22%2C%5Btrue%2C"
			+ watchlistPage + "%5D&t=json", watchlistSettings);
	}
	function processWatchJSON(digHere) {
		if (digHere.DiFi.status === "FAIL") {
			watchFailure();
			return;
		}
		try {
			var buriedTreasure = digHere.DiFi.response.calls[0].response.content[0];
			buriedTreasure.forEach( function(deviant) {
				if (deviant.attributes & 2) {
					greatOnes.add(deviant.username);
				}
			} );
		} catch(e) {
			console.error(e);
			watchFailure();
			return;
		}
		if (buriedTreasure.length == 100) { // That means there may be more friends
			++watchlistPage;
			if (!paused) {
				retrieveWatchlist();
			} else {
				onResume.push(retrieveWatchlist)
			}
		} else {
			handlers.watched(greatOnes);
			taskComplete();
		}
	}
	function watchFailure() {
		handlers.onWatchError();
		taskComplete();
	}
	retrieveWatchlist();
	
	function taskComplete() {
		--todos;
		if (todos == 0) { handlers.onDone(); }
	}
	
	return {
		cancel: function() {
			for (var XHR in currentXHRs) {
				currentXHRs[XHR].abort();
			}
		},
		favesRetry: retryFailedPages,
		pause: function() { paused = true; },
		resume: function() {
			paused = false;
			onResume.forEach( function(handler) { handler(); } );
			onResume = [grabMorePages];
		}
	};
}