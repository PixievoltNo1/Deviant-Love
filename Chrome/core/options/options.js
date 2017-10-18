var templateContents = {};
fillL10n(document);
for (let elem of Array.from( document.getElementsByTagName("template") )) {
	fillL10n(elem.content);
	templateContents[elem.id] = document.importNode(elem.content, true);
}
var subaccounts;
apiAdapter.retrieve(["subaccounts"]).then((data) => {
	({subaccounts} = data);
	for (let owner in subaccounts) {
		$(".newOwner").before( makeOwnerElem(owner) );
	}
});
function makeOwnerElem(owner) {
	var ownerElem = $(templateContents["subaccountOwner"]).clone();
	ownerElem.find(".subaccountOwnerLine .accountName").text(owner);
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
	ownerElem.find(".addSubaccount").before(subaccountElem);
}
function getOwnerFromElem(ownerElem) {
	return ownerElem.find(".subaccountOwnerLine .accountName").text();
}
function findOwnerElem(owner) {
	for (let elem of $(".subaccountOwner")) {
		if (getOwnerFromElem( $(elem) ) == owner) {
			return elem;
		}
	}
}
function nameCheck(name) {
	// TODO: DRY this after rewriting #addSubaccount handler in core.js
	name = name.toLowerCase();
	for (let owner in subaccounts) {
		if (owner.toLowerCase() == name) {
			return {name: owner, isOwner: true};
		}
		for (let subaccount of subaccounts[owner]) {
			if (subaccount.toLowerCase() == name) {
				return {name: subaccount, isSubaccount: true};
			}
		}
	}
	var profileURL = "http://" + name + ".deviantart.com/";
	return $.ajax(profileURL, {responseType: "text"}).then((profileHTML) => {
		var profileDoc = (new DOMParser()).parseFromString(profileHTML, "text/html");
		var verifiedName = $(profileDoc).find("#gmi-Gruser").attr("gmi-name");
		if (!verifiedName) {
			var warning = "CantVerifyCasing";
			verifiedName = name;
		}
		return {name: verifiedName, warning};
	}, (xhr) => {
		if (xhr.status == 404) {
			throw "NotFound";
		}
		throw "Communcation";
	});
}
async function addSubaccount(owner, ownerElem, owned) {
	try {
		var {name, isSubaccount, isOwner, warning} = await nameCheck(owned);
		if (isSubaccount) {
			throw "AlreadyOwned";
		}
		subaccounts[owner].push(name);
		addSubaccountLine(ownerElem, name);
		if (isOwner) {
			for (let subaccount in subaccounts[name]) {
				addSubaccountLine(ownerElem, subaccount);
				subaccounts[owner].push(subaccount);
			}
			findOwnerElem(name).remove();
			delete subaccounts[name];
		}
		apiAdapter.store("subaccounts", subaccounts);
		if (warning) {
			// TODO: Show warning
		}
		return true;
	} catch (errName) {
		// TODO: Show error box
	}
}
$("#subaccountsEditor").delegate("form", "submit", function(event) {
	event.preventDefault();
}).delegate("button.addSubaccount", "click", function() {
	this.hidden = true;
	this.nextElementSibling.hidden = false;
	this.nextElementSibling.querySelector(".subaccountInput").focus();
}).delegate(".addSubaccountForm", "submit", function() {
	var ownerElem = $(this).closest(".subaccountOwner");
	var owner = getOwnerFromElem(ownerElem);
	$("body").css("cursor", "wait"); // Replace this with creating a screen element
	addSubaccount(owner, ownerElem, $(this).find(".subaccountInput").val()).then((ok) => {
		if (ok) {
			this.hidden = true;
			this.previousElementSibling.hidden = false;
		}
		$("body").css("cursor", "");
	});
}).delegate("button.newOwner", "click", function() {
	this.hidden = true;
	this.nextElementSibling.hidden = false;
	this.nextElementSibling.querySelector(".newSubaccountOwnerInput").focus();
}).delegate(".newOwnerForm", "submit", function() {
	var checkResults = nameCheck(this.querySelector(".newSubaccountOwnerInput").value);
	if (checkResults.isSubaccount) {
		// TODO: Error
		return;
	}
	Promise.resolve(checkResults).then(({name, isOwner, warning}) => {
		// TODO: Process warning
		if (!isOwner) {
			var ownerElem = makeOwnerElem(name);
			var appendMe = ownerElem;
			subaccounts[name] = [];
		} else {
			var ownerElem = $(findOwnerElem(owner));
		}
		return Promise.all([
			addSubaccount(name, ownerElem, this.querySelector(".subaccountInput").value),
			appendMe
		]);
	}).then(([ok, appendMe]) => {
		if (ok) {
			this.hidden = true;
			this.previousElementSibling.hidden = false;
			$(".newOwner").before(appendMe);
		}
		$("body").css("cursor", "");
	});
	// TODO: Cancel button event handler
}).delegate("button.cancelOwner", "click", function() {
	var form = $(".newOwnerForm")[0];
	form.hidden = true;
	form.previousElementSibling.hidden = false;
}).delegate("button.removeSubaccount", "click", function() {
	var ownerElem = $(this).closest(".subaccountOwner");
	var owner = getOwnerFromElem(ownerElem);
	var unownedElem = $(this).closest(".subaccountLine").remove();
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
	changeForm.find(".subaccountOwnerLine .accountName").text(owner);
	for (let subaccount of subaccounts[owner]) {
		let subaccountElem = $(templateContents["changeSubaccountOwnerOption"]).clone();
		subaccountElem.find(".accountName").text(subaccount);
		subaccountElem.find("input").attr("value", subaccount);
		changeForm.find("button[type='submit']").before(subaccountElem);
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
function fillL10n(parent) {
	for (let elem of Array.from( parent.querySelectorAll("[data-l10n]") )) {
		var message = apiAdapter.getL10nMsg( elem.dataset.l10n );
		if (elem.dataset.l10nAttr) {
			elem.setAttribute(elem.dataset.l10nAttr, message);
		} else {
			elem.textContent = message;
		}
	}
}