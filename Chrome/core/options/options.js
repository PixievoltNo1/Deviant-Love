var templateContents = {};
fillL10n(document);
for (let elem of Array.from( document.getElementsByTagName("template") )) {
	fillL10n(elem.content);
	templateContents[elem.id] = document.importNode(elem.content, true);
}
apiAdapter.retrieve(["subaccounts"]).then(({subaccounts}) => {
	for (let [owner, owned] of Object.entries(subaccounts)) {
		var ownerElem = $(templateContents["subaccountOwner"]).clone();
		ownerElem.find(".subaccountOwnerLine .accountName").text(owner);
		for (let subaccount of owned) {
			var subaccountElem = $(templateContents["subaccountLine"]).clone();
			subaccountElem.find(".accountName").text(subaccount);
			subaccountElem.insertBefore(ownerElem.find(".addSubaccount"));
		}
		ownerElem.insertBefore(".newOwner");
	}
});
function fillL10n(parent) {
	for (let elem of Array.from( parent.querySelectorAll("[data-l10n]") )) {
		elem.textContent = chrome.i18n.getMessage( elem.dataset.l10n );
	}
}