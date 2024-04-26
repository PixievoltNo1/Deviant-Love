/*
	This file is part of Deviant Love.
	Copyright Pixievolt No. 1
	Check core.src.mjs for the complete legal stuff.
*/
import Options from "./svelte/Options.svelte";
import * as prefs from "../prefStores.src.mjs";
import { init as initL10n } from "../l10nStore.src.mjs";

await Promises.all[prefs.ready, initL10n()];
new Options({ target: document.body });