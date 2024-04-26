<script>
import l10n from "../../l10nStore.src.mjs";
import prefStores from "../../prefStores.src.mjs";
import { target } from "../../keyboardNavigation.src.mjs";
import { miniSubaccountsEditorHelper as helper } from "../core.src.mjs";
import subaccountsEditorCore from "../../options/subaccountsEditorCore.src.mjs";
import Avatar from "./Avatar.svelte";

var {subaccounts} = prefStores;
var {edit, busy, warnings, error} = subaccountsEditorCore();
export let owner;
var adding = "";

$: accounts = helper.getAccountObjects( $subaccounts[owner] );

function add() {
	edit("add", { owner, adding, success: () => { adding = ""; } });
}
function remove(removing) {
	edit("remove", {owner, removing});
}
</script>

<div class="miniSubaccountsEditor">
	{#each accounts as account (account.name)}
		<div class="entry">
			<Avatar deviant={account} />
			<div class="name">{account.name}</div>
			<div class="actions">
				<a class="deviantLink profile" href="{account.baseURL}" use:target>{$l10n("profile")}</a>
				<a class="deviantLink gallery" href="{account.baseURL}gallery/" use:target>{$l10n("gallery")}</a>
				<button type="button" class="removeSubaccount" use:target={ {activate() { remove(account.name) }} }>
					{$l10n("subaccountsRemove")}
				</button>
			</div>
		</div>
	{:else}
		<div class="notice help">{$l10n("subaccountsEditorMiniExplain")}</div>
	{/each}
	<form class="addSubaccount textEntryLine" on:submit|preventDefault="{add}">
		<input type="text" bind:value="{adding}" required use:target
			placeholder="{$l10n('subaccountsAddNamePlaceholder')}">
		<button type="submit" class="confirmAdd" use:target>
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