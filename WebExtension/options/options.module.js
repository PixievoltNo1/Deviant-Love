/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
import * as apiAdapter from "../apiAdapter.module.js";
import Options from "./svelte/Options.html";
import { Store } from "svelte/store";
import storePersist from "../storePersist.module.js";

var store = new Store({
	l10n: apiAdapter.getL10nMsg,
});
var subaccounts;
storePersist(store).then(() => {
	store.set({prefsLoaded: true});
	({subaccounts} = store.get());
});
new Options({
	target: document.body,
	store,
});