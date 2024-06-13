/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1

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
import { get as readStore } from "svelte/store";
import { tick } from "svelte";
import * as prefs from "../prefStores.src.mjs";
import * as env from "./environment.src.mjs";
import researchLove from "./scanner.src.mjs";
import DeviantCollection from "./deviantCollection.src.mjs";
import PreparationScreen from "./svelte/PreparationScreen.svelte";
import MainScreen from "./svelte/MainScreen.svelte";
import * as subaccountsEditorSettings from "../options/subaccountsEditorCore.src.mjs";
import { init as initL10n, default as l10nStore } from "../l10nStore.src.mjs";
import { nextTip } from "./svelte/TipOfTheMoment.svelte";
import { findResults } from "./svelte/FindModeContent.svelte";

export async function start({love, restoreData}) {
	let firstDeviant;
	let removeListener = env.events.on("artistRequested", (artist) => firstDeviant = artist);
	await prefs.ready;
	await initL10n();
	(async () => {
		var [results] = await Promise.all([
			restoreData ? restore(restoreData, love) : prepare(love),
			nextTip(),
		]);
		removeListener();
		report(results, love);
		if (firstDeviant) {
			env.events.emit("artistRequested", firstDeviant);
		}
	})();
}
export async function showDetectError(error) {
	await initL10n();
	let errorElem = document.body.appendChild( document.createElement("div") );
	errorElem.id = "preparationScreen";
	errorElem.innerHTML = readStore(l10nStore)("detectError" + error);
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
	var cleanup = new Set();
	var scannerController = researchLove(love.feedHref, love.maxDeviations);
	var screen = new PreparationScreen({
		target: document.body,
		props: {
			pageType: love.pageType,
			maxDeviations: love.maxDeviations,
			progress: scannerController.progress,
		}
	});
	cleanup.add( () => screen.$destroy() );
	var faves = scannerController.faves.catch( function catcher(thrown) {
		scanError();
		return thrown.retryResult.catch(catcher);
	} );
	var organized = faves.then(organizeData);
	var watchResult = scannerController.watched.then(collectWatchlist, watchError);
	cleanup.add( env.events.on("hide", () => scannerController.pause()) );
	cleanup.add( env.events.on("show", () => scannerController.resume()) );
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
		screen.$set({errored: true, stopped: true});
	}
	screen.$on("retry", () => {
		screen.$set({errored: false, stopped: false});
		scannerController.resume();
		scannerController.retry();
	});
	function collectWatchlist(list) {
		screen.$set({watchStatus: "watchSuccess"});
		return {watchedArtists: list};
	}
	function watchError(thrown) {
		if (thrown.reason == "netError") {
			scanError();
			return thrown.retryResult.then(collectWatchlist, watchError);
		}
		screen.$set( {watchStatus: (thrown.reason == "notLoggedIn") ?
			"watchErrorNotLoggedIn" : "watchErrorInternal"} );
		return {watchError: thrown.reason};
	}
	return Promise.all([organized, watchResult]).then(finish);
	function finish([organizedFaves, {watchedArtists = null, watchError = false}]) {
		let results = {
			deviants: new DeviantCollection(organizedFaves.deviantMap, Deviant),
			totalDeviations: organizedFaves.totalDeviations,
			watchedArtists,
			watchError,
		};
		for (let fn of cleanup) { fn(); }
		return results;
	}
}
function restore(scanData, love) {
	// TODO: Wake scanData.deviants
	return scanData;
}
export var submitFindQuery, miniSubaccountsEditorHelper;
function report(results, love) {
	var {deviants, totalDeviations, watchedArtists, watchError} = results;
	deviants.setSubaccounts( readStore(prefs.stores.subaccounts) );
	subaccountsEditorSettings.setKnownNames([...deviants.baseMap.keys()]);

	var screen = new MainScreen({
		target: document.body,
		props: {
			deviantList: deviants.list, totalDeviations, watchedArtists, watchError,
			pageType: love.pageType,
		}
	});

	// Handle requests for a particular deviant that were made elsewhere (e.g. context menu)
	env.events.on("artistRequested", function(deviantName) {
		if (!deviants.effectiveMap.has(deviantName)) {
			if (deviants.ownerships.has(deviantName)) {
				deviantName = deviants.ownerships.get(deviantName).name;
			} else {
				// TODO: Handle this error condition
			}
		}
		screen.showDeviantInMain(deviantName);
	});

	var findWorker;
	screen.$on("changeMode", ({ detail: {from, to} }) => {
		if (to == "find") {
			findWorker = new Worker(new URL("find.js", import.meta.url), {type: "module"});
			let prevResults = readStore(findResults);
			findWorker.postMessage({
				deviantsMap: deviants.baseMap,
				subaccounts: deviants.subaccounts,
				query: prevResults && prevResults.for,
			});
			findWorker.onmessage = ({data}) => {
				data.deviants = data.deviants.map( (deviant) => {
					return deviants.effectiveMap.get(deviant);
				} );
				for (let resultSet of data.deviations) {
					resultSet.deviant = deviants.effectiveMap.get(resultSet.deviant);
				}
				findResults.set(data);
			};
		}
		if (from == "find") {
			findWorker.terminate();
		}
		if (from == "options") {
			deviants.setSubaccounts( readStore(prefs.stores.subaccounts) );
			screen.$set({deviantList: deviants.list});
		}
	});
	screen.$on("closeRequested", env.closeDeviantLove);
	submitFindQuery = async (query) => {
		screen.$set({mode: "find"});
		await tick();
		findWorker.postMessage({query});
	};
	miniSubaccountsEditorHelper = {
		getAccountObjects(accounts = []) {
			return accounts.map( (accountName) => {
				return deviants.baseMap.get(accountName) || new Deviant(accountName);
			} );
		},
	};
	var subaccountsSubscriberFirstRun = true;
	prefs.stores.subaccounts.subscribe( (subaccounts) => {
		if (subaccountsSubscriberFirstRun) {
			subaccountsSubscriberFirstRun = false;
			return;
		}
		if (screen.mode != "options") {
			deviants.setSubaccounts(subaccounts);
			screen.$set({deviantList: deviants.list});
		}
		if (screen.mode == "find") {
			findWorker.postMessage({subaccounts: deviants.subaccounts});
		}
	} );
	env.events.on("show", (delay) => delay( nextTip() ));
}

export var usingTouch = false;
document.body.addEventListener("touchstart", () => {
	usingTouch = true;
	document.body.classList.add("usingTouch");
}, {passive: true});
document.body.addEventListener("touchend", function prepareForSwitchToMouse(lastTouch) {
	document.body.addEventListener("touchend", updateLastTouch);
	function updateLastTouch(touchEvent) { lastTouch = touchEvent; }
	document.body.addEventListener("mousemove", function switchToMouse(mouseEvent) {
		if (lastTouch.timeStamp + 350 > mouseEvent.timeStamp) { return; }
		usingTouch = false;
		document.body.classList.remove("usingTouch");
		document.body.removeEventListener("mousemove", switchToMouse);
		document.body.addEventListener("touchend", prepareForSwitchToMouse,
			{passive: true, once: true});
	});
}, {passive: true, once: true});
export var usingKeyboard = false;
document.body.addEventListener("keydown", () => { usingKeyboard = true; });
document.body.addEventListener("pointerdown", () => { usingKeyboard = false; });