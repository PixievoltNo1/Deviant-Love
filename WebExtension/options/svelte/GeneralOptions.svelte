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
	<ul id="DeviantLoveLinks">
		<li id="groupLink"><a href="https://www.deviantart.com/deviantlovesoftware">Official Group</a></li>
		<li id="sponsorLink"><a href="https://sponsus.org/u/pixievoltno1">Support Development</a></li>
	</ul>
</div>