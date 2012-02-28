/*
	This file is part of Deviant Love.
	Copyright 2010-2012 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";

function researchLove(favesURL, maxDeviations, handlers) {
// Handlers needed: onFavesError, faves, onWatchError, watched, onDone
	var currentXHRs = {}, paused = false, onResume = [], todos = 2;
	
	var favesSettings = {
		dataType: "xml",
		success: processFavesXML,
		error: handlers.onFavesError
	};
	function retrieveFaves() { currentXHRs.faves = $.ajax(favesURL, favesSettings); }
	function processFavesXML(feed) {
		var data = { items: [] };
		$("item", feed).each( function() {
			var item = {
				deviationName: $("title:eq(0)", this).text(),
				deviationPage: $("link", this).text(),
				artistName: $('[role="author"]:eq(0)', this).text(),
				artistAvatar: $('[role="author"]:eq(1)', this).text()
			};
			item.artistURL = "http://" + item.artistName.toLowerCase() + ".deviantart.com/";
			data.items.push(item);
		} );
		var nextPage = $('channel > [rel="next"]', feed).attr("href");
		if (nextPage) {
			var offsetCheckResults = nextPage.match(/offset\=(\d+)/);
			data.progress = offsetCheckResults ? offsetCheckResults[1] / maxDeviations : null;
		} else {
			data.progress = 1;
		}
		handlers.faves(data);
		if (nextPage) {
			favesURL = nextPage;
			if (!paused) {
				retrieveFaves();
			} else {
				onResume.push(retrieveFaves)
			}
		} else {
			taskComplete();
		}
	}
	retrieveFaves();
	
	var watchlistPage = 0, greatOnes = [];
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
		var buriedTreasure = digHere.DiFi.response.calls[0].response.content.Unsorted;
		buriedTreasure.forEach( function(deviant) {
			if (deviant.attributes & 2) {
				greatOnes.push(deviant.username);
			}
		} );
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
		favesRetry: retrieveFaves,
		pause: function() { paused = true; },
		resume: function() {
			paused = false;
			onResume.forEach( function(handler) { handler(); } );
			onResume = [];
		}
	};
}