/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
if (!(window.chrome && chrome.runtime)) { window.chrome = browser; }
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
var options = new Options({
	target: document.body,
	store,
});
function getOwnerFromElem(ownerElem) {
	return ownerElem.find(".ownerLine .accountName").text();
}
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
	var profileURL = "http://" + name + ".deviantart.com/";
	return $.ajax(profileURL, {responseType: "text"}).then((profileHTML) => {
		var profileDoc = (new DOMParser()).parseFromString(profileHTML, "text/html");
		var verifiedName = $(profileDoc).find("#gmi-Gruser").attr("gmi-name");
		if (!verifiedName) {
			var warning = "CantVerifyCasing";
			verifiedName = input;
		}
		return {name: verifiedName, warning};
	}, (xhr) => {
		if (xhr.status == 404) {
			throw ["NotFound", [name]];
		}
		throw ["Communcation"];
	});
}
async function addSubaccount(owner, owned) {
	try {
		var {name, ownedBy, isOwner, warning} = await nameCheck(owned);
		if (ownedBy) {
			throw ["AlreadyOwned", [ownedBy]];
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
			showSubaccountWarning(warning, [name]);
		}
		return true;
	} catch (err) {
		showSubaccountError(...err);
	}
}
function showSubaccountError(msgKey, replacements) {
	document.querySelector(".subaccountsMessage.warning").hidden = true;
	var errElem = document.querySelector(".subaccountsMessage.error");
	errElem.textContent = apiAdapter.getL10nMsg("subaccountsError" + msgKey, replacements);
	errElem.hidden = false;
}
function showSubaccountWarning(msgKey, replacements) {
	var warnElem = document.querySelector(".subaccountsMessage.warning");
	if (warnElem.hidden) {
		$(warnElem).empty();
	}
	$("<p>").text( apiAdapter.getL10nMsg("subaccountsWarning" + msgKey, replacements) )
		.appendTo(warnElem);
	warnElem.hidden = false;
}
$("#subaccountsEditor").delegate("form, button", "submit click", function(event) {
	if (event.type == "submit") {
		event.preventDefault();
	}
	if ($("#subaccountsEditor").find(".editorShield").length) {
		event.stopImmediatePropagation();
		return;
	}
	$(".subaccountsMessage").prop("hidden", true);
}).delegate(".addSubaccountForm", "submit", function() {
	// TODO: Re-implement hiding the form after a successful add
	var ownerElem = $(this).closest(".subaccountOwner");
	var owner = getOwnerFromElem(ownerElem);
	var shield = $("<div>").addClass("editorShield").appendTo("#subaccountsEditor");
	addSubaccount(owner, $(this).find(".subaccountInput").val()).then((ok) => {
		shield.remove();
	});
}).delegate(".newOwnerForm", "submit", function() {
	// TODO: Re-implement hiding the form after a successful add
	var checkResults = nameCheck(this.querySelector(".newSubaccountOwnerInput").value);
	if (checkResults.ownedBy) {
		showSubaccountError("OwnerIsOwned", [checkResults.name, checkResults.ownedBy]);
		return;
	}
	var shield = $("<div>").addClass("editorShield").appendTo("#subaccountsEditor");
	Promise.resolve(checkResults).then(({name, isOwner, warning}) => {
		if (warning) {
			showSubaccountWarning(warning, [name]);
		}
		if (isOwner) {
			showSubaccountWarning("OwnerAlreadyAdded", [name]);
		}
		return addSubaccount(name, this.querySelector(".subaccountInput").value);
	}, (err) => {
		showSubaccountError(...err);
		return [];
	}).then((ok) => {
		shield.remove();
	});
}).delegate("button.removeSubaccount", "click", function() {
	var owner = getOwnerFromElem( $(this).closest(".subaccountOwner") );
	var unowned = $(this).closest(".editorLine").find(".accountName").text(); // got a faceful of Hidden Power
	subaccounts[owner].splice(subaccounts[owner].indexOf(unowned), 1);
	if (subaccounts[owner].length == 0) {
		delete subaccounts[owner];
	}
	store.set({subaccounts});
}).delegate(".changeMainAccountForm", "submit", function() {
	var ownerElem = $(this).closest(".subaccountOwner");
	var owner = getOwnerFromElem(ownerElem);
	var newOwner = ownerElem.find(":checked")[0].value;
	// TODO: Re-implement returning the mode to normal if $noChange is selected
	if (newOwner != "$noChange") {
		// TODO: Rewrite to preserve object entry order
		var owned = subaccounts[owner];
		owned[ owned.indexOf(newOwner) ] = owner;
		subaccounts[newOwner] = owned;
		delete subaccounts[owner];
		store.set({subaccounts});
	}
});

var syncError, lastSaved;
var syncElem = document.getElementById("syncStatus");
var localGet = new Promise((resolve) => { chrome.storage.local.get("syncError", resolve); });
var syncGet = new Promise((resolve) => { chrome.storage.sync.get("lastSaved", resolve); });
var supportCheck = new Promise((resolve) => {
	chrome.runtime.sendMessage({action: "checkSyncByBrowserSupport"}, resolve);
});
Promise.all([localGet, syncGet, supportCheck]).then(([localVal, syncVal, allowed]) => {
	if (!syncVal || !allowed) {
		// The browser forbids use of chrome.storage.sync or doesn't actually sync it
		syncElem.className = "error";
		$("<p>").text( apiAdapter.getL10nMsg("syncByBrowserUnsupported") ).appendTo(syncElem);
		return;
	}
	syncError = localVal.syncError;
	lastSaved = syncVal.lastSaved;
	printSyncStatus();
	chrome.storage.onChanged.addListener((changes, areaName) => {
		if (areaName == "local" && "syncError" in changes) {
			syncError = changes.syncError.newValue;
		} else if (areaName == "sync" && "lastSaved" in changes) {
			lastSaved = changes.lastSaved.newValue;
		} else { return; }
		$("#syncStatus").empty();
		printSyncStatus();
	});
});
function printSyncStatus() {
	var lastSavedDisplay = (new Date(lastSaved)).toLocaleString();
	if (!syncError) {
		syncElem.className = "ok";
		$("<p>").text( apiAdapter.getL10nMsg("syncByBrowserOK") ).appendTo(syncElem);
		$("<p>").text( apiAdapter.getL10nMsg("syncLastSaved", [lastSavedDisplay]) )
			.appendTo(syncElem);
	} else {
		syncElem.className = "error";
		$("<p>").text( apiAdapter.getL10nMsg("syncByBrowserError", [syncError]) ).appendTo(syncElem);
		$("<p>").text( apiAdapter.getL10nMsg("syncLastSuccessfulSync", [lastSavedDisplay]) )
			.appendTo(syncElem);
	}
}