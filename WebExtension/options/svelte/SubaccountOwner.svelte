<script>
import l10n from "../../l10nStore.src.mjs";
export let owner, owned, edit;
let mode = "normal";
let showAddSubaccount, adding, newOwner;

function addSubaccount() {
	edit("add", { owner, adding, success() { showAddSubaccount = false; } });
}
function changeOwner() {
	if (newOwner == "$noChange") {
		mode = "normal";
	} else {
		edit("changeOwner", {from: owner, to: newOwner});
		// this object will be destroyed & replaced
	}
}
</script>

<div class="subaccountOwner" class:changeOwner="{mode == 'changeOwner'}">
	{#if mode == "normal"}
		<div class="accountLine ownerLine">
			<span class="name">{owner}</span>
			<button type="button" class="changeMainAccount"
				on:click="{() => { mode = 'changeOwner'; newOwner = '$noChange'; }}">
				{$l10n("subaccountsEditorChangeMain")}
			</button>
		</div>
		{#each owned as subaccount}
			<div class="accountLine subaccountLine">
				<span class="name">{subaccount}</span>
				<button type="button" class="removeSubaccount"
					on:click="{() => edit('remove', {owner, removing: subaccount})}">
					{$l10n("subaccountsRemove")}</button>
			</div>
		{/each}
		<div class="actionLine">
			{#if !showAddSubaccount}
				<button type="button" class="addSubaccount"
					on:click="{ () => { showAddSubaccount = true; adding = ''; } }">
					{$l10n("subaccountsEditorAddSubaccount")}
				</button>
			{:else}
				<form class="addSubaccountForm" on:submit|preventDefault="{addSubaccount}">
					<!-- svelte-ignore a11y-autofocus -->
					<input bind:value="{adding}" required autofocus
						placeholder="{$l10n('subaccountsEditorAddPlaceholder')}">
					<button type="submit">{$l10n("subaccountsAddConfirm")}</button>
				</form>
			{/if}
		</div>
	{:else if mode == "changeOwner"}
		<form class="changeOwnerForm" on:submit|preventDefault="{changeOwner}">
			<div class="accountLine ownerLine"><label>
				<input type="radio" name="newOwner" bind:group="{newOwner}" value="$noChange">
				<span class="name">{owner}</span>
			</label></div>
			{#each owned as subaccount}
				<div class="accountLine"><label>
					<input type="radio" name="newOwner" bind:group="{newOwner}" value="{subaccount}">
					<span class="name">{subaccount}</span>
				</label></div>
			{/each}
			<div class="actionLine">
				<button type="submit">{$l10n("subaccountsEditorConfirmMainChange")}</button>
			</div>
		</form>
	{/if}
</div>