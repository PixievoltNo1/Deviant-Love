<script>
import l10n from "../../l10nStore.esm.js";
import { mobile, usingTouch } from "../core.esm.js";
import prefStores from "../../prefStores.esm.js";
import Avatar from "./Avatar.svelte";
import DeviationList from "./DeviationList.svelte";
import MiniSubaccountsEditor from "./MiniSubaccountsEditor.svelte";
import anime from "animejs";
import { createEventDispatcher, tick } from 'svelte';

var {subaccounts} = prefStores;
const dispatch = createEventDispatcher();

const closerLookEasing = [0, 0, .6, 1];
export let deviant, note, watchedArtists;
export let subaccountsOpen;
var opened, closing, openedByTouch;

var root, closerLook;

export async function open(transition) {
	opened = true, openedByTouch = $usingTouch;
	await tick();
	if (transition) {
		var targetHeight = getComputedStyle(closerLook).height;
		anime({
			targets: closerLook,
			height: [0, targetHeight],
			duration: 400,
			easing: closerLookEasing,
			run: () => {
				var openedDeviantElem = root;
				var containerElem = openedDeviantElem.offsetParent;
				var scroll = containerElem.scrollTop;
				if (scroll + containerElem.clientHeight <
					openedDeviantElem.offsetTop + openedDeviantElem.offsetHeight) {
					scroll = openedDeviantElem.offsetTop + openedDeviantElem.offsetHeight
						- containerElem.clientHeight;
				}
				if (scroll > openedDeviantElem.offsetTop) {
					scroll = openedDeviantElem.offsetTop;
				}
				containerElem.scrollTop = scroll;
			},
			complete() {
				closerLook.style.height = "auto";
			}
		});
	} else {
		root.scrollIntoView();
	}
}
export function close(transition) {
	opened = false, closing = transition, subaccountsOpen = false;
	if (transition) {
		anime({
			targets: closerLook,
			height: 0,
			duration: 400,
			easing: closerLookEasing,
			complete: () => {
				closing = false;
			},
		});
	}
}
export function scrollIntoView() {
	root.scrollIntoView();
}
function toggleSubaccounts() {
	if (!subaccountsOpen) {
		subaccountsOpen = true;
		dispatch("openMe");
	} else {
		subaccountsOpen = false;
	}
}
</script>

<div class="deviant" class:open={opened} class:openedByTouch id="deviant_{deviant.name}" bind:this={root}>
	<div class="deviantHeader" on:click="{() => dispatch('openMe')}">
		{#if note}
			<div class="deviantNote">{$l10n(...note)}</div>
		{/if}
		{#if watchedArtists}
			{#if watchedArtists.has(deviant.name)}
				<div class="artWatch true" title="{$l10n('artWatched')}">&nbsp;</div>
			{:else}
				<div class="artWatch" title="{$l10n('artNotWatched')}">&nbsp;</div>
			{/if}
		{/if}
		<span class="deviantFaves">{deviant.deviations.length}</span>
		<span class="deviantName">{deviant.name}</span>
		<div class="subaccountsButton mini" on:click|stopPropagation="{toggleSubaccounts}"
			class:has="{deviant.name in $subaccounts}" class:editing="{subaccountsOpen}"
			title="{$l10n(subaccountsOpen ? 'subaccountsClose' : 'subaccountsOpen')}">&nbsp;</div>
	</div>
	{#if opened || closing}
		<div bind:this={closerLook} class="closerLook" style="overflow: hidden; height: auto;">
			{#if openedByTouch}
				<div class="touchBar">
					{#if watchedArtists}
						{#if watchedArtists.has(deviant.name)}
							<div class="artWatchHint true">{$l10n('artWatched')}</div>
						{:else}
							<div class="artWatchHint">{$l10n('artNotWatched')}</div>
						{/if}
					{/if}
					<div class="subaccountsButton touch" on:click="{toggleSubaccounts}"
						class:has="{deviant.name in $subaccounts}" class:editing="{subaccountsOpen}"
						>{$l10n(subaccountsOpen ? 'subaccountsClose' : 'subaccountsOpen')}</div>
				</div>
			{/if}
			<div class="deviantDetails">
				<Avatar {deviant}/>
				<div class="deviantLinks">
					<a class="deviantLink profile" href="{deviant.baseURL}">{$l10n("profile")}</a>
					<a class="deviantLink gallery" href="{deviant.baseURL}gallery/">{$l10n("gallery")}</a>
					<a class="deviantLink favourites" href="{deviant.baseURL}favourites/">{$l10n("favourites")}</a>
				</div>
			</div>
			<DeviationList deviations={deviant.deviations}/>
			{#if subaccountsOpen}
				<MiniSubaccountsEditor owner={deviant.name} />
			{/if}
		</div>
	{/if}
</div>