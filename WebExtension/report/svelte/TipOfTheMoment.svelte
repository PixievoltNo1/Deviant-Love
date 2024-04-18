<script context="module">
import { store, retrieve, getL10nMsg } from "../../apiAdapter.esm";
import { writable } from "svelte/store";
var tip = writable();
export async function nextTip() {
	var [nextTip, tips] = await Promise.all([
		retrieve("nextTip").then( (result) => { return result.nextTip || 0; } ),
		fetch( getL10nMsg("fileTipOfTheMoment") ).then( (request) => request.json() ),
	]);
	tip.set(tips[nextTip]);
	nextTip++;
	if (nextTip >= tips.length) {nextTip = 0;};
	store("nextTip", nextTip);
}
</script>
<div id="tipOfTheMoment">
	<img id="totmIcon" alt="" width="16" height="16" src="/images/{$tip.icon}">
	<div id="totmText">{@html $tip.html}</div>
</div>