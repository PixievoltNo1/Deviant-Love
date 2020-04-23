/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
import Options from "./svelte/Options.svelte";
import * as prefs from "../prefStores.esm.js";
import { init as initL10n } from "../l10nStore.esm.js";
import * as subaccountsEditorSettings from "./subaccountsEditorCore.esm.js";

(async function() {
	await prefs.init();
	subaccountsEditorSettings.setSubaccountsStore(prefs.stores.subaccounts);
	await initL10n();
	new Options({ target: document.body });
})();