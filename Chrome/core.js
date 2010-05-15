/*
	This file is part of Deviant Love.
	Copyright 2010 Pikadude No. 1

	Deviant Love is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Deviant Love is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with Deviant Love.  If not, see <http://www.gnu.org/licenses/>.
*/

function fulfillPurpose(popup) {
	var mainScreen = $("<div>", {id: "mainScreen"});
	var deviantList = [];
	var deviantBag = {};
	var totalDeviations = 0;
	// When a deviant is recorded, a reference should be added to both the list and the bag.
	
	if (!$.isEmptyObject(popup.state)) {
		deviantList = popup.state.deviantList;
		deviantBag = popup.state.deviantBag;
		totalDeviations = popup.state.totalDeviations;
		// The no-ID div and the setTimeout are needed to work around a Chrome bug
		$("<div>").css({
			width: popup.state.mainScreenWidth || 10,
			height: popup.state.mainScreenHeight || 10
		}).appendTo(popup.doc);
		setTimeout(function() {
			popup.doc.empty();
			if (popup.state.doc) {
				mainScreen = $((popup.doc[0].ownerDocument).importNode(popup.state.doc, true)).appendTo(popup.doc);
				$("#lovedArtists", popup.doc).scrollTop(popup.state.scrollPos);
				eventSetup();
				tipOfTheMoment();
			} else { deviantDisplay() }
		}, 10);
	} else {
		var preparationScreen = $("<div>", {id: "preparationScreen"}).appendTo(popup.doc);
		$("<div>", {id: "scanMessage"}).text(chrome.i18n.getMessage("scanMessage"))
			.appendTo(preparationScreen);
		var scanProgress = $("<div>", {id: "scanProgress"}).appendTo(preparationScreen);
		$.ajaxSetup({
			dataType: "xml",
			success: scanFeed,
			error: function() {
				scanProgress.css("cursor", "auto").text(chrome.i18n.getMessage("scanError")); }
		});
		$.ajax({url: popup.feedHref});
	}
	function scanFeed(feed) {
		$("item", feed).each( function() {
			var faveName = $("title:eq(0)", this).text();
			var faveURL = $("link", this).text();
			var loved = $('[role="author"]:eq(0)', this).text();
			if (!deviantBag[loved]) {
				var newDeviant = {};
				newDeviant.name = loved;
				newDeviant.avatar = $('[role="author"]:eq(1)', this).text();
				newDeviant.profileURL = $("copyright", this).attr("url");
				newDeviant.galleryURL = newDeviant.profileURL + "/gallery/";
				newDeviant.deviations = [];
				deviantBag[loved] = newDeviant;
				deviantList.push(newDeviant);
			}
			deviantBag[loved].deviations.push({
				name: faveName,
				URL: faveURL
			});
			totalDeviations++;
		} );
		scanProgress.text(chrome.i18n.getMessage("scanProgress", totalDeviations.toString()));
		var nextPage = $('channel > [rel="next"]', feed);
		if (nextPage.length != 0) {
			$.ajax({url: nextPage.attr("href")});
		} else {
			deviantList.sort(orderMostLoved);
			popup.state.deviantBag = deviantBag;
			popup.state.deviantList = deviantList;
			popup.state.totalDeviations = totalDeviations;
			preparationScreen.remove();
			deviantDisplay();
		}
	}
	function orderMostLoved(a, b) {
		if (a.deviations.length != b.deviations.length) {
			return b.deviations.length - a.deviations.length;
		} else {
			return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
		}
	}
	function deviantDisplay() {
		mainScreen.appendTo(popup.doc);
		
		$("<div>", {id: "scanResults"})
			.append($("<div>", {id: "scanResultsLine1"}).html(chrome.i18n.getMessage(
				"scanResultsLine1", '<span id="faveCount">' + totalDeviations.toString() + '</span>')))
			.append($("<div>", {id: "scanResultsLine2"}).html(chrome.i18n.getMessage(
				"scanResultsLine2", '<span id="deviantCount">' + deviantList.length.toString() + '</span>')))
			.appendTo(mainScreen);
		
		var lovedArtists = $("<div>", {id: "lovedArtists"})
			.css({"overflow-y": "auto", "overflow-x": "hidden"});
			// don't call appendTo until we're done with this
		deviantList.forEach( function(deviant) {
			$("<div>", {"class": "deviant", id: "deviant_" + deviant.name})
				.append($("<span>", {"class": "deviantFaves"}).text(deviant.deviations.length))
				.append($("<span>", {"class": "deviantName"}).text(deviant.name))
				.appendTo(lovedArtists);
		} );
		
		lovedArtists.appendTo(mainScreen);
		if (lovedArtists.css("position") == "static") { lovedArtists.css("position", "relative") } // Needed for scrollToDeviationList. It's as weird as it to ensure future compatibility with the skinning feature.
		
		$("<div>", {id: "tipOfTheMoment"}).appendTo(mainScreen);
		eventSetup();
		tipOfTheMoment();
		
		// All weirdnesses present in the following setTimeout are for working around Chrome bugs
		setTimeout(function() {
			popup.state.mainScreenWidth = lovedArtists.outerWidth();
			popup.state.mainScreenHeight = mainScreen.outerHeight();
			popup.state.scrollPos = 0;
			saveScreen();
		}, 10);
	}
	function tipOfTheMoment() {
		// localStorage.nextTip is 1-based, but JavaScript array indexes are 0-based. Oh well.
		var nextTip = localStorage.nextTip || 1;
		$.getJSON(chrome.i18n.getMessage("tipsFile"), function(tips) {
			$("#tipOfTheMoment", popup.doc).html(tips[nextTip - 1]);
			nextTip++;
			if (nextTip > tips.length) {nextTip = 1}
			localStorage.nextTip = nextTip;
		} );
	}
	function eventSetup() {
		$("#lovedArtists", popup.doc).delegate(".deviant:not(.opened)", "click", function() {
			$(".closerLook", popup.doc).parent().removeClass("opened").end().css("-webkit-transition-duration", ".39s")
				.one("webkitTransitionEnd", function() { $(this).remove(); } ).height(0);
			
			var deviant = deviantBag[$(".deviantName", this).text()];
			var closerLook = $("<div>", {"class": "closerLook"});
			
			var deviantDetails = $("<div>", {"class": "deviantDetails"});
			deviantDetails.append($("<a>", {"href": deviant.profileURL}) // Note two opening parens and only one closing paren
				.append($("<img>", {src: deviant.avatar, "class": "avatar", width: 50, height: 50})));
			deviantDetails.append($("<div>", {"class": "deviantLinks"}) // Ditto
				.append($("<a>", {"href": deviant.profileURL, "class": "profileLink",
					title: chrome.i18n.getMessage("profile")}))
				.append($("<a>", {"href": deviant.galleryURL, "class": "galleryLink",
					title: chrome.i18n.getMessage("gallery")})));
			deviantDetails.appendTo(closerLook);
			
			var deviationList = $("<div>", {"class": "deviationList"});
			deviant.deviations.forEach( function(deviation) {
				$("<div>", {"class": "deviation"})
					.append($("<a>", {href: deviation.URL}).text(deviation.name))
					.appendTo(deviationList)
			} );
			deviationList.appendTo(closerLook);
			
			closerLook.css("overflow", "hidden").appendTo(this);
			var closerLookHeight = closerLook.height();
			closerLook.height(0).css("-webkit-transition", "height 0.4s ease")
				.one("webkitTransitionEnd", scrollToDeviationList).height(closerLookHeight);
			$(this).addClass("opened");
			saveScreen();
		} ).scroll(function() {popup.state.scrollPos = $(this).scrollTop()});
	}
	function scrollToDeviationList() {
		// For the most part, it's actually easier NOT to use jQuery here.
		var lovedArtistsElem = $("#lovedArtists", popup.doc)[0];
		var openedDeviantElem = $(".opened.deviant", popup.doc)[0];
		var scroll = lovedArtistsElem.scrollTop;
		if (scroll + lovedArtistsElem.clientHeight <
			openedDeviantElem.offsetTop + openedDeviantElem.offsetHeight) {
			scroll = openedDeviantElem.offsetTop + openedDeviantElem.offsetHeight
				- lovedArtistsElem.clientHeight;
		}
		if (scroll > openedDeviantElem.offsetTop) {
			scroll = openedDeviantElem.offsetTop;
		}
		lovedArtistsElem.scrollTop = scroll;
	}
	function saveScreen() {
		popup.state.doc = mainScreen.clone()[0];
	}
}