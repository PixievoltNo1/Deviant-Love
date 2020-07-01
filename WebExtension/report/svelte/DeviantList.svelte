<script>
import l10n from "../../l10nStore.esm.js";
import prefStores from "../../prefStores.esm.js";
import DeviantEntry from "./DeviantEntry.svelte";
import { visible } from "../core.esm.js";
import { afterUpdate } from 'svelte';

let { subaccounts } = prefStores;

export let deviants;
var oldDeviants;
export let watchedArtists;
let opened;
export const registry = new Proxy(Object.create(null), {
	// Workaround for a Svelte 3.23.2 bug (report pending)
	set(target, property, value) {
		if (value == null) {
			for (let {name} of deviants) {
				if (property == name) {
					return true;
				}
			}
		}
		target[property] = value;
		return true;
	},
});;
let fresh = true;

afterUpdate( () => {
	if (deviants != oldDeviants) {
		if (fresh) {
			Promise.resolve().then( () => { fresh = false; } );
		}
		if (opened) {
			registry[opened].scrollIntoView();
		}
		oldDeviants = deviants;
	}
} );
export function showDeviant(deviantName) {
	let oldOpened = opened;
	if (deviantName == oldOpened) {
		return "alreadyOpened";
	}
	let showTransition = !fresh && $visible;
	if (oldOpened) {
		registry[oldOpened].close(showTransition);
	}
	registry[deviantName].open(showTransition);
	opened = deviantName;
}
export function reset() {
	if (opened) {
		registry[opened].close(false);
	}
	opened = "";
	fresh = true;
}
</script>

<div class="deviantList" style="position: static;">
	{#each deviants as deviant (deviant.name)}
		<DeviantEntry {deviant} bind:this={registry[deviant.name]} {watchedArtists} {showDeviant}
			l10n={$l10n} hasSubaccounts={deviant.name in $subaccounts}/>
	{/each}
</div>