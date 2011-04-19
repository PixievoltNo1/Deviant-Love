function researchLove(favesURL, handlers) {
// Handlers needed: onFavesError, faves, onWatchError, watched, onDone
	var currentXHRs = {}, paused = false, onResume = [], todos = 2;
	
	var favesSettings = {
		dataType: "xml",
		success: processFavesXML,
		error: handlers.onFavesError
	};
	function retrieveFaves() { currentXHRs.faves = $.ajax(favesURL, favesSettings); }
	function processFavesXML(feed) {
		var data = [];
		$("item", feed).each( function() {
			var item = {
				deviationName: $("title:eq(0)", this).text(),
				deviationPage: $("link", this).text(),
				artistName: $('[role="author"]:eq(0)', this).text(),
				artistAvatar: $('[role="author"]:eq(1)', this).text()
			};
			item.artistProfile = "http://" + item.artistName.toLowerCase() + ".deviantart.com";
			item.artistGallery = item.artistProfile + "/gallery/";
			data.push(item);
		} );
		handlers.faves(data);
		var nextPage = $('channel > [rel="next"]', feed);
		if (nextPage.length >= 1) {
			favesURL = nextPage.attr("href");
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
	
	currentXHRs.watch = $.ajax("http://my.deviantart.com/global/difi/?c%5B%5D=%22Friends%22%2C%22getFriendsList%22%2C%5Bfalse%2C0%5D&t=json", {
		dataType: "json",
		success: processWatchJSON,
		error: watchFailure
	});
	function processWatchJSON(digHere) {
		if (digHere.DiFi.status === "FAIL") {
			watchFailure();
			return;
		}
		var greatOnes = [];
		var buriedTreasure = digHere.DiFi.response.calls[0].response.content;
		for (var folder in buriedTreasure) {
			buriedTreasure[folder].forEach( function(deviant) {
				if (deviant.attributes & 2) {
					greatOnes.push(deviant.username);
				}
			} );
		}
		handlers.watched(greatOnes);
		taskComplete();
	}
	function watchFailure() {
		handlers.onWatchError();
		taskComplete();
	}
	
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