/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.js for the complete legal stuff.
*/
var templateContents = {};
fillL10n(document);
for (let elem of Array.from( document.getElementsByTagName("template") )) {
	fillL10n(elem.content);
	templateContents[elem.id] = document.importNode(elem.content, true);
}

var subaccounts;
apiAdapter.retrieve(["subaccounts"]).then((data) => {
	({subaccounts} = data);
	if (!subaccounts) {
		subaccounts = {};
		return;
	} else {
		$("#subaccountsEditorExplainer").remove();
		for (let owner in subaccounts) {
			$(".newOwner").before( makeOwnerElem(owner) );
		}
	}
});
function makeOwnerElem(owner) {
	var ownerElem = $(templateContents["subaccountOwner"]).clone();
	ownerElem.find(".ownerLine .accountName").text(owner);
	if (owner in subaccounts) {
		for (let subaccount of subaccounts[owner]) {
			addSubaccountLine(ownerElem, subaccount);
		}
	}
	return ownerElem;
}
function addSubaccountLine(ownerElem, subaccount) {
	var subaccountElem = $(templateContents["subaccountLine"]).clone();
	subaccountElem.find(".accountName").text(subaccount);
	ownerElem.find(".subaccountInsertionPoint").before(subaccountElem);
}
function getOwnerFromElem(ownerElem) {
	return ownerElem.find(".ownerLine .accountName").text();
}
function findOwnerElem(owner) {
	for (let elem of $(".subaccountOwner")) {
		if (getOwnerFromElem( $(elem) ) == owner) {
			return elem;
		}
	}
}
function nameCheck(input) {
	// TODO: DRY this after rewriting #addSubaccount handler in core.js
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
async function addSubaccount(owner, ownerElem, owned) {
	try {
		var {name, ownedBy, isOwner, warning} = await nameCheck(owned);
		if (ownedBy) {
			throw ["AlreadyOwned", [ownedBy]];
		}
		if (!(owner in subaccounts)) {
			subaccounts[owner] = [];
		}
		subaccounts[owner].push(name);
		addSubaccountLine(ownerElem, name);
		if (isOwner) {
			for (let subaccount of subaccounts[name]) {
				addSubaccountLine(ownerElem, subaccount);
				subaccounts[owner].push(subaccount);
			}
			findOwnerElem(name).remove();
			delete subaccounts[name];
		}
		apiAdapter.store("subaccounts", subaccounts);
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
}).delegate("button.addSubaccount", "click", function() {
	this.hidden = true;
	this.nextElementSibling.hidden = false;
	this.nextElementSibling.querySelector(".subaccountInput").focus();
}).delegate(".addSubaccountForm", "submit", function() {
	var ownerElem = $(this).closest(".subaccountOwner");
	var owner = getOwnerFromElem(ownerElem);
	var shield = $("<div>").addClass("editorShield").appendTo("#subaccountsEditor");
	addSubaccount(owner, ownerElem, $(this).find(".subaccountInput").val()).then((ok) => {
		if (ok) {
			this.hidden = true;
			this.previousElementSibling.hidden = false;
			this.reset();
		}
		shield.remove();
	});
}).delegate("button.openNewOwner", "click", function() {
	this.hidden = true;
	this.nextElementSibling.hidden = false;
	this.nextElementSibling.querySelector(".newSubaccountOwnerInput").focus();
}).delegate(".newOwnerForm", "submit", function() {
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
		if (!isOwner) {
			var ownerElem = makeOwnerElem(name);
			var appendMe = ownerElem;
		} else {
			var ownerElem = $(findOwnerElem(name));
			showSubaccountWarning("OwnerAlreadyAdded", [name]);
		}
		return Promise.all([
			addSubaccount(name, ownerElem, this.querySelector(".subaccountInput").value),
			appendMe
		]);
	}, (err) => {
		showSubaccountError(...err);
		return [];
	}).then(([ok, appendMe]) => {
		if (ok) {
			this.hidden = true;
			this.previousElementSibling.hidden = false;
			this.reset();
			$(".newOwner").before(appendMe);
			$("#subaccountsEditorExplainer").remove();
		}
		shield.remove();
	});
}).delegate("button.cancelOwner", "click", function() {
	var form = $(".newOwnerForm")[0];
	form.hidden = true;
	form.previousElementSibling.hidden = false;
}).delegate("button.removeSubaccount", "click", function() {
	var ownerElem = $(this).closest(".subaccountOwner");
	var owner = getOwnerFromElem(ownerElem);
	var unownedElem = $(this).closest(".editorLine").remove();
	var unowned = unownedElem.find(".accountName").text(); // got a faceful of Hidden Power
	subaccounts[owner].splice(subaccounts[owner].indexOf(unowned), 1);
	if (subaccounts[owner].length == 0) {
		ownerElem.remove();
		delete subaccounts[owner];
	}
	apiAdapter.store("subaccounts", subaccounts);
}).delegate("button.changeMainAccount", "click", function() {
	var ownerElem = $(this).closest(".subaccountOwner");
	var owner = getOwnerFromElem(ownerElem);
	var changeForm = $(templateContents["changeSubaccountOwner"]).clone();
	changeForm.find(".ownerLine .accountName").text(owner);
	for (let subaccount of subaccounts[owner]) {
		let subaccountElem = $(templateContents["changeSubaccountOwnerOption"]).clone();
		subaccountElem.find(".accountName").text(subaccount);
		subaccountElem.find("input").attr("value", subaccount);
		changeForm.find(".subaccountInsertionPoint").before(subaccountElem);
	}
	ownerElem.replaceWith(changeForm);
}).delegate(".changeMainAccountForm", "submit", function() {
	var ownerElem = $(this).closest(".subaccountOwner");
	var owner = getOwnerFromElem(ownerElem);
	var newOwner = (new FormData(ownerElem[0])).get("newOwner");
	if (newOwner == "$noChange") {
		ownerElem.replaceWith( makeOwnerElem(owner) );
	} else {
		var owned = subaccounts[owner];
		owned[ owned.indexOf(newOwner) ] = owner;
		subaccounts[newOwner] = owned;
		delete subaccounts[owner];
		apiAdapter.store("subaccounts", subaccounts);
		ownerElem.replaceWith( makeOwnerElem(newOwner) );
	}
});

var syncError, lastSaved;
var syncElem = document.getElementById("syncStatus");
var localGet = new Promise((resolve) => { chrome.storage.local.get("syncError", resolve); });
var syncGet = new Promise((resolve) => { chrome.storage.sync.get("lastSaved", resolve); });
Promise.all([localGet, syncGet]).then(([localVal, syncVal]) => {
	if (!syncVal) {
		// We're in Firefox 52, which doesn't support sync storage
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