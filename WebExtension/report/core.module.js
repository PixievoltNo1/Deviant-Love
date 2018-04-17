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
import { Store } from "svelte/store";
import storePersist from "../storePersist.module.js";
import { setUpStoreL10nCache } from "./l10nCache.js";
import { adapter } from "./environment.module.js";
export { beginPreparations, tipOfTheMoment };
import PreparationScreen from "./svelte/PreparationScreen.html";
import MiniSubaccountsEditor from "./svelte/MiniSubaccountsEditor.html";
import DeviantList from "./svelte/DeviantList.html";

var store = new Store({
	l10n: adapter.getL10nMsg,
});
var prefsLoaded = storePersist(store);
setUpStoreL10nCache(store);
var templateContents = {};
for (let elem of Array.from( document.getElementsByTagName("template") )) {
	fillL10n(elem.content);
	templateContents[elem.id] = document.importNode(elem.content, true);
}

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

	var screen = new PreparationScreen({
		target: document.body,
		store,
		data: {
			pageType: love.pageType,
			maxDeviations: love.maxDeviations,
		}
	});
	window.startScan = function() {
		scannerController = researchLove(love.feedHref, love.maxDeviations);
		scannerController.progress.add((data) => { screen.set(data); });
		var faves = scannerController.faves.catch( function catcher(thrown) {
			scanError();
			return thrown.retryResult.catch(catcher);
		} );
		var organized = faves.then(organizeData);
		var watchResult = scannerController.watched.then(collectWatchlist, watchError);
		Promise.all([organized, watchResult, nextTip(), prefsLoaded]).then(finish);
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
	function scanError() {
		scannerController.pause();
		screen.set({errored: true, stopped: true});
	}
	screen.on("retry", () => {
		screen.set({errored: false, stopped: false});
		scannerController.resume();
		scannerController.retry();
	});
	window.showDeviant = function(deviantName) {
		firstDeviant = deviantName;
	}
	function collectWatchlist(list) {
		screen.set({watchStatus: "watchSuccess"});
		return {watchedArtists: list};
	}
	function watchError(thrown) {
		if (thrown.reason == "netError") {
			scanError();
			return thrown.retryResult.then(collectWatchlist, watchError);
		}
		screen.set( {watchStatus: (thrown.reason == "notLoggedIn") ?
			"watchErrorNotLoggedIn" : "watchErrorInternal"} );
		return {watchError: thrown.reason};
	}
	function finish([organizedFaves, {watchedArtists = null, watchError = false}, firstTip]) {
		let results = {
			deviants: new DeviantCollection(organizedFaves.deviantMap, Deviant),
			totalDeviations: organizedFaves.totalDeviations,
			watchedArtists,
			watchError,
		};
		adapter.prepComplete(results);
		screen.destroy();
		var ui = {firstTip, firstDeviant};
		report(results, ui, love);
	}
}
function restore(scanData, love) {
	var firstDeviant;
	window.showDeviant = function(deviantName) {
		firstDeviant = deviantName;
	};
	scanData.deviants = new DeviantCollection(scanData.deviants);
	Promise.all([nextTip(), prefsLoaded]).then(function([tip]) {
		var ui = {firstTip: tip, firstDeviant: firstDeviant};
		report(scanData, ui, love);
	});
}
function report(results, ui, love) {
	var {deviants, totalDeviations, watchedArtists, watchError} = results;
	deviants.setSubaccounts(store.get("subaccounts"));
	var deviantsComponent;

	// Construct the UI
	var mainScreen = $("<div>", {id: "mainScreen"});
	mainScreen.appendTo(document.body);
	var scanResults = $("<div>", {id: "scanResults"});
	var scanResultsLine1 = ({
		featured: "scanResultsFeaturedLine1",
		allFaves: "scanResultsAllLine1",
		collection: "scanResultsCollectionLine1",
		search: "scanResultsSearchLine1"
	})[love.pageType];
	scanResults.append($("<div>").l10nHtml(scanResultsLine1,
		'<span class="dynamic">' + Number(totalDeviations) + '</span>')); // The Number call is there to help out AMO reviewers; same for the other calls below
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
	if (watchError) {
		normalModePrefix = $("<div>", {id: "watchFailure", "class": "notice"})
			.l10n( (watchError == "notLoggedIn") ? "watchErrorNotLoggedIn" : "watchErrorInternal" );
	}
	var lovedArtists = $("<div>", {id: "lovedArtists"})
		.css({"overflow-y": "auto", "overflow-x": "hidden"})
		.appendTo(mainScreen);
	normalMode();
	if (lovedArtists.css("position") == "static") { lovedArtists.css("position", "relative") } // Needed for scrollToDeviationList. It's as weird as it to ensure future compatibility with the skinning feature.
	$("<div>", {id: "tipOfTheMoment"})
		.append($("<img>", {id: "tOTMIcon"}))
		.append($("<div>", {id: "tOTMText"}))
		.appendTo(mainScreen);
	tipOfTheMoment(ui.firstTip);

	// Set up interaction
	lovedArtists.delegate(".deviant", "touchstart", function() {
		this.classList.add("touched");
	}).delegate(".deviant", "touchend", function(touchEvent) {
		$(this).unbind(".switchToMouse").bind("mouseenter.switchToMouse", function(mouseEvent) {
			if (touchEvent.timeStamp - 200 < mouseEvent.timeStamp) { return; }
			$(this).removeClass("touched").unbind(".switchToMouse");
		});
	}).delegate(".deviant:not(.opened)", "click", function(event, suppressAnimation) {
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
		var closerLook = buildCloserLook(deviant, deviant.deviations, this.classList.contains("touched"));
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
		deviantsComponent.destroy();
		var lovedArtists = $("#lovedArtists").empty().removeClass("noResults");
		if (deviantMatches.length == 0 && deviationMatches.length == 0) {
			lovedArtists.l10n("foundNothing").addClass("noResults");
		}
		if (deviantMatches.length > 0) {
			lovedArtists.append( $("<div>", {"class": "sectionHeader"})
				.l10n("foundDeviants", deviantMatches.length) );
			deviantsComponent = new DeviantList({
				target: document.getElementById("lovedArtists"),
				data: { deviants: deviantMatches, watchedArtists },
				store
			});
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
	var miniSubaccountsEditor;
	$("#lovedArtists").delegate(".subaccountsButton", "click", function(event) {
		var deviant = $(this).closest(".deviant");
		var button = deviant.find(".subaccountsButton.line");
		if (!button.hasClass("editing")) {
			store.set({editingSubaccountsOf: deviant.find(".deviantName").text()})
			if (!miniSubaccountsEditor) {
				var insertMe = document.createDocumentFragment();
				miniSubaccountsEditor = new MiniSubaccountsEditor({
					target: insertMe,
					store
				});
				$("#lovedArtists").after(insertMe);
			}
		} else {
			$(".closeSubaccountsEditor").trigger("click");
		}
	} );
	mainScreen.delegate(".closeSubaccountsEditor", "click", function() {
		miniSubaccountsEditor.destroy();
		miniSubaccountsEditor = null;
		store.set({editingSubaccountsOf: null});
	} ).delegate(".addSubaccount", "submit", function(event) {
		event.preventDefault();
		var input = $(".relatedAccount").val();
		if (input == "") { return; }
		$("body").css("cursor", "wait");
		$(".addNotice").hide();
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
				var getting = store.get("editingSubaccountsOf"), gotten = related;
			} else {
				var gotten = store.get("editingSubaccountsOf"), getting = related;
			}
			if (deviants.effectiveMap.has(gotten)) {
				deviantsMod(function() {
					var gettingObj = deviants.effectiveMap.get(getting), gottenObj = deviants.effectiveMap.get(gotten);
					deviants.mergeDeviations(gettingObj, [gottenObj]);
					if (deviants.baseMap.has(gotten)) {
						deviants.subaccountOwners.set(gottenObj, gettingObj);
					}
					deviants.effectiveMap.delete(gotten);
					store.set({editingSubaccountsOf: getting});
				});
			}
			deviants.subaccounts[getting] = (deviants.subaccounts[getting] || [])
				.concat(gotten, (deviants.subaccounts[gotten] || []));
			delete deviants.subaccounts[gotten];
			store.set({subaccounts: deviants.subaccounts});
			$(".relatedAccount").val("");
			if (warning) {
				$(".addNotice").l10n("subaccountsWarning" + warning, warningPart).show();
			}
		}, function(error, errorPart) {
			$(".addNotice").l10n("subaccountsError" + error, errorPart || input).show();
		} ).always( function() {
			$("body").css("cursor", "");
		} );
	} ).delegate(".removeSubaccount", "click", function() {
		var removedName = $(this).siblings(".subaccountName").text();
		var oldOwner = store.get("editingSubaccountsOf");
		deviants.subaccounts[oldOwner].splice(
			deviants.subaccounts[oldOwner].indexOf(removedName), 1);
		if (deviants.subaccounts[oldOwner].length == 0) {
			delete deviants.subaccounts[oldOwner];
		}
		if (deviants.baseMap.has(removedName)) {
			deviantsMod(function() {
				var removed = deviants.baseMap.get(removedName);
				deviants.subaccountOwners.delete(removed);
				deviants.effectiveMap.set(removedName, removed);
				var target = deviants.effectiveMap.get(oldOwner);
				removeDeviations(target, removed.deviations);
				if (target.deviations.length == 0) {
					deviants.effectiveMap.delete(oldOwner);
					store.set({editingSubaccountsOf: removedName});
				}
			});
		}
		store.set({subaccounts: deviants.subaccounts});
	} );
	// Helper functions for subaccount event handlers
	function removeDeviations(account, removeMe) {
		account.deviations = account.deviations.filter(function(deviation) {
			return removeMe.indexOf(deviation) == -1;
		});
	}
	function deviantsMod(mod) {
		// mod() may change the value of $("#deviant_" + store.get("editingSubaccountsOf")), so don't save it
		var keepOpen = $("#deviant_" + store.get("editingSubaccountsOf")).hasClass("opened");
		mod();
		deviants.buildList();
		$("#artistCount").l10nHtml("scanResultsLastLine",
			'<span class="dynamic">' + Number(deviants.list.length) + '</span>');
		if ($("#mainScreen").hasClass("lookWhatIFound")) {
			normalMode();
		} else {
			deviantsComponent.set({deviants: deviants.list});
		}
		if (keepOpen) {
			$("#deviant_" + store.get("editingSubaccountsOf"))
				.removeClass("opened").find(".closerLook").remove();
			$("#deviant_" + store.get("editingSubaccountsOf")).trigger("click", true);
		}
		$("#deviant_" + store.get("editingSubaccountsOf"))[0].scrollIntoView();
	}

	// Handle requests for a particular deviant that were made elsewhere (e.g. context menu)
	window.showDeviant = function(deviantName, isFirst) {
		if ($("#mainScreen").hasClass("lookWhatIFound")) {
			normalMode();
		}
		$("#deviant_" + deviantName).trigger("click", isFirst)
			.get(0).scrollIntoView();
	}
	if (ui.firstDeviant) {
		showDeviant(ui.firstDeviant, true);
	}

	function buildCloserLook(deviant, deviations, forTouchscreen) {
		var closerLook = $(templateContents["closerLook"]).children().clone();

		var deviantDetails = closerLook.find(".deviantDetails");
		var deviantAvatar = $("<img>", {width: 50, height: 50})
			.bind("load", function() { this.parentNode.classList.remove("loading"); } );
		deviantDetails.find(".avatar").attr("href", deviant.baseURL).append(deviantAvatar);
		if (deviant.avatar) {
			deviantAvatar.attr("src", deviant.avatar);
		} else {
			$.ajax(deviant.baseURL, {responseType: "text"}).then( function(profileHTML) {
				var profileDoc = (new DOMParser()).parseFromString(profileHTML, "text/html");
				var avatarElem = profileDoc.querySelector("link[rel='image_src']");
				if (avatarElem == null) { throw false; }
				deviant.avatar = avatarElem.getAttribute("href");
				deviantAvatar.attr("src", deviant.avatar);
			} ).fail( function() {
				deviantAvatar.parent().removeClass("loading");
			} );
		}
		if (!forTouchscreen) {
			closerLook.addClass("mouse").find(".touch").remove();
		} else {
			closerLook.addClass("touch").find(".mouse").remove();
		}
		closerLook.find(".profileLink").attr("href", deviant.baseURL);
		closerLook.find(".galleryLink").attr("href", deviant.baseURL + "gallery/");
		closerLook.find(".favouritesLink").attr("href", deviant.baseURL + "favourites/");

		var deviationList = closerLook.find(".deviationList");
		deviations.forEach( function(deviation) {
			$("<div>", {"class": "deviation"})
				.append($("<a>", {href: deviation.URL}).text(deviation.name))
				.appendTo(deviationList)
		} );

		return closerLook;
	}
	function normalMode() {
		$("#mainScreen").removeClass("lookWhatIFound");
		$("#lovedArtists").removeClass("noResults").empty().append(normalModePrefix);
		deviantsComponent = new DeviantList({
			target: document.getElementById("lovedArtists"),
			data: { deviants: deviants.list, watchedArtists },
			store
		});
	}
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