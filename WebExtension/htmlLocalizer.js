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