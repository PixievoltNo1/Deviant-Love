<script>
import l10n from "../../l10nStore.esm.js";
import prefStores from "../../prefStores.esm.js";
import { miniSubaccountsEditorHelper as helper } from "../core.esm.js";
import subaccountsEditorCore from "../../options/subaccountsEditorCore.esm.js";
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
				<a class="deviantLink profile" href="{account.baseURL}">{$l10n("profile")}</a>
				<a class="deviantLink gallery" href="{account.baseURL}gallery/">{$l10n("gallery")}</a>
				<button type="button" class="removeSubaccount" on:click="{() => remove(account.name)}">
					{$l10n("subaccountsRemove")}
				</button>
			</div>
		</div>
	{:else}
		<div class="notice help">{$l10n("subaccountsEditorMiniExplain")}</div>
	{/each}
	<form class="addSubaccount textEntryLine" on:submit|preventDefault="{add}">
		<input type="text" bind:value="{adding}" required
			placeholder="{$l10n('subaccountsAddNamePlaceholder')}">
		<button type="submit" class="confirmAdd">
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