<script>
import l10n from "../../l10nStore.esm.js";
import { mobile, tip } from "../core.esm.js";
import DeviantList from "./DeviantList.svelte";
import FindModeContent from "./FindModeContent.svelte";
import SubaccountsEditor from "../../options/svelte/SubaccountsEditor.svelte";
import SyncStatus from "../../options/svelte/SyncStatus.svelte";
import squishToFit from "../squishToFit.esm.js";
import { createEventDispatcher, tick } from 'svelte';

const dispatch = createEventDispatcher();

export let totalDeviations, pageType, deviantList, watchError, watchedArtists;
export let requestedDeviant;
$: favesLineParts = $l10n("headerFavesLine", {num: totalDeviations, pageType}).split("*");
$: artistsLineParts = $l10n("headerArtistsLine", {num: deviantList.length, pageType}).split("*");

export let mode = "normal";
const actionList = ["find", "options"];
function useAction(action) {
	if (action != mode) {
		mode = action
	} else {
		mode = "normal";
	}
}
$: oldMode = (changeMode(), mode);
function changeMode() {
	dispatch("changeMode", {from: oldMode, to: mode});
	if (hamburgerMenuOpen) {
		closeHamburgerMenu();
	}
}

var hamburgerMenu;
var hamburgerMenuOpen;
var hamburgerMenuAnimation;
async function openHamburgerMenu() {
	// TODO: Integrate with browser history
	if (hamburgerMenuOpen) { return; }
	hamburgerMenuOpen = true;
	await tick();
	var animation = hamburgerMenu.animate({
		transform: [
			getComputedStyle(hamburgerMenu).getPropertyValue("--starting-transform") || "none",
			"none"
		],
	}, {
		duration: 400,
		fill: "backwards",
	});
	hamburgerMenuAnimation = animation;
	document.body.addEventListener("click", function detectOutsideClick(event) {
		// TODO: Detect clicks outside, stop propagation, call closeHamburgerMenu, and remove this event listener
	}, {useCapture: true});
}
function closeHamburgerMenu() {
	var animation = hamburgerMenuAnimation;
	// stop if the menu is already closing
	if (animation.playbackRate == -1) { return; }
	animation.reverse();
	animation.onfinish = () => {
		hamburgerMenuOpen = false, hamburgerMenuAnimation = null;
	};
}
</script>

<svelte:options accessors="{true}"/>
<div id="mainScreen" class="{mode}Mode" class:hamburgerMenuOpen class:mobile="{$mobile}">
	<div id="header">
		{#if $mobile}
			<button type="button" id="openHamburgerMenu" on:click="{openHamburgerMenu}"></button>
			{#if hamburgerMenuOpen}
				<div id="hamburgerMenu" bind:this={hamburgerMenu} style="position: absolute; z-index: 99;">
					<div id="actionList">
						{#each actionList as action}
							<button type="button" class="action {action}Action" class:current="{action == mode}"
								on:click="{() => useAction(action)}">{$l10n(action + "Action")}</button>
						{/each}
					</div>
					<button type="button" class="closeDeviantLove"
						on:click="{() => dispatch('closeRequested')}">{$l10n("closeDeviantLove")}</button>
					<button type="button" id="closeHamburgerMenu" on:click="{closeHamburgerMenu}"></button>
				</div>
			{/if}
		{/if}
		<div id="scanResults">
			<div id="favesLine" use:squishToFit>
				{favesLineParts[0]}<span class="dynamic">{favesLineParts[1]}</span>{favesLineParts[2]}
			</div>
			<div id="artistsLine" use:squishToFit>
				{artistsLineParts[0]}<span class="dynamic">{artistsLineParts[1]}</span>{artistsLineParts[2]}
			</div>
		</div>
	</div>
	{#if !$mobile}
		<div id="actionBar">
			{#each actionList as action}
				<button type="button" class="action {action}Action" class:current="{action == mode}"
					on:click="{() => useAction(action)}">{$l10n(action + "Action")}</button>
			{/each}
		</div>
	{/if}
	<div id="lovedArtists" style="overflow-y: auto; overflow-x: hidden; position: relative;">
		{#if mode == "normal"}
			{#if watchError}
				<div id="watchFailure" class="notice">
					{$l10n(watchError == "notLoggedIn" ? "watchErrorNotLoggedIn" : "watchErrorInternal")}
				</div>
			{/if}
			<DeviantList deviants={deviantList} {watchedArtists} bind:request={requestedDeviant}/>
		{:else if mode == "find"}
			<FindModeContent {watchedArtists} on:close="{() => mode = 'normal'}"/>
		{:else if mode == "options"}
			<button type="button" class="closeButton" on:click="{() => mode = 'normal'}">
				{$l10n("close")}</button>
			<div class="sectionHeader">{$l10n("subaccountsEditorHeader")}</div>
			<SubaccountsEditor/>
			<div class="sectionHeader">{$l10n("syncHeader")}</div>
			<SyncStatus/>
		{/if}
	</div>
	{#if mode == "normal" || !$mobile}
		<div id="tipOfTheMoment">
			<img id="totmIcon" alt="" width="16" height="16" src="/images/{$tip.icon}">
			<div id="totmText">{@html $tip.html}</div>
		</div>
	{/if}
</div>
{#if hamburgerMenuOpen}
	<div id="shield"
		 style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: 98;"></div>
{/if}