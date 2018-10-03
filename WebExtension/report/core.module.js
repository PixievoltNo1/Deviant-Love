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
import * as env from "./environment.module.js";
export { beginPreparations };
import PreparationScreen from "./svelte/PreparationScreen.html";
import MainScreen from "./svelte/MainScreen.html";
export var initMiniSubaccountsEditor;
import lookUpDeviant from "./lookUpDeviant.module.js";
import "fluent-intl-polyfill";
import { FluentBundle } from "fluent";

export var store = new Store({
	l10n: () => "",
	visible: true,
});
var prefsLoaded = storePersist(store);
fetch( env.getL10nMsg("fileFluent") )
	.then( (response) => { return response.text(); } )
	.then( (ftl) => {
		var bundle = new FluentBundle('en-US');
		var errors = bundle.addMessages(ftl);
		logAll(errors);
		store.set({ l10n(msg, args) {
			var errors = [];
			var text = bundle.format( bundle.getMessage(msg), args, errors );
			logAll(errors);
			return text;
		} });
	});
function logAll(arr) {
	for (let part of arr) {
		console.log(part);
	}
}

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
	// TODO: Wake scanData.deviants
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
			deviantList: deviants.list, watchedArtists, watchError, mode: "normal"
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

	screen.on("state", ({changed, previous}) => {
		if (changed.mode && previous.mode == "options") {
			deviants.setSubaccounts(store.get().subaccounts);
			deviants.buildList();
			$("#artistCount").l10nHtml("scanResultsLastLine",
				'<span class="dynamic">' + Number(deviants.list.length) + '</span>');
			screen.set({deviantList: deviants.list});
		}
	});
	screen.on("update", ({changed, current}) => {
		if (changed.mode && current.mode == "find") {
			var {findModeContent} = screen.refs;
			findModeContent.on("viewDeviant", showDeviant);
			findModeContent.on("state", ({changed, current, previous}) => {
				if (changed.input) {
					if (current.input == "") {
						findModeContent.set({queryError: false});
					} else {
						findModeContent.set( {queryError: queryTroubleCheck(current.input)} );
					}
				}
				if (changed.submitted) {
					var queryResults = findStuff(current.submitted, deviants);
					// TODO: Once findModeContent can react to subaccounts changes, set this on screen instead
					findModeContent.set({queryResults});
				}
			});
		}
	});
	initMiniSubaccountsEditor = (editor) => {
		var {owner} = editor.get();
		var owned = store.get().subaccounts[owner] || [];
		editor.set({ accounts: owned.map( (accountName) => {
			return deviants.baseMap.get(accountName) || new Deviant(accountName);
		} ) });
	};
	/*
	$("#mainScreen").delegate(".addSubaccount", "submit", function(event) {
		event.preventDefault();
		var {subaccounts} = store.get();
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
			for (var name in subaccounts) {
				if (name.toLowerCase() == lcInput) {
					return name;
				}
				var found;
				subaccounts[name].some( function(subaccount) {
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
			return lookUpDeviant(lcInput).then((results) => {
				var verifiedName = results.name;
				if (!verifiedName) {
					var warn = true;
					verifiedName = input;
				}
				if ($("input[value='thisToInput']").prop("checked")) {
					var newDeviant = new Deviant(verifiedName);
					newDeviant.avatar = results.avatar;
					deviants.effectiveMap.set(verifiedName, newDeviant);
				}
				if (warn) {
					return { related: input, warning: "CantVerifyCasing", warningPart: input };
				}
				return verifiedName;
			});
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
			subaccounts[getting] = (subaccounts[getting] || [])
				.concat( gotten, (subaccounts[gotten] || []) );
			delete subaccounts[gotten];
			if (deviants.effectiveMap.has(gotten)) {
				deviantsMod(function() {
					deviants.setSubaccounts(subaccounts);
					store.set({editingSubaccountsOf: getting});
				});
			}
			store.set({subaccounts});
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
		var {subaccounts, editingSubaccountsOf} = store.get();
		subaccounts[editingSubaccountsOf].splice(
			subaccounts[editingSubaccountsOf].indexOf(removedName), 1);
		if (subaccounts[editingSubaccountsOf].length == 0) {
			delete subaccounts[editingSubaccountsOf];
		}
		if (deviants.baseMap.has(removedName)) {
			deviantsMod( () => { deviants.setSubaccounts(subaccounts); } );
		}
		store.set({subaccounts});
	} );
	*/
	// Helper function for subaccount event handlers
	function deviantsMod(mod) {
		// mod() may change the value of $("#deviant_" + store.get().editingSubaccountsOf), so don't save it
		var keepOpen = $("#deviant_" + store.get().editingSubaccountsOf).hasClass("opened");
		mod();
		$("#artistCount").l10nHtml("scanResultsLastLine",
			'<span class="dynamic">' + Number(deviants.list.length) + '</span>');
		screen.set({mode: "normal", deviantList: deviants.list});
		if (keepOpen) {
			screen.refs.normalList.showDeviant(store.get().editingSubaccountsOf);
		}
		$("#deviant_" + store.get().editingSubaccountsOf)[0].scrollIntoView();
	}

	// Handle requests for a particular deviant that were made elsewhere (e.g. context menu)
	window.showDeviant = function(deviantName) {
		screen.set({mode: "normal"});
		screen.refs.normalList.showDeviant(deviantName);
	}
	if (ui.firstDeviant) {
		showDeviant(ui.firstDeviant);
	}

	store.on("beforeShow", (delay) => {
		delay( nextTip() );
	});
}

document.body.addEventListener("touchstart", () => {
	store.set({usingTouch: true});
}, {passive: true});
document.body.addEventListener("touchend", function prepareForSwitchToMouse(touchEvent) {
	document.body.addEventListener("mousemove", function switchToMouse(mouseEvent) {
		if (touchEvent.timeStamp - 200 < mouseEvent.timeStamp) { return; }
		store.set({usingTouch: false});
		document.body.removeEventListener("mousemove", switchToMouse);
		document.body.addEventListener("touchend", prepareForSwitchToMouse,
			{passive: true, once: true});
	});
}, {passive: true, once: true});
function nextTip() {
	return Promise.all(
		[env.retrieve("nextTip"), $.getJSON( env.getL10nMsg("fileTipOfTheMoment") )]
	).then(function(results) {
		var nextTip = results[0].nextTip || 0, tips = results[1];
		store.set({tip: tips[nextTip]});
		nextTip++;
		if (nextTip >= tips.length) {nextTip = 0;};
		env.store("nextTip", nextTip);
	});
}
function makeL10nMethod(methodName, effect) {
	$.fn[methodName] = function(msgName) {
		var replacements = $.makeArray(arguments).slice(1);
		if (replacements.length == 0) {replacements = undefined};
		// This data will be needed when the user will be able to change the language at runtime
		// this.attr("data-l10n", msgName).data("l10nMethod", methodName);
		effect.call(this, env.getL10nMsg(msgName, replacements));
		return this;
	}
}
[
	["l10n", $.fn.text],
	["l10nHtml", $.fn.html],
	["l10nTooltip", function(msg) {this.attr("title", msg);}],
	["l10nPlaceholder", function(msg) {this.attr("placeholder", msg);}]
].forEach(function(args) {makeL10nMethod.apply(null, args);});