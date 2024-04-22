<script>
import l10n from "../../l10nStore.esm.js";
import prefStores from "../../prefStores.esm.js";
import { target } from "../../keyboardNavigation.esm.js";
import { findModeContentHelper as helper } from "../core.esm.js";
import DeviantList from "./DeviantList.svelte";
import DeviationList from "./DeviationList.svelte";
import Avatar from "./Avatar.svelte";
import { beforeUpdate, afterUpdate, tick } from 'svelte';

export let showDeviantInMain;
export let watchedArtists;

let queryResults = helper.resultsStore;
let oldQueryResults;

let deviantList;

beforeUpdate(async () => {
	if ($queryResults && $queryResults != oldQueryResults) {
		// If the new results are for a new query
		if ($queryResults.for != (oldQueryResults && oldQueryResults.for)) {
			if (deviantList) {
				deviantList.reset();
			}
			await tick();
			// If results consist of nothing but 1 deviant, open their DeviantEntry
			if ($queryResults.deviants.length == 1 && !$queryResults.deviations.length) {
				deviantList.showDeviant($queryResults.deviants[0].name);
			}
		}
	}
});
afterUpdate(() => {
	if ($queryResults != oldQueryResults) {
		// Set subaccount notes
		if (deviantList) { // implies ($queryResults && $queryResults.deviants.length)
			if (oldQueryResults && oldQueryResults.matchedBySubaccount) {
				for (let deviant of Object.keys(oldQueryResults.matchedBySubaccount)) {
					let entry = deviantList.registry[deviant];
					if (!entry) { continue; }
					entry.$set({note: null});
				}
			}
			for (let [deviant, subaccount] of Object.entries($queryResults.matchedBySubaccount)) {
				deviantList.registry[deviant].$set(
					{ note: ["foundDeviantSubaccount", {name: subaccount}] } );
			}
		}

		oldQueryResults = $queryResults;
	}
});

let showAmpersandHint;
$: {
	let checkMe = $queryResults ? $queryResults.for : "";
	showAmpersandHint = checkMe.indexOf(" ") != -1 && checkMe.indexOf("&") == -1;
}

$: hasResults = $queryResults &&
	Boolean($queryResults.deviants.length || $queryResults.deviations.length);
</script>

<div id="resultsDisplay" style="overflow-y: auto; overflow-x: hidden; position: relative;"
	class:hasResults>
	{#if $queryResults}
		{#if $queryResults.deviants.length}
			<div class="sectionHeader">{$l10n("foundDeviants", {num: $queryResults.deviants.length})}</div>
			<DeviantList deviants={$queryResults.deviants} {watchedArtists} bind:this={deviantList}/>
		{/if}
		{#if $queryResults.deviations.length}
			<div class="sectionHeader">
				{$l10n("foundDeviations",
					{deviations: $queryResults.deviationTotal, artists: $queryResults.deviations.length})}
			</div>
			{#each $queryResults.deviations as {deviant, deviations} (deviant.name)}
				<div class="deviationResultGroup">
					<div class="deviationResultGroupHeader">
						{$l10n("foundDeviationsArtistHeader", {name: deviant.name})}
					</div>
					<DeviationList {deviations}/>
					<div class="deviationResultGroupSidebar">
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