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
"use strict";

function Deviant(name) {
	this.name = name;
	this.deviations = [];
}
Object.defineProperties(Deviant.prototype, {
	baseURL: {
		get: function() {
			return this.baseURL = "http://" + this.name.toLowerCase() + ".deviantart.com/";
		}, set: function(val) {
			Object.defineProperty(this, "baseURL", {value: val, enumerable: true})
		}
	}
});
function beginPreparations(love) {
	var scannerController;
	var firstDeviant;

	$("body").css("cursor", "wait");
	var preparationScreen = $("<div>", {id: "preparationScreen"}).appendTo(document.body);
	var scanMessage = ({
		featured: "scanningFeatured",
		allFaves: "scanningAll",
		collection: "scanningCollection",
		search: "scanningSearch"
	})[love.pageType];
	$("<div>", {id: "scanMessage"}).l10n(scanMessage).appendTo(preparationScreen);
	var scanProgressBar = $("<progress>", {id: "scanProgressBar", max: 1, value: 0});
	var scanPercentageText = $("<div>", {id: "scanPercentageText"}).text("0%");
	$("<div>", {id: "scanPercentage"})
		.append(scanProgressBar, scanPercentageText)
		.appendTo(preparationScreen);
	if (!love.maxDeviations) {
		scanProgressBar.removeAttr("value");
		scanPercentageText.hide();
	}
	$("<div>", {id: "scannedDeviations"}).appendTo(preparationScreen);
	var watchStatus = $("<div>", {id: "watchStatus"}).appendTo(preparationScreen);
	$("<div>", {id: "scanError"}).l10n("scanError").hide().appendTo(preparationScreen);
	$("<button>", {id: "retryButton"}).l10n("scanErrorRetry").hide().appendTo(preparationScreen);
	window.startScan = function() {
		scannerController = researchLove(love.feedHref, love.maxDeviations);
		scannerController.progress.add(setProgress);
		var faves = scannerController.faves.catch( function catcher(thrown) {
			scanError();
			return thrown.retryResult.catch(catcher);
		} );
		var organized = faves.then(organizeData);
		var watched = scannerController.watched.then(collectWatchlist, watchError);
		Promise.all([organized, watched, getAllUserPrefs(), nextTip()]).then(finish);
		return scannerController;
	}
	function organizeData(faves) {
		var deviantMap = new Map();
		faves.forEach(function(item, pos) {
			if (!deviantMap.has(item.artistName)) {
				var newDeviant = new Deviant(item.artistName);
				newDeviant.avatar = item.artistAvatar;
				deviantMap.set(item.artistName, newDeviant);
			}
			deviantMap.get(item.artistName).deviations.push({
				name: item.deviationName,
				URL: item.deviationPage,
				pos: pos
			});
		});
		var totalDeviations = faves.length;

		return {deviantMap, totalDeviations};
	}
	function setProgress(data) {
		$("#scannedDeviations").l10n("scannedDeviations", data.found);
		if (data.percent) {
			scanProgressBar.attr("value", data.percent);
			scanPercentageText.text( Math.floor(data.percent * 100) + "%" );
		}
	}
	function scanError() {
		scannerController.pause();
		$("body").css("cursor", "");
		$("#scanPercentage").hide();
		$("#scannedDeviations").hide();
		watchStatus.hide();
		$("#scanError, #retryButton").show();
	}
	$("#retryButton").bind("click", function() {
		$(this).add("#scanError").hide();
		$("#scanPercentage").show();
		$("#scannedDeviations").show();
		watchStatus.show();
		$("body").css("cursor", "wait");
		scannerController.resume();
		scannerController.retry();
	} );
	window.showDeviant = function(deviantName) {
		firstDeviant = deviantName;
	}
	function collectWatchlist(list) {
		watchStatus.l10n("watchSuccess");
		return list;
	}
	function watchError(thrown) {
		if (thrown.reason == "netError") {
			scanError();
			return thrown.retryResult.then(collectWatchlist, watchError);
		}
		watchStatus.l10n( (thrown.reason == "notLoggedIn") ?
			"watchErrorNotLoggedIn" : "watchErrorInternal" );
		return {error: thrown.reason};
	}
	function finish([organizedFaves, watched, prefs, firstTip]) {
		let results = {
			deviants: new DeviantCollection(organizedFaves.deviantMap, Deviant),
			totalDeviations: organizedFaves.totalDeviations,
			watchedArtists: watched
		};
		adapter.prepComplete(results);
		preparationScreen.remove();
		var ui = {firstTip, firstDeviant};
		report(results, prefs, ui, love);
	}
}
function restore(scanData, love) {
	var firstDeviant;
	window.showDeviant = function(deviantName) {
		firstDeviant = deviantName;
	};
	scanData.deviants = new DeviantCollection(scanData.deviants);
	Promise.all([getAllUserPrefs(), nextTip()]).then(function([prefs, tip]) {
		var ui = {firstTip: tip, firstDeviant: firstDeviant};
		report(scanData, prefs, ui, love);
	});
}
function report(results, prefs, ui, love) {
	var {deviants, totalDeviations, watchedArtists} = results;
	deviants.setSubaccounts(prefs.subaccounts);

	// Construct the UI
	var mainScreen = $("<div>", {id: "mainScreen"});
	mainScreen.appendTo(document.body);
	var scanResults = $("<div>", {id: "scanResults"});
	if (adapter.displayType == "popup") {
		var scanResultsLine1 = ({
			featured: "scanResultsPopupFeaturedLine1",
			allFaves: "scanResultsPopupAllLine1",
			collection: "scanResultsPopupCollectionLine1",
			search: "scanResultsPopupSearchLine1"
		})[love.pageType];
		scanResults.append($("<div>").l10nHtml(scanResultsLine1,
			'<span class="dynamic">' + Number(totalDeviations) + '</span>')); // The Number call is there to help out AMO reviewers; same for the other calls below
	} else { // adapter.displayType == "sidebar"
		if (/[\<\>\&]/.test(love.ownerOrTitle)) {love.ownerOrTitle = "?????????";};
		var scanResultsLine1 = (love.pageType == "collection") ?
			"scanResultsSidebarCollectionLine1" :
			"scanResultsSidebarNonCollectionLine1";
		var scanResultsLine2 = (love.pageType == "featured") ? "scanResultsSidebarFeaturedLine2"
			: (love.pageType == "search") ? "scanResultsSidebarSearchLine2"
			: "scanResultsSidebarOtherLine2";
		scanResults.append($("<div>").l10nHtml(scanResultsLine1,
			'<span class="dynamic">' + love.ownerOrTitle + '</span>')) // love.ownerOrTitle is filtered for safety a few lines up
			.append($("<div>").l10nHtml(scanResultsLine2,
			'<span class="dynamic">' + Number(totalDeviations) + '</span>'))
	}
	scanResults.append($("<div>", {id: "artistCount"}).l10nHtml("scanResultsLastLine",
		'<span class="dynamic">' + Number(deviants.list.length) + '</span>'))
		.appendTo(mainScreen);
	$("<form>", {id: "findBar", "class": "textEntryLine"})
		.append($("<input>", {type: "text", id: "query"}))
		.append($("<button>", {type: "submit", id: "goFind"}))
		.append($("<button>", {type: "button", id: "noFind"}))
		.appendTo(mainScreen);
	$("#query").l10nPlaceholder("queryPlaceholder");
	$("<div>", {id: "queryError"}).hide().appendTo(mainScreen);
	var normalModePrefix = $();
	if (!(watchedArtists instanceof Set)) {
		normalModePrefix = $("<div>", {id: "watchFailure", "class": "notice"})
			.l10n( (watchedArtists.error == "notLoggedIn") ? "watchErrorNotLoggedIn" : "watchErrorInternal" );
	}
	var lovedArtists = $("<div>", {id: "lovedArtists"})
		.css({"overflow-y": "auto", "overflow-x": "hidden"})
		.appendTo(mainScreen);
	normalMode();
	if (lovedArtists.css("position") == "static") { lovedArtists.css("position", "relative") } // Needed for scrollToDeviationList. It's as weird as it to ensure future compatibility with the skinning feature.
	var subaccountsEditor = $("<div>", {id: "subaccountsEditor"}).hide().appendTo(mainScreen)
		.append( $("<div>", {id: "closeSubaccountsEditor"}).l10nTooltip("subaccountsClose") );
	$("<div>", {id: "subaccountsList"})
		.append( $("<div>", {id: "subaccountsListHeader", "class": "sectionHeader"}) )
		.append( $("<div>", {id: "subaccountsListContents"}) )
		.appendTo(subaccountsEditor);
	$("<form>", {id: "addSubaccount"})
		.append( $("<div>", {"class": "sectionHeader"}).l10n("subaccountsAdd") )
		.append( $("<label>")
			.append($("<input>", {type: "radio", name: "addDirection", value: "inputToThis"}))
			.append($("<span>", {id: "inputToThisText"})) )
		.append( $("<label>")
			.append($("<input>", {type: "radio", name: "addDirection", value: "thisToInput"}))
			.append($("<span>", {id: "thisToInputText"})) )
		.append( $("<div>", {"class": "textEntryLine"})
			.append( $("<input>", {type: "text", id: "relatedAccount"})
				.l10nPlaceholder("subaccountsAddNamePlaceholder") )
			.append( $("<button>", {type: "submit", id: "confirmAdd"})
				.l10n("subaccountsAddConfirm") ) )
		.append( $("<div>", {id: "addNotice"}).hide() )
		.appendTo(subaccountsEditor);
	$("<div>", {id: "tipOfTheMoment"})
		.append($("<img>", {id: "tOTMIcon"}))
		.append($("<div>", {id: "tOTMText"}))
		.appendTo(mainScreen);
	tipOfTheMoment(ui.firstTip);

	// Set up interaction
	lovedArtists.delegate(".deviant:not(.opened)", "click", function(event, suppressAnimation) {
		if ( $(event.target).hasClass("subaccountsButton") ) { return; }
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

		var deviant = deviants.effectiveMap.get($(".deviantName", this).text());
		var closerLook = buildCloserLook(deviant, deviant.deviations);
		$(this).append(closerLook).addClass("opened");
		if (!suppressAnimation) {
			var closerLookHeight = closerLook.height();
			closerLook.height(0).velocity({height: closerLookHeight}, {
				duration: 400,
				easing: "swing",
				progress: scrollToDeviationList,
				complete: function(elements) { elements[0].style.height = ""; }
			});
		}
	} );
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
	$("#query").bind("input", function(event) {
		var checkResult = queryTroubleCheck(this.value);
		if (typeof checkResult == "object") {
			$("#queryError").l10n(checkResult.errMsg, checkResult.offender).show();
		} else {
			$("#queryError").hide();
		}
	} );
	$("#findBar").bind("submit", function(event) {
		event.preventDefault();
		var query = $("#query").val();
		if (query == "") { return; }
		if (queryTroubleCheck(query)) { return; }

		var {deviantMatches, deviantMatchingSubaccount, deviationMatches} = findStuff(query, deviants);

		$("#mainScreen").addClass("lookWhatIFound");
		var lovedArtists = $("#lovedArtists").empty().removeClass("noResults");
		if (deviantMatches.length == 0 && deviationMatches.length == 0) {
			lovedArtists.l10n("foundNothing").addClass("noResults");
		}
		if (deviantMatches.length > 0) {
			lovedArtists.append( $("<div>", {"class": "sectionHeader"})
				.l10n("foundDeviants", deviantMatches.length) )
				.append(snackOnMyWrath(deviantMatches));
			for (var deviantName in deviantMatchingSubaccount) {
				$("#deviant_" + deviantName).prepend( $("<div>", {"class": "deviantNote"})
					.l10n("foundDeviantSubaccount", deviantMatchingSubaccount[deviantName]) )
			}
		}
		if (deviationMatches.length > 0) {
			deviationMatches.forEach( function(found) {
				var closerLook = buildCloserLook(found.deviant, found.deviations);
				lovedArtists.append( $("<div>", {"class": "sectionHeader"})
					.l10n("foundDeviations", found.deviant.name, found.deviations.length) )
					.append(closerLook);
			} );
		}
		if (query.indexOf(" ") != -1 && query.indexOf("&") == -1) {
			$("<div>", {"id": "ampersandHint", "class": "notice"}).l10n("findAmpersandHint")
				.appendTo(lovedArtists);
		}
	});
	$("#noFind").bind("click", normalMode);
	var editingSubaccountsOf;
	$("#lovedArtists").delegate(".subaccountsButton", "click", function(event) {
		var button = $(this);
		if (!button.hasClass("editing")) {
			$(".subaccountsButton.editing").removeClass("editing");
			button.addClass("editing");
			editingSubaccountsOf = button.siblings(".deviantName").text();
			$("#subaccountsEditor").toggleClass("has", editingSubaccountsOf in deviants.subaccounts);
			$("#subaccountsListHeader").l10n("subaccountsList", editingSubaccountsOf);
			$("#subaccountsListContents").empty();
			if (editingSubaccountsOf in deviants.subaccounts) {
				$("#subaccountsListContents").append(
					deviants.subaccounts[editingSubaccountsOf].map(buildSubaccountLine)
				);
			}
			$("#inputToThisText").l10n("subaccountsAddInputToCurrent", editingSubaccountsOf);
			$("#thisToInputText").l10n("subaccountsAddCurrentToInput", editingSubaccountsOf);
			$("input[value='inputToThis']").prop("checked", true);
			$("#relatedAccount").val("");
			$("#addNotice").hide();
			$("#subaccountsEditor").show();
		} else {
			$("#closeSubaccountsEditor").trigger("click");
		}
	} );
	$("#closeSubaccountsEditor").bind("click", function() {
		$(".subaccountsButton.editing").removeClass("editing");
		$("#subaccountsEditor").hide();
	} );
	$("#addSubaccount").bind("submit", function(event) {
		event.preventDefault();
		var input = $("#relatedAccount").val();
		if (input == "") { return; }
		$("body").css("cursor", "wait");
		$("#addNotice").hide();
		$.when( (function() {
			var lcInput = input.toLowerCase();
			for (var name of deviants.effectiveMap.keys()) {
				if (name.toLowerCase() == lcInput) {
					return name;
				}
			}
			for (var name in deviants.subaccounts) {
				if (name.toLowerCase() == lcInput) {
					return name;
				}
				var found;
				deviants.subaccounts[name].some( function(subaccount) {
					if (subaccount.toLowerCase() == lcInput) {
						found = subaccount;
						return true;
					}
				} );
				if (found) {
					if ($("input[value='thisToInput']").prop("checked")) {
						// We can safely assume "this to input's owner" is acceptable
						return name;
					} else {
						// Assume nothing and let the user decide what's correct
						return $.Deferred().reject("AlreadyOwned", name);
					}
				}
			}
			var request = $.ajax("http://" + lcInput + ".deviantart.com/", {responseType: "text"});
			return request.then( function(profileHtml) {
				// <html> and <head> may be filtered
				var profileElem = $("<div>" + profileHtml + "</div>");
				var verifiedName = profileElem.find("#gmi-Gruser").attr("gmi-name");
				if (!verifiedName) {
					var warn = true;
					verifiedName = input;
				}
				if ($("input[value='thisToInput']").prop("checked")) {
					var newDeviant = new Deviant(verifiedName);
					newDeviant.avatar = profileElem.find("link[rel='image_src']").attr("href");
					deviants.effectiveMap.set(verifiedName, newDeviant);
				}
				if (warn) {
					return { related: input, warning: "CantVerifyCasing", warningPart: input };
				}
				return verifiedName;
			}, function(xhr) {
				if (xhr.status == 404) {
					throw "NotFound";
				}
				throw "Communcation";
			} );
		})() ).then( function(related) {
			if (typeof related == "object") {
				var warning = related.warning, warningPart = related.warningPart;
				related = related.related;
			}
			if ($("input[value='inputToThis']").prop("checked")) {
				var getting = editingSubaccountsOf, gotten = related;
				$("#subaccountsListContents").append( buildSubaccountLine( related ) );
				$("#subaccountsEditor").addClass("has");
			} else {
				var gotten = editingSubaccountsOf, getting = related;
			}
			if (deviants.effectiveMap.has(gotten)) {
				deviantsMod(function() {
					var gettingObj = deviants.effectiveMap.get(getting), gottenObj = deviants.effectiveMap.get(gotten);
					deviants.mergeDeviations(gettingObj, [gottenObj]);
					if (gotten in deviants.subaccounts) {
						for (var subaccount of deviants.subaccounts[gotten]) {
							if ($("input[value='inputToThis']").prop("checked")) {
								$("#subaccountsListContents").append( buildSubaccountLine( subaccount ) );
							}
						}
					}
					if (deviants.baseMap.has(gotten)) {
						deviants.subaccountOwners.set(gottenObj, gettingObj);
					}
					deviants.effectiveMap.delete(gotten);
					editingSubaccountsOf = getting;
				});
			}
			deviants.subaccounts[getting] = (deviants.subaccounts[getting] || [])
				.concat(gotten, (deviants.subaccounts[gotten] || []));
			delete deviants.subaccounts[gotten];
			$("#deviant_" + getting).find(".subaccountsButton").addClass("has");
			adapter.store("subaccounts", deviants.subaccounts);
			if ($("input[value='thisToInput']").prop("checked")) {
				$("#deviant_" + getting).find(".subaccountsButton")
					.removeClass("editing").trigger("click");
			}
			$("#relatedAccount").val("");
			if (warning) {
				$("#addNotice").l10n("subaccountsWarning" + warning, warningPart).show();
			}
		}, function(error, errorPart) {
			$("#addNotice").l10n("subaccountsError" + error, errorPart || input).show();
		} ).always( function() {
			$("body").css("cursor", "");
		} );
	} );
	$("#subaccountsEditor").delegate(".removeSubaccount", "click", function() {
		var removedName = $(this).siblings(".subaccountName").text();
		deviants.subaccounts[editingSubaccountsOf].splice(
			deviants.subaccounts[editingSubaccountsOf].indexOf(removedName), 1);
		$(this).parent().remove();
		if (deviants.subaccounts[editingSubaccountsOf].length == 0) {
			delete deviants.subaccounts[editingSubaccountsOf];
			$("#subaccountsEditor").removeClass("has");
		}
		if (deviants.baseMap.has(removedName)) {
			deviantsMod(function() {
				var removed = deviants.baseMap.get(removedName);
				deviants.subaccountOwners.delete(removed);
				deviants.effectiveMap.set(removedName, removed);
				var target = deviants.effectiveMap.get(editingSubaccountsOf);
				removeDeviations(target, removed.deviations);
				if (target.deviations.length == 0) {
					deviants.effectiveMap.delete(editingSubaccountsOf);
					editingSubaccountsOf = removedName;
				}
			});
			if (deviants.effectiveMap.has(editingSubaccountsOf)) {
				$("#deviant_" + editingSubaccountsOf).find(".subaccountsButton")
					.removeClass("editing").trigger("click");
			}
		}
		adapter.store("subaccounts", deviants.subaccounts);
	} );
	// Helper functions for subaccount event handlers
	function removeDeviations(account, removeMe) {
		account.deviations = account.deviations.filter(function(deviation) {
			return removeMe.indexOf(deviation) == -1;
		});
	}
	function deviantsMod(mod) {
		// mod() may change the value of $("#deviant_" + editingSubaccountsOf), so don't save it
		var keepOpen = $("#deviant_" + editingSubaccountsOf).hasClass("opened");
		mod();
		deviants.buildList();
		$("#artistCount").l10nHtml("scanResultsLastLine",
			'<span class="dynamic">' + Number(deviants.list.length) + '</span>');
		if ($("#mainScreen").hasClass("lookWhatIFound")) {
			normalMode();
		} else {
			$("#lovedArtists").empty().append(snackOnMyWrath(deviants.list));
		}
		if (keepOpen) {
			$("#deviant_" + editingSubaccountsOf).trigger("click", true);
		}
		$("#deviant_" + editingSubaccountsOf).find(".subaccountsButton").addClass("editing");
		$("#deviant_" + editingSubaccountsOf)[0].scrollIntoView();
	}

	// Handle requests for a particular deviant that were made elsewhere (e.g. context menu)
	window.showDeviant = function(deviantName, isFirst) {
		if ($("#mainScreen").hasClass("lookWhatIFound")) {
			normalMode();
		}
		$("#deviant_" + deviantName).trigger("click", isFirst || adapter.displayType == "popup")
			.get(0).scrollIntoView();
	}
	if (ui.firstDeviant) {
		showDeviant(ui.firstDeviant, true);
	}

	// All done, now go play!
	$("body").css("cursor", "");

	function snackOnMyWrath(finkRats) {
		// "You have energy like a little angry battery with no friends."
		var rageDressing = document.createDocumentFragment();
		var elem = document.createElement.bind(document);
		// Chrome 44 is too slow at fetching these message repeatedly
		var subaccountsOpenTooltip = adapter.getL10nMsg("subaccountsOpen");
		var watchingThisArtistTooltip = adapter.getL10nMsg("watchingThisArtist");
		finkRats.forEach( function(deviant) {
			// Hot loop! A little optimization can make a lot of difference.
			var devWatchElem = $(elem("div")).attr("class", "deviationWatch").html("&nbsp;");
			var subaccountsElem = $(elem("div")).attr("class", "subaccountsButton").html("&nbsp;")
				.attr("title", subaccountsOpenTooltip);
			var lineElem = $(elem("div")).attr("class", "deviantLine").append(
				devWatchElem,
				$(elem("span")).attr("class", "deviantFaves").text(deviant.deviations.length),
				$(elem("span")).attr("class", "deviantName").text(deviant.name),
				subaccountsElem
			);
			var deviantElem = $(elem("div")).attr({"class": "deviant", id: "deviant_" + deviant.name})
				.append(lineElem);
			if (watchedArtists instanceof Set && watchedArtists.has(deviant.name)) {
				devWatchElem.addClass("true").attr("title", watchingThisArtistTooltip);
			}
			if (deviant.name in deviants.subaccounts) {
				subaccountsElem.addClass("has");
			}
			rageDressing.appendChild(deviantElem[0]);
		} );
		return rageDressing; // on a salad of evil
	}
	function buildCloserLook(deviant, deviations) {
		var closerLook = $("<div>", {"class": "closerLook"}).css("overflow", "hidden");

		var deviantDetails = $("<div>", {"class": "deviantDetails"});
		var deviantAvatar = $("<img>", {width: 50, height: 50})
			.bind("load", function() { this.parentNode.classList.remove("loading"); } );
		deviantDetails.append( $("<a>", {"href": deviant.baseURL, "class": "avatar loading"})
			.append(deviantAvatar) );
		if (deviant.avatar) {
			deviantAvatar.attr("src", deviant.avatar);
		} else {
			$.ajax(deviant.baseURL, {responseType: "text"}).then( function(profileHtml) {
				// <html> and <head> may be filtered
				var avatarElem = $("<div>" + profileHtml + "</div>").find("link[rel='image_src']");
				if (avatarElem.length == 0) { return $.Deferred().reject(); }
				deviant.avatar = avatarElem.attr("href");
				deviantAvatar.attr("src", deviant.avatar);
			} ).fail( function() {
				deviantAvatar.parent().removeClass("loading");
			} );
		}
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
	function buildSubaccountLine(accountName) {
		var line = $("<div>", {"class": "subaccount"});

		var baseURL = "http://" + accountName.toLowerCase() + ".deviantart.com/";
		line.append($("<a>", {"href": baseURL, "class": "profileLink"})
			.l10nTooltip("profile"));
		line.append($("<a>", {"href": baseURL + "gallery/", "class": "galleryLink"})
			.l10nTooltip("gallery"));
		line.append($("<span>", {"class": "subaccountName"}).text(accountName));
		line.append($("<button>", {"class": "removeSubaccount"}).l10n("subaccountsRemove"));

		return line;
	}
	function normalMode() {
		$("#mainScreen").removeClass("lookWhatIFound");
		$("#lovedArtists").removeClass("noResults").empty()
			.append(normalModePrefix).append(snackOnMyWrath(deviants.list));
	}
}

function getAllUserPrefs() {
	return adapter.retrieve("subaccounts").then( function(data) {
		data.subaccounts = data.subaccounts || {};
		return data;
	} );
}
function nextTip() {
	return Promise.all(
		[adapter.retrieve("nextTip"), $.getJSON( adapter.getL10nFile("TipOfTheMoment.json") )]
	).then(function(results) {
		var nextTip = results[0].nextTip || 0, tips = results[1];
		var returnValue = tips[nextTip];
		nextTip++;
		if (nextTip >= tips.length) {nextTip = 0;};
		adapter.store("nextTip", nextTip);
		return returnValue;
	});
}
function tipOfTheMoment(tip) {
	$("#tOTMIcon").attr("src", "/images/" + tip.icon);
	$("#tOTMText").html(tip.html);
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