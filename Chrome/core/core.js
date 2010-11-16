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
/* Defined elsewhere:
	- $ (jQuery)
	- New Array methods in ECMAScript 5th Edition
	- scanRetry function
	- cssTransitions object
*/

function fulfillPurpose(pageType) {
	var deviantList = [];
	var deviantBag = {};
	var totalDeviations = 0;
	// When a deviant is recorded, a reference should be added to both the list and the bag.

	$("body").css("cursor", "wait");
	var preparationScreen = $("<div>", {id: "preparationScreen"}).appendTo(document.body);
	var scanMessageText = ({
		featured: l10n.scanningFeatured,
		allFaves: l10n.scanningAll,
		collection: l10n.scanningCollection
	})[pageType];
	$("<div>", {id: "scanMessage"}).text(scanMessageText).appendTo(preparationScreen);
	var scanProgress = $("<div>", {id: "scanProgress"}).appendTo(preparationScreen);
	window.collectData = function(newData) {
		newData.forEach(function(item) {
			if (!deviantBag[item.artistName]) {
				var newDeviant = {};
				newDeviant.name = item.artistName;
				newDeviant.avatar = item.artistAvatar;
				newDeviant.profileURL = item.artistProfile;
				newDeviant.galleryURL = item.artistGallery;
				newDeviant.deviations = [];
				deviantBag[item.artistName] = newDeviant;
				deviantList.push(newDeviant);
			}
			deviantBag[item.artistName].deviations.push({
				name: item.deviationName,
				URL: item.deviationPage
			});
			totalDeviations++;
		});
		scanProgress.text(l10n.scanProgress.replace("$1", totalDeviations));
	}
	window.scanError = function() {
		$("body").css("cursor", "");
		scanProgress.text(l10n.scanError);
		$("<input>", {type: "button", id: "retryButton", value: l10n.scanErrorRetry})
			.bind("click", function() {
				scanProgress.text("");
				$(this).remove();
				$("body").css("cursor", "wait");
				scanRetry();
			} )
			.appendTo(preparationScreen);
	}
	window.scanDone_startFun = function(firstTip) {
		deviantList.sort(function orderMostLoved(a, b) {
			if (a.deviations.length != b.deviations.length) {
				return b.deviations.length - a.deviations.length;
			} else {
				return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
			}
		});
		preparationScreen.remove();

		// Construct the UI
		var mainScreen = $("<div>", {id: "mainScreen"});
		mainScreen.appendTo(document.body);
		var scanResultsLine1Text = ({
			featured: l10n.scanFeaturedResultsLine1,
			allFaves: l10n.scanAllResultsLine1,
			collection: l10n.scanCollectionResultsLine1
		})[pageType];
		$("<div>", {id: "scanResults"})
			.append($("<div>", {id: "scanResultsLine1"}).html(scanResultsLine1Text.replace("$1",
				'<span id="faveCount">' + totalDeviations.toString() + '</span>')))
			.append($("<div>", {id: "scanResultsLine2"}).html(l10n.scanResultsLine2.replace("$1",
				'<span id="deviantCount">' + deviantList.length.toString() + '</span>')))
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
		$("<div>", {id: "tipOfTheMoment"})
			.append($("<img>", {id: "tOTMIcon"}))
			.append($("<div>", {id: "tOTMText"}))
			.appendTo(mainScreen);
		tipOfTheMoment(firstTip);

		// Set up interaction
		$("#lovedArtists").delegate(".deviant:not(.opened)", "click", function() {
			$(".opened.deviant").removeClass("opened");
			if (!cssTransitions) {
				$(".closerLook").remove();
			} else {
				$(".closerLook").one(cssTransitions.eventName,
					function() { $(this).remove(); } ).height(0);
			}

			var deviant = deviantBag[$(".deviantName", this).text()];
			var closerLook = $("<div>", {"class": "closerLook"});

			var deviantDetails = $("<div>", {"class": "deviantDetails"});
			deviantDetails.append($("<a>", {"href": deviant.profileURL}) // Note two opening parens and only one closing paren
				.append($("<img>", {src: deviant.avatar, "class": "avatar", width: 50, height: 50})));
			deviantDetails.append($("<div>", {"class": "deviantLinks"}) // Ditto
				.append($("<a>", {"href": deviant.profileURL, "class": "profileLink",
					title: l10n.profileLinkDescription}))
				.append($("<a>", {"href": deviant.galleryURL, "class": "galleryLink",
					title: l10n.galleryLinkDescription})));
			deviantDetails.appendTo(closerLook);

			var deviationList = $("<div>", {"class": "deviationList"});
			deviant.deviations.forEach( function(deviation) {
				$("<div>", {"class": "deviation"})
					.append($("<a>", {href: deviation.URL}).text(deviation.name))
					.appendTo(deviationList)
			} );
			deviationList.appendTo(closerLook);

			closerLook.css("overflow", "hidden").appendTo(this);
			if (!cssTransitions) {
				scrollToDeviationList();
			} else {
				var closerLookHeight = closerLook.height();
				closerLook.height(0).css(cssTransitions.propertyName, "height 0.4s ease")
					.one(cssTransitions.eventName, scrollToDeviationList).height(closerLookHeight);
			}
			$(this).addClass("opened");
		} );

		$("body").css("cursor", "");
	}
}

var l10n;
function setL10n(object) {
	l10n = object;
	// In the future, this will need to handle what happens when fulfillPurpose has already been called.
}
function tipOfTheMoment(tip) {
	$("#tOTMIcon").attr("src", tip.icon);
	$("#tOTMText").html(tip.html);
}
function scrollToDeviationList() {
	// It's actually easier NOT to use jQuery here.
	var lovedArtistsElem = document.getElementById("lovedArtists");
	var openedDeviantElem = document.querySelector(".opened.deviant");
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