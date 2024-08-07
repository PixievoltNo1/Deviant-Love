<script>
import l10n from "../../l10nStore.src.mjs";
import { makeNavRoot } from "../../keyboardNavigation.src.mjs";
import { mobile, visible } from "../environment.src.mjs";
import DeviantList from "./DeviantList.svelte";
import FindBar from "./FindBar.svelte";
import FindModeContent from "./FindModeContent.svelte";
import TipOfTheMoment from "./TipOfTheMoment.svelte";
import GeneralOptions from "../../options/svelte/GeneralOptions.svelte";
import SubaccountsEditor from "../../options/svelte/SubaccountsEditor.svelte";
import SyncStatus from "../../options/svelte/SyncStatus.svelte";
import squishToFit from "../squishToFit.src.mjs";
import { createEventDispatcher, tick } from 'svelte';

const dispatch = createEventDispatcher();

export let totalDeviations, pageType, deviantList, watchError, watchedArtists;
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
var hamburgerMenuClosing;
var hamburgerMenuAnimation;
const hamburgerMenuEasing = "cubic-bezier(0, 0, .6, 1)";
async function openHamburgerMenu() {
	if (hamburgerMenuOpen) { return; }
	hamburgerMenuOpen = true;
	history.pushState({hamburgerMenu: true}, "");
	window.addEventListener("popstate", closeHamburgerMenu);
	await tick();
	var animation = hamburgerMenu.animate({
		transform: [
			getComputedStyle(hamburgerMenu).getPropertyValue("--starting-transform") || "none",
			"none"
		],
	}, {
		duration: 400,
		easing: hamburgerMenuEasing,
		fill: "backwards",
	});
	hamburgerMenuAnimation = animation;
}
function closeHamburgerMenu() {
	if (hamburgerMenuClosing) { return; }
	hamburgerMenuClosing = true;
	window.removeEventListener("popstate", closeHamburgerMenu);
	if (typeof history.state == "object" && history.state.hamburgerMenu) {
		history.back();
	}
	var oldTransform = getComputedStyle(hamburgerMenu).transform;
	hamburgerMenuAnimation.cancel();
	var animation = hamburgerMenu.animate({
		transform: [
			oldTransform,
			getComputedStyle(hamburgerMenu).getPropertyValue("--starting-transform") || "none"
		],
	}, {
		duration: 400,
		easing: hamburgerMenuEasing,
		fill: "backwards",
	});
	animation.onfinish = () => {
		hamburgerMenuOpen = false, hamburgerMenuClosing = false, hamburgerMenuAnimation = null;
	};
}
$: if ( hamburgerMenuOpen && (!$visible || !$mobile) ) {
	hamburgerMenuOpen = false, hamburgerMenuClosing = false, hamburgerMenuAnimation = null;
	if (history.state == hamburgerMenuHistoryState) {
		history.back();
	}
}

let normalDeviantList;
export async function showDeviantInMain(deviantName) {
	if (mode != "normal") {
		mode = "normal";
		await tick();
	}
	let result = normalDeviantList.showDeviant(deviantName);
	if (result == "alreadyOpened") {
		normalDeviantList.registry[deviantName].scrollIntoView();
	}
}
</script>

<svelte:options accessors="{true}"/>
<div id="mainScreen" class:hamburgerMenuOpen class:mobile="{$mobile}">
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
		{:else}
			<button type="button" class="action optionsAction" class:current="{'options' == mode}"
				on:click="{() => useAction('options')}"></button>
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
		<FindBar close="{() => mode = 'normal'}" showClose={mode == "find"}/>
	{/if}

	{#if mode == "normal"}
		<div class="lovedArtists mainContent" style="overflow: hidden auto; contain: strict;" use:makeNavRoot>
			{#if watchError}
				<div id="watchFailure" class="notice">
					{$l10n(watchError == "notLoggedIn" ? "watchErrorNotLoggedIn" : "watchErrorInternal")}
				</div>
			{/if}
			<DeviantList deviants={deviantList} {watchedArtists} bind:this={normalDeviantList}/>
		</div>
	{:else if mode == "find"}
		{#if $mobile}
			<FindBar close="{() => mode = 'normal'}" showClose={true} autofocus={true}/>
		{/if}
		<FindModeContent {watchedArtists} {showDeviantInMain}/>
	{:else if mode == "options"}
		<div class="optionsMode mainContent" style="overflow: hidden auto;">
			<button type="button" class="closeButton" on:click="{() => mode = 'normal'}">
				{$l10n("close")}</button>
			<div class="sectionHeader">{$l10n("generalOptionsHeader")}</div>
			<GeneralOptions/>
			<div class="sectionHeader">{$l10n("subaccountsEditorHeader")}</div>
			<SubaccountsEditor/>
			<div class="sectionHeader">{$l10n("syncHeader")}</div>
			<SyncStatus/>
		</div>
	{/if}

	{#if mode == "normal" || !$mobile}
		<TipOfTheMoment/>
	{/if}
</div>
{#if hamburgerMenuOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div id="shield" on:click="{closeHamburgerMenu}"
		 style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: 98;"></div>
{/if}