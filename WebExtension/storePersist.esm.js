import prefSpec from './prefSpec.esm.js';
export default async function(store, prefs = Object.keys(prefSpec)) {
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
	store.set(data);
	store.on("state", ({changed, current}) => {
		for (let key of prefs) {
			if (!changed[key]) { continue; }
			let data = store.get()[key];
			if (sleeps.has(key)) { data = sleeps.get(key)(data); }
			chrome.storage.local.set({[key]: data});
		}
	});
	return true;
}