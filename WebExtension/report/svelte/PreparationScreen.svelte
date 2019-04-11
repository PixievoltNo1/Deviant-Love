<script>
import l10n from "../../l10nStore.esm.js";
import squishToFit from "../squishToFit.esm.js";
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();
export let pageType, maxDeviations, percent = 0, found = 0, watchStatus;
export let stopped, errored;
$: scanMessage = ( {
	featured: "scanningFeatured",
	allFaves: "scanningAll",
	collection: "scanningCollection",
	search: "scanningSearch"
} )[pageType];
</script>

<div id="preparationScreen" style="{stopped ? '' : 'cursor: wait;'}">
	<div id="scanMessage" use:squishToFit>{$l10n(scanMessage)}</div>
	{#if !errored}
		<div id="scanStatus">
			<div id="scanPercentage">
				{#if maxDeviations}
					<progress id="scanProgressBar" value="{percent}"></progress>
					<div id="scanPercentageText">{Math.floor(percent * 100)}%</div>
				{:else}
					<progress id="scanProgressBar"></progress>
				{/if}
			</div>
			<div id="scannedDeviations">{$l10n("scannedDeviations", {num: found})}</div>
			<div id="watchStatus">{watchStatus ? $l10n(watchStatus) : ""}</div>
		</div>
	{:else}
		<div id="scanFailed">
			<div id="scanError">{$l10n("scanError")}</div>
			<button id="retryButton" type="button" on:click="{() => dispatch('retry')}">
				{$l10n("scanErrorRetry")}
			</button>
		</div>
	{/if}
</div>