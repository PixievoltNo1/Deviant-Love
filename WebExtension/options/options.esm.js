/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.esm.js for the complete legal stuff.
*/
import Options from "./svelte/Options.svelte";
import * as prefs from "../prefStores.esm.js";
import { init as initL10n } from "../l10nStore.esm.js";

await Promises.all[prefs.ready, initL10n()];
new Options({ target: document.body });