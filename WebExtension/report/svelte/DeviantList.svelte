<script>
import DeviantEntry from "./DeviantEntry.svelte";
import { visible } from "../core.esm.js";
import { afterUpdate } from 'svelte';

export let deviants;
var oldDeviants;
export let watchedArtists;
export let opened;
var oldOpened;
export let request;
export const registry = {};

afterUpdate( () => {
	if (request) {
		if (!registry[request]) {
			// TODO: Handle this error condition
		} else {
			opened = request;
		}
		request = "";
	}
	if (opened != oldOpened) {
		let showTransition = (deviants == oldDeviants) && $visible;
		if (oldOpened) {
			registry[oldOpened].close(showTransition);
		}
		if (opened) {
			registry[opened].open(showTransition);
		}
		oldOpened = opened;
	}
	oldDeviants = deviants;
} );
</script>

<svelte:options accessors="{true}"/>
<div class="deviantList" style="position: static;">
	{#each deviants as deviant (deviant.name)}
		<DeviantEntry {deviant} {registry} {watchedArtists}
			on:openMe="{ () => { opened = deviant.name; } }"/>
	{/each}
</div>