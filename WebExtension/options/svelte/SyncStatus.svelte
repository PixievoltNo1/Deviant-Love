<script>
import l10n from "../../l10nStore.src.mjs";
import { subscribeToSyncStatus } from "../../apiAdapter.src.mjs";
let status = {};
let overall = "checking";
let lastSavedDisplay;
subscribeToSyncStatus((newStatus) => {
	status = newStatus;
	overall = Boolean(status.unsupported || status.syncError) ? "error" : "ok";
	if (status.lastSaved) {
		lastSavedDisplay = (new Date(status.lastSaved)).toLocaleString();
	}
});
</script>
<div id="syncStatus" class="{overall}">
	{#if status.unsupported}
		<p>{$l10n("syncByBrowserUnsupported")}</p>
	{:else if overall != "checking" && !status.syncError}
		<p>{$l10n("syncByBrowserOK")}</p>
		<p>{$l10n("syncLastSaved", {date: lastSavedDisplay})}</p>
	{:else if status.syncError}
		<p>{$l10n("syncByBrowserError", {err: status.syncError})}</p>
		{#if status.lastSaved}
			<p>{$l10n("syncLastSuccessfulSync", {date: lastSavedDisplay})}</p>
		{/if}
	{/if}
</div>