/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
var scannerController;
var adapter = {
	displayType: "popup",
	scanRetry: function() {
		scannerController.favesRetry();
	},
	getL10nMsg: function(msgName, replacements) {
		return chrome.i18n.getMessage(msgName, replacements);
	},
	getL10nFile: function(filename) {
		return chrome.i18n.getMessage("l10nFolder") + filename;
	},
	retrieve: function(keys) {
		var request = new $.Deferred();
		chrome.storage.local.get(keys, function(data) {
			for (var key in data) {
				var item = data[key]
				if (typeof item == "string") {
					data[key] = JSON.parse(item);
				}
			}
			request.resolve(data);
		});
		return request.promise();
	},
	store: function(key, data) {
		if (typeof data != "number" && typeof data != "boolean") {
			data = JSON.stringify(data);
		}
		var item = {};
		item[key] = data;
		chrome.storage.local.set(item);
	}
};

$(document).ready( function() {
	$("body").css({ "height": $(window).height() });
	chrome.runtime.sendMessage({action: "echoWithCallback", echoAction: "popupSetup"},
		function(love) {
			fulfillPurpose(love.pageType);
			if (location.hash) {showDeviant(location.hash.slice(1))};
			scannerController = researchLove(love.feedHref, love.maxDeviations, {
				faves: setData,
				progress: setProgress,
				onFavesError: scanError,
				watched: collectWatchlist,
				onWatchError: watchError,
				onDone: function() {
					chrome.runtime.sendMessage({action: "echo", echoAction: "scanningComplete"});
					scanDone_startFun();
				}
			});
		}
	)
} );
chrome.runtime.onMessage.addListener(function(thing, buddy, callback) {switch (thing.action) {
	case "pauseScan":
		scannerController.pause();
	break;
	case "resumeScan":
		scannerController.resume();
	break;
	case "changeTip":
		nextTip().then( function(tip) {
			tipOfTheMoment(tip);
			callback();
		} );
	break;
	case "artistRequested":
		showDeviant(thing.artist);
	break;
}});
function scanRetry() {
	chrome.runtime.sendMessage({action: "scanRetry"});
}

$(document).delegate("a", "click", function(event) {
	if (event.button == 0) { window.open(this.href); }
	event.preventDefault();
} );
$(window).bind("resize", function() {
	$("body").height($(window).height());
} );