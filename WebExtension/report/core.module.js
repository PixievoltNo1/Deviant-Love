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
import { setUpStoreL10nCache } from "./l10nCache.module.js";
import { adapter } from "./environment.module.js";
export { beginPreparations, tipOfTheMoment };
import PreparationScreen from "./svelte/PreparationScreen.html";
import MainScreen from "./svelte/MainScreen.html";
import DeviantList from "./svelte/DeviantList.html";
import FindModeContent from "./svelte/FindModeContent.html";

export var store = new Store({
	l10n: adapter.getL10nMsg,
	visible: true,
});
var prefsLoaded = storePersist(store);
setUpStoreL10nCache(store);

function Deviant(name) {
	this.name = name;
	this.deviations = [];
}
Object.defineProperties(Deviant.prototype, {
	baseURL: {
		get: function() {
			return this.baseURL = `https://www.deviantart.com/${ this.name.toLowerCase() }/`;
		}, set: function(val) {
			Object.defineProperty(this, "baseURL", {value: val, enumerable: true})
		}
	}
});
function beginPreparations(love) {
	var screen = new PreparationScreen({
		target: document.body,
		store,
		data: {
			pageType: love.pageType,
			maxDeviations: love.maxDeviations,
		}
	});
	var scannerController = researchLove(love.feedHref, love.maxDeviations);
	scannerController.progress.add((data) => { screen.set(data); });
	var faves = scannerController.faves.catch( function catcher(thrown) {
		scanError();
		return thrown.retryResult.catch(catcher);
	} );
	var organized = faves.then(organizeData);
	var watchResult = scannerController.watched.then(collectWatchlist, watchError);
	Promise.all([organized, watchResult, nextTip(), prefsLoaded]).then(finish);
	var visibilityListener = store.on("state", ({changed, current}) => {
		if (changed.visible) {
			scannerController[current.visible ? "resume" : "pause"]();
		}
	});
	screen.on("destroy", () => { visibilityListener.cancel(); });
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
	var firstDeviant;
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
	function finish([organizedFaves, {watchedArtists = null, watchError = false}]) {
		let results = {
			deviants: new DeviantCollection(organizedFaves.deviantMap, Deviant),
			totalDeviations: organizedFaves.totalDeviations,
			watchedArtists,
			watchError,
		};
		adapter.prepComplete(results);
		screen.destroy();
		var ui = {firstDeviant};
		report(results, ui, love);
	}
}
function restore(scanData, love) {
	var firstDeviant;
	window.showDeviant = function(deviantName) {
		firstDeviant = deviantName;
	};
	scanData.deviants = new DeviantCollection(scanData.deviants);
	Promise.all([nextTip(), prefsLoaded]).then(function() {
		var ui = {firstDeviant: firstDeviant};
		report(scanData, ui, love);
	});
}
function report(results, ui, love) {
	var {deviants, totalDeviations, watchedArtists, watchError} = results;
	deviants.setSubaccounts(store.get().subaccounts);

	// Construct the UI
	var screen = new MainScreen({
		target: document.body,
		store,
		data: {
			deviantList: deviants.list, watchedArtists, watchError
		}
	});
	var scanResults = $("#scanResults");
	var scanResultsLine1 = ({
		featured: "scanResultsFeaturedLine1",
		allFaves: "scanResultsAllLine1",
		collection: "scanResultsCollectionLine1",
		search: "scanResultsSearchLine1"
	})[love.pageType];
	scanResults.append($("<div>").l10nHtml(scanResultsLine1,
		'<span class="dynamic">' + Number(totalDeviations) + '</span>')); // The Number call is there to help out AMO reviewers; same for the other calls below
	scanResults.append($("<div>", {id: "artistCount"}).l10nHtml("scanResultsLastLine",
		'<span class="dynamic">' + Number(deviants.list.length) + '</span>'));
	$("<form>", {id: "findBar", "class": "textEntryLine"})
		.append($("<input>", {type: "text", id: "query"}))
		.append($("<button>", {type: "submit", id: "goFind"}))
		.append($("<button>", {type: "button", id: "noFind"}))
		.insertAfter(scanResults);
	$("#query").l10nPlaceholder("queryPlaceholder");
	$("<div>", {id: "queryError"}).hide().insertAfter("#findBar");
	normalMode();

	// Set up interaction
	$("#lovedArtists").delegate(".deviant", "touchstart", function() {
		this.classList.add("touched");
	}).delegate(".deviant", "touchend", function(touchEvent) {
		$(this).unbind(".switchToMouse").bind("mouseenter.switchToMouse", function(mouseEvent) {
			if (touchEvent.timeStamp - 200 < mouseEvent.timeStamp) { return; }
			$(this).removeClass("touched").unbind(".switchToMouse");
		});
	});
	$("#query").bind("input", function(event) {
		var checkResult = queryTroubleCheck(this.value);
		if (typeof checkResult == "object") {
			$("#queryError").l10n(checkResult.errMsg, checkResult.offender).show();
		} else {
			$("#queryError").hide();
		}
	} );
	var findComponent;
	$("#findBar").bind("submit", function(event) {
		event.preventDefault();
		var query = $("#query").val();
		if (query == "") { return; }
		if (queryTroubleCheck(query)) { return; }

		var queryResults = findStuff(query, deviants);

		screen.set({mode: "find"});
		if (!findComponent) {
			findComponent = new FindModeContent({
				target: document.getElementById("lovedArtists"),
				data: {queryResults},
				store,
			})
		} else {
			findComponent.set({queryResults});
		}
		findComponent.set({showAmpersandHint: query.indexOf(" ") != -1 && query.indexOf("&") == -1});
	});
	$("#noFind").bind("click", normalMode);
	$("#mainScreen").delegate(".addSubaccount", "submit", function(event) {
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
				var getting = store.get().editingSubaccountsOf, gotten = related;
			} else {
				var gotten = store.get().editingSubaccountsOf, getting = related;
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
		var oldOwner = store.get().editingSubaccountsOf;
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
		// mod() may change the value of $("#deviant_" + store.get().editingSubaccountsOf), so don't save it
		var keepOpen = $("#deviant_" + store.get().editingSubaccountsOf).hasClass("opened");
		mod();
		deviants.buildList();
		$("#artistCount").l10nHtml("scanResultsLastLine",
			'<span class="dynamic">' + Number(deviants.list.length) + '</span>');
		screen.set({deviantList: deviants.list});
		normalMode();
		if (keepOpen) {
			screen.refs.normalList.showDeviant(store.get().editingSubaccountsOf);
		}
		$("#deviant_" + store.get().editingSubaccountsOf)[0].scrollIntoView();
	}

	// Handle requests for a particular deviant that were made elsewhere (e.g. context menu)
	window.showDeviant = function(deviantName) {
		normalMode();
		screen.refs.normalList.showDeviant(deviantName);
	}
	if (ui.firstDeviant) {
		showDeviant(ui.firstDeviant);
	}

	function normalMode() {
		if (findComponent) {
			findComponent.destroy();
			findComponent = null;
		}
		screen.set({mode: "normal"});
	}
}

export function nextTip() {
	return Promise.all(
		[adapter.retrieve("nextTip"), $.getJSON( adapter.getL10nFile("TipOfTheMoment.json") )]
	).then(function(results) {
		var nextTip = results[0].nextTip || 0, tips = results[1];
		store.set({tip: tips[nextTip]});
		nextTip++;
		if (nextTip >= tips.length) {nextTip = 0;};
		adapter.store("nextTip", nextTip);
	});
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