/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
import { writable } from "svelte/store";
import prefSpec from "./prefSpec.module.js";
export var stores = {};
export { stores as default };
export async function init(prefs = Object.keys(prefSpec)) {
	var request = {}, wakes = new Map(), sleeps = new Map();
	for (let key of prefs) {
		let {default: def, wake = false, sleep = false} = prefSpec[key];
		request[key] = def;
		if (wake) { wakes.set(key, wake); }
		if (sleep) { sleeps.set(key, sleep); }
	}
	var data = await new Promise((resolve) => { chrome.storage.local.get(request, resolve) });
	for (let [key, wake] of wakes.entries()) {
		data[key] = wake(data[key]);
	}
	for (let [key, value] of Object.entries(data)) {
		let store = writable(value);
		store.subscribe((newVal) => {
			if (sleeps.has(key)) { newVal = sleeps.get(key)(newVal); }
			chrome.storage.local.set({[key]: newVal});
		});
		stores[key] = store;
	}
	return true;
}