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
export var showDeviant;
import PreparationScreen from "./svelte/PreparationScreen.html";
import MainScreen from "./svelte/MainScreen.html";
export var initMiniSubaccountsEditor;
import lookUpDeviant from "./lookUpDeviant.module.js";
import "fluent-intl-polyfill";
import { FluentBundle } from "fluent";

export var store;
export async function start({love, restoreData, firstDeviant, mobile}) {
	store = new Store({
		visible: true,
		mobile,
	});
	await storePersist(store);
	let response = await fetch( env.getL10nMsg("fileFluent") );
	let ftl = await response.text();
	var bundle = new FluentBundle('en-US');
	var errors = bundle.addMessages(ftl);
	logAll(errors);
	store.set({ l10n(msg, args) {
		var errors = [];
		var text = bundle.format( bundle.getMessage(msg), args, errors );
		logAll(errors);
		return text;
	} });
	if (restoreData) {
		restore(restoreData, love);
	} else {
		prepare(love);
	}
	if (firstDeviant) {
		showDeviant(firstDeviant);
	}
}
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
function prepare(love) {
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
	Promise.all([organized, watchResult, nextTip()]).then(finish);
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
	showDeviant = function(deviantName) {
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
	showDeviant = function(deviantName) {
		firstDeviant = deviantName;
	};
	// TODO: Wake scanData.deviants
	Promise.all([nextTip()]).then(function() {
		var ui = {firstDeviant: firstDeviant};
		report(scanData, ui, love);
	});
}
function report(results, ui, love) {
	var {deviants, totalDeviations, watchedArtists, watchError} = results;
	deviants.setSubaccounts(store.get().subaccounts);
	var knownNames = [...deviants.baseMap.keys()];

	var screen = new MainScreen({
		target: document.body,
		store,
		data: {
			deviantList: deviants.list, totalDeviations, watchedArtists, watchError, knownNames,
			pageType: love.pageType, mode: "normal"
		}
	});
	screen.on("state", ({changed, previous}) => {
		if (changed.mode && previous.mode == "options") {
			deviants.setSubaccounts(store.get().subaccounts);
			deviants.buildList();
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
	screen.on("closeRequested", env.closeDeviantLove);
	initMiniSubaccountsEditor = (editor) => {
		var {owner} = editor.get();
		var {subaccounts} = store.get();
		function setAccounts() {
			var owned = subaccounts[owner] || [];
			editor.set({ accounts: owned.map( (accountName) => {
				return deviants.baseMap.get(accountName) || new Deviant(accountName);
			} ) });
		}
		setAccounts();
		editor.set({knownNames});
		editor.on("edited", () => {
			setAccounts();
			deviants.setSubaccounts(subaccounts);
			screen.set({deviantList: deviants.list});
		});
	};
	store.on("update", ({changed}) => {
		if (changed.subaccounts && screen.get().mode == "find") {
			screen.set({mode: "normal"});
			screen.refs.normalList.showDeviant(owner);
			screen.refs.normalList.get().registry.get(owner).set({subaccountsOpen: true});
			document.getElementById("deviant_" + owner).scrollIntoView();
		}
	});

	// Handle requests for a particular deviant that were made elsewhere (e.g. context menu)
	showDeviant = function(deviantName) {
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