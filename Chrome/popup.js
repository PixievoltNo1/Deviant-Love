/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
"use strict";
var displayType = "popup";
$(document).ready( function() {
	$("body").css({
		"box-sizing": "border-box",
		"height": $(window).height(),
		"margin": 0
	});
	chrome.runtime.sendMessage({action: "echoWithCallback", echoAction: "popupSetup"},
		function(initData) {
			fulfillPurpose(initData.pageType);
			if (location.hash) {showDeviant(location.hash.slice(1))};
			chrome.runtime.connect({name: "fetchFeedData"}).onMessage.addListener(collectResearch);
		}
	)
} );
function collectResearch(thing) {switch (thing.whatsUp) {
	case "faves": setData(thing.data); break;
	case "progress": setProgress.apply(window, thing.args); break;
	case "scanError": scanError(); break;
	case "watched": collectWatchlist(thing.data); break;
	case "watchError": watchError(); break;
}}
chrome.runtime.onMessage.addListener(function(thing, buddy, callback) {switch (thing.action) {
	case "scanningComplete":
		// This message can't be received through the port because manager.js needs to receive it, too
		scanDone_startFun(thing.tip);
	break;
	case "changeTip":
		tipOfTheMoment(thing.tip);
		callback();
	break;
	case "artistRequested":
		showDeviant(thing.artist);
	break;
}});
function scanRetry() {
	chrome.runtime.sendMessage({action: "scanRetry"});
}
function getL10nMsg(msgName, replacements, callback, tmpMsg) {
	callback( chrome.i18n.getMessage(msgName, replacements) );
}
$(document).delegate("a", "click", function(event) {
	if (event.button == 0) { window.open(this.href); }
	event.preventDefault();
} );
$(window).bind("resize", function() {
	$("body").height($(window).height());
} );