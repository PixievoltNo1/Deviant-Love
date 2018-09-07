/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
import * as apiAdapter from "../apiAdapter.module.js";
import Options from "./svelte/Options.html";
import { Store } from "svelte/store";
import storePersist from "../storePersist.module.js";
import lookUpDeviant from "../report/lookUpDeviant.module.js";

var store = new Store({
	l10n: apiAdapter.getL10nMsg,
});
var subaccounts;
storePersist(store).then(() => {
	store.set({prefsLoaded: true});
	({subaccounts} = store.get());
});
var options = new Options({
	target: document.body,
	store,
});
var {subaccountsEditor} = options.refs;
function nameCheck(input) {
	// TODO: DRY this after rewriting #addSubaccount handler in core.module.js
	var name = input.toLowerCase();
	for (let owner in subaccounts) {
		if (owner.toLowerCase() == name) {
			return {name: owner, isOwner: true};
		}
		for (let subaccount of subaccounts[owner]) {
			if (subaccount.toLowerCase() == name) {
				return {name: subaccount, ownedBy: owner};
			}
		}
	}
	return lookUpDeviant(name).then((results) => {
		if (results.name) {
			return {name: results.name};
		} else {
			return { name: input, warning: {msg: "CantVerifyCasing", parts: [input]} };
		}
	}, (err) => {
		throw {msg: err, parts: [input]};
	});
}
async function addSubaccount(owner, owned) {
	try {
		var {name, ownedBy, isOwner, warning} = await nameCheck(owned);
		if (ownedBy) {
			throw {msg: "AlreadyOwned", parts: [ownedBy]};
		}
		if (!(owner in subaccounts)) {
			subaccounts[owner] = [];
		}
		subaccounts[owner].push(name);
		if (isOwner) {
			for (let subaccount of subaccounts[name]) {
				subaccounts[owner].push(subaccount);
			}
			delete subaccounts[name];
		}
		store.set({subaccounts});
		if (warning) {
			subaccountsEditor.addWarning(warning);
		}
		return true;
	} catch (error) {
		subaccountsEditor.set({error});
	}
}
subaccountsEditor.on("add", function(ownerComponent) {
	subaccountsEditor.set({busy: true});
	var {owner, newSubaccount} = ownerComponent.get();
	addSubaccount(owner, newSubaccount).then((ok) => {
		if (ok) {
			ownerComponent.set({showAddSubaccount: false});
		}
		subaccountsEditor.set({busy: false});
	});
});
subaccountsEditor.on("newOwner", function() {
	var checkResults = nameCheck(subaccountsEditor.get().newOwner);
	subaccountsEditor.set({busy: true});
	Promise.resolve(checkResults).then(({name, isOwner, ownedBy, warning}) => {
		if (warning) {
			subaccountsEditor.addWarning(warning);
		}
		if (ownedBy) {
			throw {msg: "OwnerIsOwned", parts: [name, ownedBy]};
		}
		if (isOwner) {
			subaccountsEditor.addWarning({msg: "OwnerAlreadyAdded", parts: [name]});
		}
		return addSubaccount(name, subaccountsEditor.get().firstSubaccount);
	}).catch((error) => {
		subaccountsEditor.set({error});
		return false;
	}).then((ok) => {
		if (ok) {
			subaccountsEditor.set({showNewOwnerForm: false});
		}
		subaccountsEditor.set({busy: false});
	});
});
subaccountsEditor.on("remove", function({owner, removing}) {
	subaccounts[owner].splice(subaccounts[owner].indexOf(removing), 1);
	if (subaccounts[owner].length == 0) {
		delete subaccounts[owner];
	}
	store.set({subaccounts});
});
subaccountsEditor.on("changeOwner", function(ownerComponent) {
	var {owner, newOwner} = ownerComponent.get();
	var newSubaccounts = {};
	for (let [entryOwner, owned] of Object.entries(subaccounts)) {
		if (entryOwner == owner) {
			owned[ owned.indexOf(newOwner) ] = owner;
			newSubaccounts[newOwner] = owned;
		} else {
			newSubaccounts[entryOwner] = owned;
		}
	}
	subaccounts = newSubaccounts;
	store.set({subaccounts});
});