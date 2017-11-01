/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
if (!(window.chrome && chrome.runtime)) { window.chrome = browser; }

var adapter = Object.assign({
	displayType: "popup",
	prepComplete: function() {
		chrome.runtime.sendMessage({action: "echo", echoAction: "scanningComplete"});
	}
}, apiAdapter);

var scannerController;
$(document).ready( function() {
	$("body").css({ "height": $(window).height() });
	chrome.runtime.sendMessage({action: "echoWithCallback", echoAction: "popupSetup"},
		function(love) {
			beginPreparations(love);
			if (location.hash) {showDeviant(location.hash.slice(1))};
			scannerController = startScan();
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
		return true;
	break;
	case "artistRequested":
		showDeviant(thing.artist);
	break;
}});

$(document).delegate("a", "click", function(event) {
	if (event.button == 0) { window.open(this.href); }
	event.preventDefault();
} );
$(window).bind("resize", function() {
	$("body").height($(window).height());
} );