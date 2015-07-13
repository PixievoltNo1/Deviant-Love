/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1

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
/* Dependencies:
	- jQuery
	- adapter object
*/
"use strict";

function fulfillPurpose(pageType, ownerOrTitle) {
	var deviantList = [];
	var deviantBag = {};
	// When a deviant is recorded, a reference should be added to both the list and the bag.
	var totalDeviations = 0;
	var firstDeviant;
	var watchedArtists;
	var subaccounts;

	$("body").css("cursor", "wait");
	var preparationScreen = $("<div>", {id: "preparationScreen"}).appendTo(document.body);
	var scanMessage = ({
		featured: "scanningFeatured",
		allFaves: "scanningAll",
		collection: "scanningCollection"
	})[pageType];
	$("<div>", {id: "scanMessage"}).l10n(scanMessage).appendTo(preparationScreen);
	var scanProgressBar = $("<progress>", {id: "scanProgressBar", max: 1, value: 0});
	$("<div>", {id: "scanPercentage"})
		.append( scanProgressBar, $("<div>", {id: "scanPercentageText"}).text("0%"))
		.appendTo(preparationScreen);
	$("<div>", {id: "scannedDeviations"}).appendTo(preparationScreen);
	var watchStatus = $("<div>", {id: "watchStatus"}).appendTo(preparationScreen);
	window.setProgress = function(percentage, found) {
		$("#scannedDeviations").l10n("scannedDeviations", found);
		scanProgressBar.attr("value", percentage);
		$("#scanPercentageText").text( Math.floor(percentage * 100) + "%" );
	}
	window.setData = function(data) {
		data.forEach(function(item, pos) {
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
				URL: item.deviationPage,
				pos: pos
			});
		});
		totalDeviations = data.length;
	}
	window.scanError = function() {
		$("body").css("cursor", "");
		scanProgressBar.hide();
		$("#scanProgressInfo").hide();
		watchStatus.hide();
		$("<div>", {id: "scanError"}).l10n("scanError").appendTo(preparationScreen);
		$("<button>", {id: "retryButton"}).l10n("scanErrorRetry")
			.bind("click", function() {
				$(this).add("#scanError").remove();
				scanProgressBar.show();
				$("#scanProgressInfo").show();
				watchStatus.show();
				$("body").css("cursor", "wait");
				adapter.scanRetry();
			} )
			.appendTo(preparationScreen);
	}
	window.showDeviant = function(deviantName) {
	// This will be replaced by scanDone_startFun.
		firstDeviant = deviantName;
	}
	window.collectWatchlist = function(list) {
		watchedArtists = list;
		watchStatus.l10n("watchSuccess");
	}
	window.watchError = function() {
		watchStatus.l10n("watchFailure");
	}
	window.restore = function(data, firstTip) {
		deviantList = data.deviantList;
		deviantList.forEach(function(deviant) {
			deviantBag[deviant.name] = deviant;
			totalDeviations += deviant.deviations.length;
		});
		watchedArtists = data.watchRetrievalOK; /*
		Only scanDone_startFun needs real information there, and restore bypasses that. So, that only need be truthy or falsey. */
		report(firstTip);
	}
	adapter.retrieve("subaccounts").then( function(data) {
		subaccounts = data.subaccounts || {};
	} );
	window.scanDone_startFun = function(firstTip) {
		for (var deviantName in subaccounts) {
			if (deviantName in deviantBag) {
				deviantBag[deviantName].hasSubaccounts = true;
			}
			var relevant = subaccounts[deviantName].filter( function(subaccount) {
				return (subaccount in deviantBag);
			} );
			if (relevant.length > 0) {
				if (!(deviantName in deviantBag)) {
					deviantBag[deviantName] = {
						name: deviantName,
						deviations: [],
						baseURL: "http://" + deviantName.toLowerCase() + ".deviantart.com/",
						// TODO: Refactor stuff so we don't need an avatar URL right now
						avatar: "http://a.deviantart.net/avatars/i/l/iloveitmoreplz.png?1",
						hasSubaccounts: true
					};
					deviantList.push(deviantBag[deviantName]);
				}
				var deviant = deviantBag[deviantName];
				deviant.subaccounts = [];
				relevant.forEach( function(subaccountName) {
					var subaccount = deviantBag[subaccountName];
					deviant.subaccounts.push(subaccount);
					deviant.deviations = deviant.deviations.concat(subaccount.deviations);
					if (subaccountName in deviantBag) {
						// TODO: Subaccounts don't need to be in deviantBag and deviantList in the first place. Refactor stuff.
						delete deviantBag[subaccountName];
						deviantList.splice(deviantList.indexOf(subaccount), 1);
					}
				} );
				deviant.deviations.sort(function earliestPos(a, b) {
					return a.pos - b.pos;
				});
			}
		}
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
			$("<div>", {id: "watchFailure"}).l10nTooltip("watchFailure").appendTo(scanResults);
		}
		if (adapter.displayType == "popup") {
			var scanResultsLine1 = ({
				featured: "scanFeaturedResultsPopupLine1",
				allFaves: "scanAllResultsPopupLine1",
				collection: "scanCollectionResultsPopupLine1"
			})[pageType];
			scanResults.append($("<div>").l10nHtml(scanResultsLine1,
				'<span class="dynamic">' + Number(totalDeviations) + '</span>')); // The Number call is there to help out AMO reviewers; same for the other calls below
		} else { // adapter.displayType == "sidebar"
			if (/[\<\>\&]/.test(ownerOrTitle)) {ownerOrTitle = "?????????";};
			var scanResultsLine1 = (pageType == "collection") ?
				"scanCollectionResultsSidebarLine1" :
				"scanNonCollectionResultsSidebarLine1";
			var scanResultsLine2 = (pageType == "featured") ?
				"scanFeaturedResultsSidebarLine2" :
				"scanNonFeaturedResultsSidebarLine2";
			scanResults.append($("<div>").l10nHtml(scanResultsLine1,
				'<span class="dynamic">' + ownerOrTitle + '</span>')) // ownerOrTitle is filtered for safety a few lines up
				.append($("<div>").l10nHtml(scanResultsLine2,
				'<span class="dynamic">' + Number(totalDeviations) + '</span>'))
		}
		scanResults.append($("<div>").l10nHtml("scanResultsLastLine",
			'<span class="dynamic">' + Number(deviantList.length) + '</span>'))
			.appendTo(mainScreen);
		$("<form>", {id: "findBar"})
			.append($("<input>", {type: "text", id: "query"}))
			.append($("<button>", {type: "submit", id: "goFind"}))
			.append($("<button>", {type: "button", id: "noFind"}))
			.appendTo(mainScreen);
		$("#query").l10nPlaceholder("queryPlaceholder");
		$("<div>", {id: "queryError"}).hide().appendTo(mainScreen);
		var lovedArtists = $("<div>", {id: "lovedArtists"})
			.css({"overflow-y": "auto", "overflow-x": "hidden"})
			.append(snackOnMyWrath(deviantList))
			.appendTo(mainScreen);
		if (lovedArtists.css("position") == "static") { lovedArtists.css("position", "relative") } // Needed for scrollToDeviationList. It's as weird as it to ensure future compatibility with the skinning feature.
		var subaccountsEditor = $("<div>", {id: "subaccountsEditor"}).hide().appendTo(mainScreen);
		$("<div>", {id: "addSubaccountHeader"}).l10n("subaccountsAdd").appendTo(subaccountsEditor);
		$("<form>", {id: "addSubaccount"})
			.append( $("<label>")
				.append($("<input>", {type: "radio", name: "addDirection", value: "inputToThis"}))
				.append($("<span>", {id: "inputToThisText"})) )
			.append( $("<label>")
				.append($("<input>", {type: "radio", name: "addDirection", value: "thisToInput"}))
				.append($("<span>", {id: "thisToInputText"})) )
			.append( $("<input>", {type: "text", id: "relatedAccount"})
				.l10nPlaceholder("subaccountsAddNamePlaceholder") )
			.append($("<button>", {type: "submit", id: "confirmAdd"}).l10n("subaccountsAddConfirm"))
			.appendTo(subaccountsEditor);
		$("<div>", {id: "tipOfTheMoment"})
			.append($("<img>", {id: "tOTMIcon"}))
			.append($("<div>", {id: "tOTMText"}))
			.appendTo(mainScreen);
		tipOfTheMoment(firstTip);

		// Set up interaction
		var editingSubaccountsOf;
		lovedArtists.delegate(".subaccountsButton", "click", function(event) {
			event.stopImmediatePropagation();
			var button = $(this);
			if (!button.hasClass("editing")) {
				$(".subaccountsButton.editing").removeClass("editing");
				button.addClass("editing");
				editingSubaccountsOf = button.siblings(".deviantName").text();
				if (editingSubaccountsOf in subaccounts) {
					// TODO: Display list of subaccounts
				}
				$("#inputToThisText").l10n("subaccountsAddInputToCurrent", editingSubaccountsOf);
				$("#thisToInputText").l10n("subaccountsAddCurrentToInput", editingSubaccountsOf);
				$("input[value='inputToThis']").prop("checked", true);
				$("#subaccountsEditor").show();
			} else {
				button.removeClass("editing");
				$("#subaccountsEditor").hide();
			}
		} );
		lovedArtists.delegate(".deviant:not(.opened)", "click", function(event, suppressAnimation) {
			$(".opened.deviant").removeClass("opened");
			if (!suppressAnimation) {
				$(".deviant > .closerLook").velocity({height: 0}, {
					duration: 400,
					easing: "swing",
					complete: function() {$(this).remove();}
				});
			} else {
				$(".deviant > .closerLook").remove();
			}

			var deviant = deviantBag[$(".deviantName", this).text()];
			var closerLook = buildCloserLook(deviant, deviant.deviations);
			$(this).append(closerLook).addClass("opened");
			if (!suppressAnimation) {
				var closerLookHeight = closerLook.height();
				closerLook.height(0).velocity({height: closerLookHeight}, {
					duration: 400,
					easing: "swing",
					progress: scrollToDeviationList
				});
			}
		} );
		$("#query").bind("input", function(event) {
			var checkResult = queryTroubleCheck();
			if (typeof checkResult == "object") {
				$("#queryError").l10n(checkResult.errMsg, checkResult.offender).show();
			} else {
				$("#queryError").hide();
			}
		} );
		$("#findBar").submit(findStuff);
		$("#noFind").bind("click", normalMode);
		$("#addSubaccount").bind("submit", function(event) {
			event.preventDefault();
			if ($("#relatedAccount").val() == "") { return; }
			// TODO: Verify that the related account exists
			if ($("input[value='inputToThis']").prop("checked")) {
				var getting = editingSubaccountsOf, gotten = $("#relatedAccount").val();
			} else {
				var gotten = editingSubaccountsOf, getting = $("#relatedAccount").val();
			}
			subaccounts[getting] = (subaccounts[getting] || [])
				.concat(gotten, (subaccounts[gotten] || []));
			// TODO: Update the report to reflect reality
			adapter.store("subaccounts", subaccounts);
		} );
		
		// Handle requests for a particular deviant that were made elsewhere (e.g. context menu)
		window.showDeviant = function(deviantName, isFirst) {
			normalMode();
			$("#deviant_" + deviantName).trigger("click", isFirst || adapter.displayType == "popup")
				.get(0).scrollIntoView();
		}
		if (firstDeviant) {
			showDeviant(firstDeviant, true);
		}

		// All done, now go play!
		$("body").css("cursor", "");
	}
	function findStuff(event) {
		event.preventDefault();
		if (queryTroubleCheck() != false) { return };

		// var queryChunks = firstSplit[0].split("&");
		/* Temporary replacement */ var queryChunks = [$("#query").val()];

		queryChunks = queryChunks.map( function(chunk) {return chunk.trim().toLowerCase()} );
		var checkDeviants = queryChunks.every( function(chunk) {
			return (/[a-zA-Z0-9\-]+/).exec(chunk)[0] == chunk;
		} );

		var deviantMatches = [];
		var deviationMatches = [];
		deviantList.forEach( function(deviant) {
			if (checkDeviants && isMatch(deviant.name)) {
				deviantMatches.push(deviant);
			} else if (deviant.subaccounts) {
				// TODO: Check deviant.subaccounts
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
			return queryChunks.every( function(chunk) {
				return needle.indexOf(chunk) != -1;
			} );
		}

		$("#mainScreen").addClass("lookWhatIFound");
		var lovedArtists = $("#lovedArtists").empty().removeClass("noResults");
		if (deviantMatches.length == 0 && deviationMatches.length == 0) {
			lovedArtists.l10n("foundNothing").addClass("noResults")
			return;
		}
		if (deviantMatches.length > 0) {
			lovedArtists.append( $("<div>", {"class": "foundHeader"})
				.l10n("foundDeviants", deviantMatches.length) )
				.append(snackOnMyWrath(deviantMatches));
		}
		if (deviationMatches.length > 0) {
			deviationMatches.forEach( function(found) {
				var closerLook = buildCloserLook(found.deviant, found.deviations);
				lovedArtists.append( $("<div>", {"class": "foundHeader"})
					.l10n("foundDeviations", found.deviant.name, found.deviations.length) )
					.append(closerLook);
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
	var rageDressing = document.createDocumentFragment();
	var elem = document.createElement.bind(document);
	finkRats.forEach( function(deviant) {
		// Hot loop! A little optimization can make a lot of difference.
		var devWatchElem = $(elem("div")).attr("class", "deviationWatch").html("&nbsp;");
		var subaccountsElem = $(elem("div")).attr("class", "subaccountsButton").html("&nbsp;")
			.l10nTooltip("subaccountsOpen");
		var lineElem = $(elem("div")).attr("class", "deviantLine")
			.append(devWatchElem)
			.append( $(elem("span")).attr("class", "deviantFaves").text(deviant.deviations.length) )
			.append( $(elem("span")).attr("class", "deviantName").text(deviant.name) )
			.append(subaccountsElem);
		var deviantElem = $(elem("div")).attr({"class": "deviant", id: "deviant_" + deviant.name})
			.append(lineElem);
		if (deviant.watched) {
			devWatchElem.addClass("true").l10nTooltip("watchingThisArtist");
		}
		if (deviant.hasSubaccounts) {
			subaccountsElem.addClass("has");
		}
		rageDressing.appendChild(deviantElem[0]);
	} );
	return rageDressing; // on a salad of evil
}
function buildCloserLook(deviant, deviations) {
	var closerLook = $("<div>", {"class": "closerLook"}).css("overflow", "hidden");

	var deviantDetails = $("<div>", {"class": "deviantDetails"});
	var deviantAvatar = $("<img>", {"class": "avatar", width: 50, height: 50})
		.bind("load", function() { deviantDetails.find(".avatarLoading").remove(); } );
	deviantDetails.append( $("<a>", {"href": deviant.baseURL, "class": "deviantLink"})
		.append(deviantAvatar) );
	deviantDetails.append($("<div>", {"class": "avatarLoading"}).l10n("imageLoading"));
	deviantAvatar.attr("src", deviant.avatar);
	deviantDetails.append($("<div>", {"class": "deviantLinks"}) // Note two opening parens and only one closing paren
		.append($("<a>", {"href": deviant.baseURL, "class": "profileLink"})
			.l10nTooltip("profile"))
		.append($("<a>", {"href": deviant.baseURL + "gallery/", "class": "galleryLink"})
			.l10nTooltip("gallery"))
		.append($("<a>", {"href": deviant.baseURL + "favourites/", "class": "favouritesLink"})
			.l10nTooltip("favourites")))
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
// Returns false if there are no troubles, true if there is a trouble not worth reporting to the user, and an object otherwise
	var query = $("#query").val();

	if (query.length == 0 || $("#query").hasClass("placeholder")) { return true };

	var invalidChar = query.search(/[^a-zA-Z0-9 \_\'\"\+\.\,\$\?\:\-\!\=\~\`\@\#\%\^\*\[\]\(\)\/\{\}\\\|]/);
	if (invalidChar != -1) {
		return {errMsg: "findErrorForbiddenCharacter", offender: query.charAt(invalidChar)};
	}

	return false;
}
function makeL10nMethod(methodName, effect) {
	$.fn[methodName] = function(msgName) {
		var replacements = $.makeArray(arguments).slice(1);
		if (replacements.length == 0) {replacements = undefined};
		// This data will be needed when the user will be able to change the language at runtime
		// this.attr("data-l10n", msgName).data("l10nMethod", methodName);
		effect.call(this, adapter.getL10nMsg(msgName, replacements));
		return this;
	}
}
[
	["l10n", $.fn.text],
	["l10nHtml", $.fn.html],
	["l10nTooltip", function(msg) {this.attr("title", msg);}],
	["l10nPlaceholder", function(msg) {this.attr("placeholder", msg);}]
].forEach(function(args) {makeL10nMethod.apply(null, args);});