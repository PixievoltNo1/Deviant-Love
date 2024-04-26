<script context="module">
import { storageArea, getL10nMsg } from "../../apiAdapter.esm";
import { writable } from "svelte/store";
var tip = writable();
export async function nextTip() {
	var [{nextTip}, tips] = await Promise.all([
		storageArea.get({nextTip: -1}),
		fetch( getL10nMsg("fileTipOfTheMoment") ).then( (request) => request.json() ),
	]);
	nextTip++;
	if (nextTip >= tips.length) {nextTip = 0;};
	tip.set(tips[nextTip]);
	storageArea.set({nextTip});
}
</script>
<div id="tipOfTheMoment">
	<img id="totmIcon" alt="" width="16" height="16" src="/images/{$tip.icon}">
	<div id="totmText">{@html $tip.html}</div>
</div>