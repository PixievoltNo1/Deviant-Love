<script>
import l10n from "../../l10nStore.esm.js";
import prefStores from "../../prefStores.esm.js";
let {findAsYouType} = prefStores;
</script>

<div id="generalOptions">
	<label>
		<input type="checkbox" bind:checked="{$findAsYouType}">
		{$l10n("findAsYouType")}
	</label>
</div>