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
	- displayType string
	- getL10nMsg function
*/
"use strict";

function fulfillPurpose(pageType, ownerOrTitle) {
	var deviantList = [];
	var deviantBag = {};
	var totalDeviations = 0;
	var firstDeviant;
	var watchedArtists;
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
	var watchStatus = $("<div>", {id: "watchStatus"}).appendTo(preparationScreen);
	window.collectData = function(newData) {
		newData.forEach(function(item) {
			if (!deviantBag[item.artistName]) {
				var newDeviant = {};
				newDeviant.name = item.artistName;
				newDeviant.avatar = item.artistAvatar;
				newDeviant.baseURL = item.artistURL;
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
		scanProgress.hide();
		watchStatus.hide();
		$("<div>", {id: "scanError"}).text(l10n.scanError);
		$("<input>", {type: "button", id: "retryButton", value: l10n.scanErrorRetry})
			.bind("click", function() {
				$(this).add("#scanError").remove();
				scanProgress.show();
				watchStatus.show();
				$("body").css("cursor", "wait");
				scanRetry();
			} )
			.appendTo(preparationScreen);
	}
	window.showDeviant = function(deviantName) {
	// This will be replaced by scanDone_startFun.
		firstDeviant = deviantName;
	}
	window.collectWatchlist = function(list) {
		watchedArtists = list;
		watchStatus.text(l10n.watchSuccess);
	}
	window.watchError = function() {
		watchStatus.text(l10n.watchFailure);
	}
	window.restore = function(data, firstTip) {
		deviantList = data.deviantList;
		deviantList.forEach(function(deviant) {
			deviantBag[deviant.name] = deviant;
			totalDeviations += deviant.deviations.length;
		});
		watchedArtists = data.watchRetrievalOK;
		report(firstTip);
	}
	window.scanDone_startFun = function(firstTip) {
		deviantList.sort(function orderMostLoved(a, b) {
			if (a.deviations.length != b.deviations.length) {
				return b.deviations.length - a.deviations.length;
			} else {
				return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
			}
		});
		if (watchedArtists) {
			watchedArtists.forEach(function(awesome) {
				if (deviantBag[awesome]) {
					deviantBag[awesome].watched = true;
				}
			});
		}
		
		report(firstTip);
		return {"deviantList": deviantList, watchRetrievalOK: Boolean(watchedArtists)}; // Needed by the Firefox version
	}
	function report(firstTip) {
		// Construct the UI
		preparationScreen.remove();
		var mainScreen = $("<div>", {id: "mainScreen"});
		mainScreen.appendTo(document.body);
		var scanResults = $("<div>", {id: "scanResults"});
		if (!watchedArtists) {
			$("<div>", {id: "watchFailure", title: l10n.watchFailure}).appendTo(scanResults);
		}
		if (displayType == "popup") {
			var scanResultsLine1Text = ({
				featured: l10n.scanFeaturedResultsPopupLine1,
				allFaves: l10n.scanAllResultsPopupLine1,
				collection: l10n.scanCollectionResultsPopupLine1
			})[pageType];
			scanResults.append($("<div>").html(scanResultsLine1Text.replace("$1",
				'<span class="dynamic">' + totalDeviations.toString() + '</span>')));
		} else { // displayType == "sidebar"
			if (/[\<\>\&]/.test("ownerOrTitle")) {ownerOrTitle = "?????????";};
			var scanResultsLine1Text = pageType == "collection" ?
				l10n.scanCollectionResultsSidebarLine1 :
				l10n.scanNonCollectionResultsSidebarLine1;
			var scanResultsLine2Text = pageType == "featured" ?
				l10n.scanFeaturedResultsSidebarLine2 :
				l10n.scanNonFeaturedResultsSidebarLine2;
			scanResults.append($("<div>").html(scanResultsLine1Text.replace("$1",
				'<span class="dynamic">' + ownerOrTitle + '</span>')))
				.append($("<div>").html(scanResultsLine2Text.replace("$1",
				'<span class="dynamic">' + totalDeviations.toString() + '</span>')))
		}
		scanResults.append($("<div>").html(l10n.scanResultsLastLine.replace("$1",
			'<span class="dynamic">' + deviantList.length.toString() + '</span>')))
			.appendTo(mainScreen);
		$("<form>", {id: "findBar"})
			.append($("<input>", {type: "text", id: "query"}))
			.append($("<button>", {id: "goFind"}))
			.append($("<button>", {id: "noFind"}))
			.appendTo(mainScreen);
		// jQuery apparently refuses to set a button's type. "it causes problems in IE", they say.
		$("#goFind")[0].setAttribute("type", "submit");
		$("#noFind")[0].setAttribute("type", "button");
		if ($("#query")[0].placeholder !== undefined) {
			$("#query")[0].placeholder = l10n.queryPlaceholder;
		} else {
			$("#query").addClass("placeholder").val(l10n.queryPlaceholder);
		}
		$("<div>", {id: "queryError"}).hide().appendTo(mainScreen);
		var lovedArtists = $("<div>", {id: "lovedArtists"})
			.css({"overflow-y": "auto", "overflow-x": "hidden"})
			.append(snackOnMyWrath(deviantList))
			.appendTo(mainScreen);
		if (lovedArtists.css("position") == "static") { lovedArtists.css("position", "relative") } // Needed for scrollToDeviationList. It's as weird as it to ensure future compatibility with the skinning feature.
		$("<div>", {id: "tipOfTheMoment"})
			.append($("<img>", {id: "tOTMIcon"}))
			.append($("<div>", {id: "tOTMText"}))
			.appendTo(mainScreen);
		tipOfTheMoment(firstTip);

		// Set up interaction
		lovedArtists.delegate(".deviant:not(.opened)", "click", function() {
			$(".opened.deviant").removeClass("opened");
			$(".deviant > .closerLook").animate({height: 0}, {
				duration: 400,
				easing: "swing",
				complete: function() {$(this).remove();}
			})

			var deviant = deviantBag[$(".deviantName", this).text()];
			var closerLook = buildCloserLook(deviant, deviant.deviations);
			$(this).append(closerLook).addClass("opened");
			var closerLookHeight = closerLook.height();
			closerLook.height(0).animate({height: closerLookHeight}, {
				duration: 400,
				easing: "swing",
				step: scrollToDeviationList
			});
		} );
		if ($("#query").hasClass("placeholder")) { // Placeholder attribute emulation
			$("#query").bind("focus", function() {
				if ($(this).hasClass("placeholder")) {
					$(this).val("").removeClass("placeholder");
				}
			} ).bind("blur", function() {
				if ($(this).val() == "") {
					$(this).addClass("placeholder").val(l10n.queryPlaceholder);
				}
			} )
		}
		$("#query").bind("input", function(event) {
			var checkResult = queryTroubleCheck();
			if (typeof checkResult == "string") {
				$("#queryError").text(checkResult).show();
			} else {
				$("#queryError").hide();
			}
		} );
		$("#findBar").submit(findStuff);
		$("#noFind").bind("click", normalMode);
		
		// Handle requests for a particular deviant that were made elsewhere (e.g. context menu)
		if (firstDeviant) {
			$.fx.off = true;
			$("#deviant_" + firstDeviant).trigger("click")
				.get(0).scrollIntoView();
			$.fx.off = false;
		}
		window.showDeviant = function(deviantName) {
			normalMode();
			$.fx.off = (displayType == "popup");
			$("#deviant_" + deviantName).trigger("click")
				.get(0).scrollIntoView();
			$.fx.off = false;
		}

		// All done, now go play!
		$("body").css("cursor", "");
	}
	function findStuff(event) {
		event.preventDefault();
		if (queryTroubleCheck() != false) { return };

		// Everything related to advanced operators is being disabled for the 2.0 release, to avoid delaying it even further.
		/*
		var firstSplit = $("#query").val().split("~");
		var ignoreList = firstSplit.slice(1);
		var queryChunks = firstSplit[0].split("&");
		*/
		/* Temporary replacement */ var queryChunks = [$("#query").val()];

		// ignoreList = ignoreList.map( function(ignore) {return ignore.trim().toLowerCase()} );
		queryChunks = queryChunks.map( function(chunk) {return chunk.trim().toLowerCase()} );
		var checkDeviants = queryChunks.every( function(chunk) {
			return (/[a-zA-Z0-9\-]+/).exec(chunk)[0] == chunk;
		} );

		var deviantMatches = [];
		var deviationMatches = [];
		deviantList.forEach( function(deviant) {
			if (checkDeviants && isMatch(deviant.name)) {
				deviantMatches.push(deviant);
			}
			var deviantDeviationMatches = [];
			deviant.deviations.forEach( function(deviation) {
				if (isMatch(deviation.name)) {
					deviantDeviationMatches.push(deviation);
				}
			} );
			if (deviantDeviationMatches.length > 0) {
				deviationMatches.push({"deviant": deviant, "deviations": deviantDeviationMatches});
			}
		} );
		function isMatch(needle) {
			needle = needle.toLowerCase();
			/*
			ignoreList.forEach( function(ignore) {
				// My research tells me String.replace will only replace the first instance of its first parameter, unless said parameter is a global RegExp.
				// But ignoreList doesn't consist of global RegExps, it consists of strings. The workaround?
				needle = needle.split(ignore).join("~");
			} );
			*/
			return queryChunks.every( function(chunk) {
				return needle.indexOf(chunk) != -1;
			} );
		}

		$("#mainScreen").addClass("lookWhatIFound");
		var lovedArtists = $("#lovedArtists").empty().removeClass("noResults");
		if (deviantMatches.length == 0 && deviationMatches.length == 0) {
			lovedArtists.text(l10n.foundNothing).addClass("noResults")
			return;
		}
		if (deviantMatches.length > 0) {
			lovedArtists.append( $("<div>", {"class": "foundHeader"})
				.text(l10n.foundDeviants.replace("$1", deviantMatches.length)) )
				.append(snackOnMyWrath(deviantMatches));
		}
		if (deviationMatches.length > 0) {
			deviationMatches.forEach( function(found) {
				var closerLook = buildCloserLook(found.deviant, found.deviations);
				lovedArtists.append( $("<div>", {"class": "foundHeader"})
					.text(l10n.foundDeviations
						.replace("$1", found.deviations.length).replace("$2", found.deviant.name)) )
					.append(closerLook);
				closerLook.height(closerLook.height()); // Sounds a bit silly but the CSS needs it.
			} );
		}
	}
	function normalMode() {
		if ($("#mainScreen").hasClass("lookWhatIFound")) {
			$("#mainScreen").removeClass("lookWhatIFound");
			$("#lovedArtists").removeClass("noResults").empty().append(snackOnMyWrath(deviantList));
		}
	}
}

var l10n;
function setL10n(object) {
	l10n = object;
	// In the future, this will need to handle what happens when fulfillPurpose has already been called.
}
function tipOfTheMoment(tip) {
	$("#tOTMIcon").attr("src", "core/" + tip.icon);
	$("#tOTMText").html(tip.html);
}
function scrollToDeviationList() {
// Differs from the DOM method scrollIntoView in that it doesn't align .opened.deviant with either the top or bottom of the display area unless that is necessary to keep it in view
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
// snackOnMyWrath and buildCloserLook are needed by both scanDone_startFun and findStuff
function snackOnMyWrath(finkRats) {
	// "You have energy like a little angry battery with no friends."
	var rageDressing = $();
	finkRats.forEach( function(deviant) {
		var deviantElem = $("<div>", {"class": "deviant", id: "deviant_" + deviant.name})
			.append($("<span>", {"class": "deviantFaves"}).text(deviant.deviations.length));
		if (deviant.watched) {
			deviantElem.append($("<div>",
				{"class": "deviationWatch", title: l10n.watchingThisArtist}).html("&nbsp;"));
		}
		deviantElem.append($("<span>", {"class": "deviantName"}).text(deviant.name));
		rageDressing = rageDressing.add(deviantElem);
	} );
	return rageDressing; // on a salad of evil
}
function buildCloserLook(deviant, deviations) {
// Anything relying on this function will need to make sure that returned element's CSS height is set to its natural height. The CSS assumes that that has been done.
	var closerLook = $("<div>", {"class": "closerLook"}).css("overflow", "hidden");

	var deviantDetails = $("<div>", {"class": "deviantDetails"});
	deviantDetails.append($("<a>", {"href": deviant.baseURL}) // Note two opening parens and only one closing paren
		.append($("<img>", {src: deviant.avatar, "class": "avatar", width: 50, height: 50})));
	deviantDetails.append($("<div>", {"class": "deviantLinks"}) // Ditto
		.append($("<a>", {"href": deviant.baseURL, "class": "profileLink",
			title: l10n.profileLinkName}))
		.append($("<a>", {"href": deviant.baseURL + "gallery/", "class": "galleryLink",
			title: l10n.galleryLinkName}))
		.append($("<a>", {"href": deviant.baseURL + "favourites/", "class": "favouritesLink"
			/* Delaying tooltip addition until after the big change to l10n */})));
	deviantDetails.appendTo(closerLook);

	var deviationList = $("<div>", {"class": "deviationList"});
	deviations.forEach( function(deviation) {
		$("<div>", {"class": "deviation"})
			.append($("<a>", {href: deviation.URL}).text(deviation.name))
			.appendTo(deviationList)
	} );
	deviationList.appendTo(closerLook);

	return closerLook;
}
function queryTroubleCheck() {
// Returns false if there are no troubles, true if there is a trouble not worth reporting to the user, and a message string otherwise
	var query = $("#query").val();

	if (query.length == 0 || $("#query").hasClass("placeholder")) { return true };

	var invalidChar = query.search(/[^a-zA-Z0-9 \_\'\"\+\.\,\$\?\:\-]/);
	if (invalidChar != -1) {
		return l10n.findErrorForbiddenCharacter.replace("$1", query.charAt(invalidChar));
	}

	return false;
}
function makeL10nMethod(methodName, effect, tmpMsg) {
	$.fn[methodName] = function(msgName) {
		var replacements = $.makeArray(arguments).slice(1);
		// The following line will be needed for v3.0, when the user will be able to choose a language
		// this.attr("data-l10n", msgName).data("l10nMethod", methodName);
		getL10nMsg(msgName, replacements, $.proxy(effect, this), tmpMsg);
		return this;
	}
}