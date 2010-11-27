/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
// This code is very reliant on expando properties set on XPCNativeWrapper-wrapped windows.
// However, it appears that they don't survive pagehides.

window.addEventListener("load", function() {
	var goodies = {};
	function loadGoodies() {
		var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
			.getService(Components.interfaces.mozIJSSubScriptLoader);
		loader.loadSubScript("chrome://DeviantLove/content/core/detector.js", goodies);
		loader.loadSubScript("chrome://DeviantLove/content/core/jquery.js");
		goodies.$ = $;
		$.noConflict(true);
		// It seems that when jQuery is run in this manner, support.opacity (and probably other support properties) don't get set
		goodies.$.support.opacity = true;
		// From jQuery UI / jQuery Easing
		// Thanks to George McGinley Smith and Robert Penner for their effort
		goodies.$.easing.easeOutQuad = function (x, t, b, c, d) { return -c *(t/=d)*(t-2) + b; };
	}
	document.getElementById("appcontent").addEventListener("DOMContentLoaded", pageMod, false);
	document.getElementById("appcontent").addEventListener("pageshow", pageMod, false);
	function pageMod(event) {
		var win = event.originalTarget.defaultView;
		if (!win.DeviantLove &&
			(/http:\/\/[a-zA-Z\d\-]+\.deviantart\.com\/favourites\//).test(win.location)) {
			win.DeviantLove = {};
			if (!goodies.findLove) {loadGoodies();};
			win.DeviantLove.popup = goodies.$("#DeviantLovePopup", win.document);
			if (win.DeviantLove.popup.length > 0) {
				win.DeviantLove.shield = goodies.$("#DeviantLoveShield", win.document);
				win.DeviantLove.popupState = win.DeviantLove.popup.is(":visible") ? "active" : "inactive";
			} else {
				win.DeviantLove.popup = goodies.$(win.document.createElement("iframe"))
					.css({
						border: "2px solid black",
						borderTop: "0",
						height: (win.innerHeight - 22) + "px",
						position: "fixed",
						right: "50px",
						bottom: win.innerHeight + "px",
						display: "none",
						zIndex: "501"
					}).attr("id", "DeviantLovePopup").appendTo(win.document.body);
				win.DeviantLove.shield = goodies.$(win.document.createElement("div"))
					.css({
						position: "fixed",
						top: "0",
						bottom: "0",
						left: "0",
						right: "0",
						opacity: "0",
						backgroundColor: "white",
						display: "none",
						zIndex: "500"
					}).attr("id", "DeviantLoveShield").appendTo(win.document.body);
				win.DeviantLove.popupState = "inactive";
			}
			win.DeviantLove.pageData = goodies.findLove(win);
		}
	}
	document.getElementById("appcontent").addEventListener("pagehide", function(event) {
		var win = event.originalTarget.defaultView;
		if (win.DeviantLove) {
			win.DeviantLove.popup.stop(true, true);
			win.DeviantLove.shield.stop(true, true);
			win.DeviantLove = null;
			checkLove();
		}
	}, false);
	// TODO: resize handler
	// From https://developer.mozilla.org/en/Code_snippets/Tabbed_browser#Detecting_tab_selection
	gBrowser.tabContainer.addEventListener("TabSelect", checkLove, false);

	var heart = document.getElementById("Deviant-Love-Heart");
	function checkLove() {
		var lovePresent = Boolean(content.DeviantLove);
		heart.hidden = !lovePresent;
	}
	heart.addEventListener("command", function() {
		if (content.DeviantLove.popupState == "inactive") {activate()} else
		if (content.DeviantLove.popupState == "active") {deactivate()};
	}, false);
	function activate() {
		var DLove = content.DeviantLove;
		DLove.popup.show().animate({bottom: "20px"}, 600, "easeOutQuad");
		DLove.shield.show().animate({opacity: "0.4"}, 600, "linear")
			.bind("click", deactivate);
		DLove.popupState = "active";
	}
	function deactivate() {
		var DLove = content.DeviantLove;
		DLove.popup.show().animate({bottom: content.innerHeight + "px"}, 600, "easeOutQuad", function() {
			DLove.popup.hide();
			DLove.shield.hide();
			DLove.popupState = "inactive";
		} );
		DLove.shield.show().animate({opacity: "0"}, 600, "linear").unbind("click");
		DLove.popupState = "deactivating";
	}
}, false);
