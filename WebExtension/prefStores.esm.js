/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
import webextStorageAdapter from "svelte-webext-storage-adapter";
import writableDerived from "svelte-writable-derived";
import { storageArea } from "./apiAdapter.esm.js";
export var stores;
export { stores as default };
export function init() {
	let keys = {
		findAsYouType: true,
		subaccounts: "{}",
	};
	let {stores: rawStores, ready} = webextStorageAdapter(storageArea, keys);
	stores = {...rawStores,
		subaccounts: writableDerived(
			rawStores.subaccounts,
			(json) => JSON.parse(json),
			(obj) => JSON.stringify(obj),
		),
	};
	return ready;
}