<script>
import l10n from "../../l10nStore.src.mjs";
import prefStores from "../../prefStores.src.mjs";
import { submitFindQuery } from "../core.src.mjs";

export let close, showClose, autofocus = false;

let input = "";
let queryError;
let {findAsYouType} = prefStores;

$: handleInput(input);
function handleInput(query) {
	var invalidChar = query.search(/[^a-zA-Z0-9 \_\'\"\+\.\,\$\?\:\-\!\=\~\`\@\#\%\^\*\[\]\(\)\/\{\}\\\|\&]/);
	if (invalidChar != -1) {
		queryError = { errMsg: "findErrorForbiddenCharacter", parts: {char: query.charAt(invalidChar)} };
		return;
	}
	queryError = undefined;
	if ($findAsYouType && query.length != 1) { handleSubmit(); }
}
function handleSubmit() {
	if (queryError) { return; }
	if (input == "") {
		return;
	}
	submitFindQuery(input);
}
</script>

<form id="findBar" class="textEntryLine" class:findAsYouType="{$findAsYouType}"
	on:submit|preventDefault="{handleSubmit}">
	<!-- svelte-ignore a11y-autofocus -->
	<input type="text" id="query" bind:value="{input}" {autofocus}
		placeholder="{$l10n('findPlaceholder')}">
	{#if !$findAsYouType}
		<button type="submit" id="goFind">{$l10n("findGo")}</button>
	{/if}
	{#if showClose}
		<button type="button" class="closeButton" on:click={close}>
			{$l10n("close")}</button>
	{/if}
</form>
{#if queryError}
	<div id="queryError">{$l10n(queryError.errMsg, queryError.parts)}</div>
{/if}