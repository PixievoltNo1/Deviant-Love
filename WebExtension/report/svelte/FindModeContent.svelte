<script context="module">
import { writable } from "svelte/store";
export var findResults = writable(null);
</script>
<script>
import l10n from "../../l10nStore.src.mjs";
import { makeNavRoot, target } from "../../keyboardNavigation.src.mjs";
import DeviantList from "./DeviantList.svelte";
import DeviationList from "./DeviationList.svelte";
import Avatar from "./Avatar.svelte";
import { beforeUpdate, afterUpdate, tick } from 'svelte';

export let showDeviantInMain;
export let watchedArtists;
let oldFindResults;
let deviantList;

beforeUpdate(async () => {
	if ($findResults && $findResults != oldFindResults) {
		// If the new results are for a new query
		if ($findResults.for != (oldFindResults && oldFindResults.for)) {
			if (deviantList) {
				deviantList.reset();
			}
			await tick();
			// If results consist of nothing but 1 deviant, open their DeviantEntry
			if ($findResults.deviants.length == 1 && !$findResults.deviations.length) {
				deviantList.showDeviant($findResults.deviants[0].name);
			}
		}
	}
});
afterUpdate(() => {
	if ($findResults != oldFindResults) {
		// Set subaccount notes
		if (deviantList) { // implies ($queryResults && $queryResults.deviants.length)
			if (oldFindResults && oldFindResults.matchedBySubaccount) {
				for (let deviant of Object.keys(oldFindResults.matchedBySubaccount)) {
					let entry = deviantList.registry[deviant];
					if (!entry) { continue; }
					entry.$set({note: null});
				}
			}
			for (let [deviant, subaccount] of Object.entries($findResults.matchedBySubaccount)) {
				deviantList.registry[deviant].$set(
					{ note: ["foundDeviantSubaccount", {name: subaccount}] } );
			}
		}

		oldFindResults = $findResults;
	}
});

$: showAmpersandHint = $findResults && /[ &]/.test($findResults.for);
$: hasResults = $findResults &&
	Boolean($findResults.deviants.length || $findResults.deviations.length);

function deviationResultsKeyboardNav(event) {
	if (event.target.closest(".deviationResultGroupSidebar")) {
		if (event.key == "ArrowLeft") {
			this.querySelector("[tabindex]").focus();
			event.stopPropagation();
		}
		if (event.key == "ArrowUp" || event.key == "ArrowDown") {
			let allSidebarTargets = document.querySelectorAll(".deviationResultGroupSidebar [tabindex]");
			let i = Array.prototype.indexOf.call(allSidebarTargets, event.target);
			i += (event.key == "ArrowUp") ? -1 : 1;
			if (i in allSidebarTargets) {
				allSidebarTargets[i].focus();
				event.stopPropagation();
			} else if (event.key == "ArrowUp") {
				let eventClone = new KeyboardEvent("keydown", event);
				this.dispatchEvent(eventClone);
				event.stopPropagation();
			}
		}
	} else { // In the deviations list
		if (event.key == "ArrowRight") {
			this.querySelector(".deviationResultGroupSidebar [tabindex]").focus();
			event.stopPropagation();
		}
	}
}
</script>

<div class="findMode mainContent" class:hasResults
	style="overflow: hidden auto; contain: strict;" use:makeNavRoot>
	{#if $findResults}
		{#if $findResults.deviants.length}
			<div class="sectionHeader">{$l10n("foundDeviants", {num: $findResults.deviants.length})}</div>
			<DeviantList deviants={$findResults.deviants} {watchedArtists} bind:this={deviantList}/>
		{/if}
		{#if $findResults.deviations.length}
			<div class="sectionHeader">
				{$l10n("foundDeviations",
					{deviations: $findResults.deviationTotal, artists: $findResults.deviations.length})}
			</div>
			{#each $findResults.deviations as {deviant, deviations} (deviant.name)}
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="deviationResultGroup" on:keydown={deviationResultsKeyboardNav}>
					<div class="deviationResultGroupHeader">
						{$l10n("foundDeviationsArtistHeader", {name: deviant.name})}
					</div>
					<DeviationList {deviations}/>
					<div class="deviationResultGroupSidebar skipVerticalNav">
						<Avatar {deviant}/>
						<button type="button" class="viewDeviant"
							use:target={ {activate() {showDeviantInMain(deviant.name)} } }>
							{deviant.deviations.length}
						</button>
					</div>
				</div>
			{/each}
		{/if}
		{#if !hasResults}
			<div id="noResults">{$l10n("foundNothing")}</div>
		{/if}
	{/if}
	{#if showAmpersandHint}
		<div id="ampersandHint" class="notice">{$l10n("findAmpersandHint")}</div>
	{/if}
</div>