<script>
import l10n from "../../l10nStore.src.mjs";
import prefStores from "../../prefStores.src.mjs";
let {findAsYouType} = prefStores;
</script>

<div id="generalOptions">
	<label>
		<input type="checkbox" bind:checked="{$findAsYouType}">
		{$l10n("findAsYouType")}
	</label>
	<ul id="DeviantLoveLinks">
		<li id="groupLink"><a href="https://www.deviantart.com/deviantlovesoftware">Official Group</a></li>
		<li id="sponsorLink"><a href="https://ko-fi.com/pixievoltno1">Support Development</a></li>
	</ul>
</div>