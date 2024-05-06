<script context="module">
let prefersReducedMotion = matchMedia("(prefers-reduced-motion)");
</script>
<script>
import l10n from "../../l10nStore.src.mjs";
import prefStores from "../../prefStores.src.mjs";
import DeviantEntry from "./DeviantEntry.svelte";
import { visible } from "../environment.src.mjs";
import { afterUpdate } from 'svelte';

let { subaccounts } = prefStores;

export let deviants;
var oldDeviants;
export let watchedArtists;
let opened;
export const registry = {};
let fresh = true;

afterUpdate( () => {
	if (deviants != oldDeviants) {
		if (fresh) {
			Promise.resolve().then( () => { fresh = false; } );
		}
		if (opened) {
			let elem = registry[opened].getElem();
			elem.scrollIntoView();
			elem.querySelector(`[tabindex="0"]`)?.focus({preventScroll: true});
		}
		oldDeviants = deviants;
	}
} );
export function showDeviant(deviantName) {
	let oldOpened = opened;
	if (deviantName == oldOpened) {
		return "alreadyOpened";
	}
	let showTransition = !fresh && $visible && !prefersReducedMotion.matches;
	if (oldOpened) {
		registry[oldOpened].close(showTransition);
	}
	registry[deviantName].open(showTransition);
	opened = deviantName;
}
function closeDeviant() {
	registry[opened]?.close(!prefersReducedMotion.matches);
	opened = "";
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
		<DeviantEntry {deviant} bind:this={registry[deviant.name]} {watchedArtists}
			{showDeviant} {closeDeviant} l10n={$l10n} hasSubaccounts={deviant.name in $subaccounts}/>
	{/each}
</div>