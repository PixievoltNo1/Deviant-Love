<script>
import l10n from "../../l10nStore.src.mjs";
import prefStores from "../../prefStores.src.mjs";
import { target } from "../../keyboardNavigation.src.mjs";
import { miniSubaccountsEditorHelper as helper } from "../core.src.mjs";
import subaccountsEditorCore from "../../options/subaccountsEditorCore.src.mjs";
import Avatar from "./Avatar.svelte";

var {subaccounts} = prefStores;
var {edit, busy, warnings, error} = subaccountsEditorCore();
export let owner, root = undefined;
var adding = "";

$: accounts = helper.getAccountObjects( $subaccounts[owner] );

/** @type {(this: HTMLElement, event: KeyboardEvent) => void} */
function entryKeyboardNav(event) {
	let getActions = (entry) => entry.querySelector(".actions").children;
	if (event.key == "ArrowUp") {
		if (!this.previousElementSibling) {
			let eventClone = new KeyboardEvent("keydown", event);
			root.dispatchEvent(eventClone);
			event.stopPropagation();
		} else {
			let actionIndex = Array.prototype.indexOf.call(getActions(this), event.target);
			getActions(this.previousElementSibling)[actionIndex].focus();
			event.stopPropagation();
		}
	} else if (event.key == "ArrowDown") {
		if (this.nextElementSibling.matches(".entry")) {
			let actionIndex = Array.prototype.indexOf.call(getActions(this), event.target);
			getActions(this.nextElementSibling)[actionIndex].focus();
			event.stopPropagation();
		} else {
			root.querySelector(".addSubaccount input").focus();
			event.stopPropagation();
		}
	} else if (event.key == "ArrowLeft") {
		if (event.target.previousElementSibling) {
			event.target.previousElementSibling.focus();
			event.stopPropagation();
		}
	} else if (event.key == "ArrowRight") {
		if (event.target.nextElementSibling) {
			event.target.nextElementSibling.focus();
			event.stopPropagation();
		}
	}
}
function inputKeyboardNav(event) {
	if (event.key == "ArrowUp") {
		let entries = root.querySelectorAll(".entry");
		if (entries.length) {
			entries[entries.length - 1].querySelector(".profile").focus();
			event.stopPropagation();
		}
	} else if (event.key == "ArrowLeft" || event.key == "ArrowRight") {
		event.stopPropagation();
	}
}
function add() {
	edit("add", { owner, adding, success: () => { adding = ""; } });
}
function remove(event, removing) {
	edit("remove", {owner, removing});
	if (event.type == "keydown") {
		// focus target is about to be removed; choose a new one
		let simulatedKey = new KeyboardEvent("keydown", {key: "ArrowDown", bubbles: true});
		event.target.dispatchEvent(simulatedKey);
	}
}
</script>

<div class="miniSubaccountsEditor" bind:this={root}>
	{#each accounts as account (account.name)}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="entry" on:keydown={entryKeyboardNav}>
			<Avatar deviant={account} skipVerticalNav={true}/>
			<div class="name">{account.name}</div>
			<div class="actions">
				<a class="deviantLink profile" href="{account.baseURL}" use:target>{$l10n("profile")}</a>
				<a class="deviantLink gallery" href="{account.baseURL}gallery/" use:target>{$l10n("gallery")}</a>
				<button type="button" class="removeSubaccount"
					use:target={ {activate(event) { remove(event, account.name) }} }
					>{$l10n("subaccountsRemove")}</button>
			</div>
		</div>
	{:else}
		<div class="notice help">{$l10n("subaccountsEditorMiniExplain")}</div>
	{/each}
	<form class="addSubaccount textEntryLine" on:submit|preventDefault="{add}">
		<input type="text" bind:value="{adding}" required use:target on:keydown={inputKeyboardNav}
			placeholder="{$l10n('subaccountsAddNamePlaceholder')}">
		<button type="submit" class="confirmAdd skipVerticalNav" use:target>
			{$l10n("subaccountsAddConfirm")}
		</button>
	</form>
	{#if $warnings.length}
		<div class="notice warning">
			{#each $warnings as [msg, parts]}
				<p>{$l10n("subaccountsWarning" + msg, parts)}</p>
			{/each}
		</div>
	{/if}
	{#if $error}
		<div class="notice error">{$l10n("subaccountsError" + $error[0], $error[1])}</div>
	{/if}
</div>