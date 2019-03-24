/*
	This file is part of Deviant Love.
	Copyright Pikadude No. 1
	Check core.module.js for the complete legal stuff.
*/
import Options from "./svelte/Options.html";
import * as prefs from "../prefStores.module.js";
import { init as initL10n } from "../l10nStore.module.js";
import * as subaccountsEditorSettings from "./subaccountsEditorCore.module.js";

(async function() {
	await prefs.init();
	subaccountsEditorSettings.setSubaccountsStore(prefs.stores.subaccounts);
	await initL10n();
	new Options({ target: document.body });
})();