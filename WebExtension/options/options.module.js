/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
import * as apiAdapter from "../apiAdapter.module.js";
import Options from "./svelte/Options.html";
import { Store } from "svelte/store";
import storePersist from "../storePersist.module.js";
import "fluent-intl-polyfill";
import { FluentBundle } from "fluent";

var store = new Store({
	l10n: () => "",
});
(async function() {
	let response = await fetch( apiAdapter.getL10nMsg("fileFluent") );
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
})();
function logAll(arr) {
	for (let part of arr) {
		console.log(part);
	}
}
storePersist(store).then(() => {
	options.set({prefsLoaded: true});
});
var options = new Options({
	target: document.body,
	store,
});