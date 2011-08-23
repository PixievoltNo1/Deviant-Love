/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/

var popup = document.createElement("iframe"), popupCSS = popup.style;
popupCSS.border = "2px solid black";
popupCSS.borderTop = "0";
popupCSS.height = (window.innerHeight - 22) + "px";
popupCSS.width = "444px";
popupCSS.position = "fixed";
popupCSS.right = "50px";
popupCSS.bottom = window.innerHeight + "px";
popupCSS.display = "none";
popupCSS.zIndex = "501";
popupCSS.WebkitTransition = "bottom 0.6s ease-out";
document.body.appendChild(popup);
var shield = document.createElement("div"), shieldCSS = shield.style;
shieldCSS.position = "fixed";
shieldCSS.top = "0";
shieldCSS.bottom = "0";
shieldCSS.left = "0";
shieldCSS.right = "0";
shieldCSS.opacity = "0";
shieldCSS.backgroundColor = "white";
shieldCSS.display = "none";
shieldCSS.zIndex = "500";
shieldCSS.WebkitTransition = "opacity 0.6s linear";
document.body.appendChild(shield);
var popupState = "inactive";
var popupStage = "uninitialized";
var pageData = findLove();

chrome.extension.onRequest.addListener( function(thing, buddy, callback) {switch (thing.action) {
	case "spark":
		if (popupState == "inactive") {activate()} else
		if (popupState == "active") {deactivate()};
	break;
	case "artistRequested":
		activate(thing.artist);
	break;
	case "scanningComplete":
		popupStage = "love";
	break;
	case "getResearchLoveParams":
		callback(pageData.feedHref, pageData.maxDeviations);
	break;
	case "getFulfillPurposeParams":
		callback(pageData.pageType);
	break;
}} );
chrome.extension.sendRequest({action: "showLove"});

addEventListener("resize", function() {
	popupCSS.height = (window.innerHeight - 22) + "px";
	if (popupState == "inactive") { popupCSS.bottom = window.innerHeight + "px"; }
}, false);

document.querySelector(".folderview-art").addEventListener("mouseover", function(event) {
	var thing = event.target;
	if (thing.webkitMatchesSelector("a.u")) {
		chrome.extension.sendRequest({action: "showArtistLove", artist: thing.textContent});
		thing.addEventListener("mouseout", function byebye() {
			chrome.extension.sendRequest({action: "noArtistLove"});
			thing.removeEventListener("mouseout", byebye, false);
		}, false);
	}
}, false);
addEventListener("pagehide", function() {
	chrome.extension.sendRequest({action: "noArtistLove"});
}, false);

function activate(firstDeviant) {
	popupCSS.display = "";
	shieldCSS.display = "";
	popupState = "preparing";
	if (popupStage == "uninitialized") {
		chrome.extension.onRequest.addListener( function popupReady(thing) {
			if (thing.action == "popupReady") {
				popupStage = "scanning";
				reveal();
				chrome.extension.onRequest.removeListener(popupReady);
			}
		} );
		popup.src = chrome.extension.getURL("popup.html" + (firstDeviant ? "#" + firstDeviant : ""));
	} else if (popupStage == "scanning") {
		chrome.extension.sendRequest({action: "resumeScan"});
		// reveal must be called asyncronously, otherwise the display property changes made earlier won't have taken effect and the transitions won't work
		window.setTimeout(reveal, 1);
	} else {
		chrome.extension.sendRequest({action: "sendTip"}, reveal);
	}
	function reveal() {
		popupCSS.bottom = "20px";
		shieldCSS.opacity = "0.4";
		popupState = "active";
		shield.addEventListener("click", deactivate, false);
	}
}
function deactivate() {
	shield.removeEventListener("click", deactivate, false);
	if (popupStage == "scanning") {chrome.extension.sendRequest({action: "pauseScan"})};
	popup.addEventListener("webkitTransitionEnd", function hide() {
		popupCSS.display = "none";
		shieldCSS.display = "none";
		popup.removeEventListener("webkitTransitionEnd", hide, false);
		popupState = "inactive";
	}, false);
	popupCSS.bottom = window.innerHeight + "px";
	shieldCSS.opacity = "0";
	popupState = "deactivating";
}