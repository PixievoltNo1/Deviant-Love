/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
import { getL10nMsg } from "./apiAdapter.esm.js";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { writable } from "svelte/store";
var store = writable( () => "" );
export { store as default };
export async function init(langPref) {
	var response = await fetch( getL10nMsg("fileFluent") );
	var ftl = new FluentResource( await response.text() );
	var bundle = new FluentBundle('en-US');
	var errors = bundle.addResource(ftl);
	logAll(errors);
	store.set( (msg, args) => {
		var errors = [];
		var text = bundle.formatPattern( bundle.getMessage(msg).value, args, errors );
		logAll(errors);
		return text;
	} );
}
function logAll(arr) {
	for (let part of arr) {
		console.log(part);
	}
}