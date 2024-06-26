<script>
import { usingTouch, usingKeyboard } from "../core.src.mjs";
import Avatar from "./Avatar.svelte";
import DeviationList from "./DeviationList.svelte";
import MiniSubaccountsEditor from "./MiniSubaccountsEditor.svelte";
import anime from "animejs";
import { tick } from "svelte";
import { target } from "../../keyboardNavigation.src.mjs";

const closerLookEasing = "cubicBezier(0, 0, .6, 1)";
export let deviant, note, watchedArtists, showDeviant, closeDeviant, l10n, hasSubaccounts;
let subaccountsOpen = false;
let opened, closing, openedByNonMouse;

let /** @type {HTMLElement} */ root, /** @type {HTMLElement} */ closerLook,
	/** @type {HTMLElement} */ deviationListElem, /** @type {HTMLElement} */ subaccountsElem;
$: if (deviationListElem) { deviationListElem.inert = subaccountsOpen; }

export async function open(transition) {
	opened = true, openedByNonMouse = usingTouch || usingKeyboard;
	await tick();
	if (transition) {
		var targetHeight = getComputedStyle(closerLook).height;
		anime({
			targets: closerLook,
			height: [0, targetHeight],
			duration: 400,
			easing: closerLookEasing,
			change() {
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
			height: [getComputedStyle(closerLook).height, 0],
			duration: 400,
			easing: closerLookEasing,
			complete: () => {
				closing = false;
			},
		});
	}
}
export function getElem() { return root; }
function keyboardNav(event) {
	if (event.key == "ArrowLeft") {
		if (deviationListElem?.contains(event.target) || subaccountsElem?.contains(event.target)) {
			root.querySelector(".deviantLinks a").focus();
			event.stopPropagation();
		}
	} else if (event.key == "ArrowRight") {
		if (event.target.closest(".deviantDetails")) {
			// Navigate to the deviation list or mini subaccounts editor
			let navEvent = new KeyboardEvent("keydown", {key: "ArrowDown", bubbles: true});
			root.querySelector(".deviantDetails").dispatchEvent(navEvent);
			event.stopPropagation();
		}
	} else if (event.key == "ArrowDown") {
		if (event.target.matches(".deviantLinks :last-child")) {
			let eventClone = new KeyboardEvent("keydown", event);
			closerLook.dispatchEvent(eventClone);
			event.stopPropagation();
		}
	}
}
function activateHeader(event) {
	if (!opened) {
		showDeviant(deviant.name);
	} else if (event.type == "keydown") {
		closeDeviant();
	}
}
function toggleSubaccounts() {
	if (!subaccountsOpen) {
		subaccountsOpen = true;
		showDeviant(deviant.name);
	} else {
		subaccountsOpen = false;
	}
}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="deviant" class:open={opened} id="deviant_{deviant.name}" bind:this={root} on:keydown={keyboardNav}>
	<div class="deviantHeader" use:target={ {activate: activateHeader} }>
		{#if note}
			<div class="deviantNote">{l10n(...note)}</div>
		{/if}
		{#if watchedArtists}
			{#if watchedArtists.has(deviant.name)}
				<div class="artWatch true" title="{l10n('artWatched')}">&nbsp;</div>
			{:else}
				<div class="artWatch" title="{l10n('artNotWatched')}">&nbsp;</div>
			{/if}
		{/if}
		<span class="deviantFaves">{deviant.deviations.length}</span>
		<span class="deviantName">{deviant.name}</span>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="subaccountsButton mini" on:click|stopPropagation="{toggleSubaccounts}"
			class:has="{hasSubaccounts}" class:editing="{subaccountsOpen}"
			title="{l10n(subaccountsOpen ? 'subaccountsClose' : 'subaccountsOpen')}">&nbsp;</div>
	</div>
	{#if opened || closing}
		<div bind:this={closerLook} class="closerLook" style="overflow: hidden; height: auto;">
			{#if openedByNonMouse}
				<div class="touchBar">
					{#if watchedArtists}
						{#if watchedArtists.has(deviant.name)}
							<div class="artWatchHint true">{l10n('artWatched')}</div>
						{:else}
							<div class="artWatchHint">{l10n('artNotWatched')}</div>
						{/if}
					{/if}
					<div class="subaccountsButton touch" use:target="{ {activate: toggleSubaccounts} }"
						class:has="{hasSubaccounts}" class:editing="{subaccountsOpen}"
						>{l10n(subaccountsOpen ? 'subaccountsClose' : 'subaccountsOpen')}</div>
				</div>
			{/if}
			<div class="deviantDetails skipVerticalNav">
				<Avatar {deviant} skipVerticalNav={true}/>
				<div class="deviantLinks">
					<a class="deviantLink profile" href="{deviant.baseURL}" use:target
						>{l10n("profile")}</a>
					<a class="deviantLink gallery" href="{deviant.baseURL}gallery/" use:target
						>{l10n("gallery")}</a>
					<a class="deviantLink favourites" href="{deviant.baseURL}favourites/" use:target
						>{l10n("favourites")}</a>
				</div>
			</div>
			<DeviationList deviations={deviant.deviations} bind:root={deviationListElem}/>
			{#if subaccountsOpen}
				<MiniSubaccountsEditor owner={deviant.name} bind:root={subaccountsElem}/>
			{/if}
		</div>
	{/if}
</div>