function researchLove(favesURL, handlers) {
// Handlers needed: onFavesError, faves, onDone
	var currentXHRs = {}, paused = false, onResume = [];
	
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
				artistAvatar: $('[role="author"]:eq(1)', this).text(),
				artistProfile: $("copyright", this).attr("url")
			};
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
			handlers.onDone();
		}
	}
	retrieveFaves();
	
	return {
		cancel: function() {
			for (XHR in currentXHRs) {
				XHR.abort();
			}
		},
		favesRetry: retrieveFaves,
		pause: function() { paused = true; },
		resume: function() {
			onResume.forEach( function(handler) { handler(); } );
			onResume = [];
		}
	};
}