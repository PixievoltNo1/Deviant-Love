<script>
import { onMount } from "svelte";
import SubaccountOwner from "./SubaccountOwner.svelte";
import subaccountsEditorCore from "../subaccountsEditorCore.src.mjs";
import l10n from "../../l10nStore.src.mjs";
import prefStores from "../../prefStores.src.mjs";

var {subaccounts} = prefStores;
var {edit, busy, warnings, error} = subaccountsEditorCore();
var showNewOwnerForm, newOwner, firstSubaccount;
function addOwner() {
	edit("newOwner", { newOwner, firstSubaccount, success() { showNewOwnerForm = false; } });
}
</script>

<div id="subaccountsEditor" class:busy="{$busy}">
	{#each Object.entries($subaccounts) as [owner, owned] (owner)}
		<SubaccountOwner {owner} {owned} {edit}/>
	{:else}
		<div id="subaccountsEditorExplainer" class="notice">{$l10n("subaccountsEditorExplain")}</div>
	{/each}
	{#if !showNewOwnerForm}
		<button type="button" class="openNewOwner"
			on:click="{ () => {showNewOwnerForm = true; newOwner = firstSubaccount = '';} }">
			{$l10n("subaccountsEditorAddMainAccount")}
		</button>
	{:else}
		<form class="subaccountOwner new" on:submit|preventDefault="{addOwner}">
			<div class="accountLine ownerLine">
				<span class="name">
					<!-- svelte-ignore a11y-autofocus -->
					<input bind:value="{newOwner}" required autofocus
						placeholder="{$l10n('subaccountsEditorOwnerPlaceholder')}">
				</span>
				<button type="button" tabindex="-1" class="cancelOwner"
					on:click="{ () => {showNewOwnerForm = false;} }">
					{$l10n("subaccountsEditorCancelOwner")}
				</button>
			</div>
			<div class="actionLine">
				<input bind:value="{firstSubaccount}" required
					placeholder="{$l10n('subaccountsEditorAddPlaceholder')}">
				<button type="submit">{$l10n("subaccountsAddConfirm")}</button>
			</div>
		</form>
	{/if}
</div>
{#if $warnings.length}
	<div class="subaccountsMessage warning">
		{#each $warnings as [msg, parts]}
			<p>{$l10n("subaccountsWarning" + msg, parts)}</p>
		{/each}
	</div>
{/if}
{#if $error}
	<div class="subaccountsMessage error">{$l10n("subaccountsError" + $error[0], $error[1])}</div>
{/if}