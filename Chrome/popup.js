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

var chromeLocalStorage = new $.Deferred();
chrome.storage.local.get(null, function(data) {
	chromeLocalStorage.resolve(data);
});
$(document).ready( function() {
	$("body").css({
		"box-sizing": "border-box",
		"height": $(window).height(),
		"margin": 0
	});
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
					getTip( function(tip) {
						scanDone_startFun(tip);
					} );
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
		getTip( function(tip) {
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

var nextTip;
var tipsFile = $.getJSON( chrome.i18n.getMessage("l10nFolder") + "TipOfTheMoment.json" );
function getTip(callback) {
	$.when(tipsFile, chromeLocalStorage).done( function(tipsReq, storage) {
		var tips = tipsReq[0];
		if (nextTip === undefined) {
			nextTip = (nextTip in storage) ? storage.nextTip : 0;
		}
		callback(tips[nextTip]);
		nextTip++;
		if (nextTip == tips.length) {nextTip = 0;}
		chrome.storage.local.set({nextTip: nextTip});
	} );
}

$(document).delegate("a", "click", function(event) {
	if (event.button == 0) { window.open(this.href); }
	event.preventDefault();
} );
$(window).bind("resize", function() {
	$("body").height($(window).height());
} );