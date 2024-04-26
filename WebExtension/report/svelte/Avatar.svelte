<script>
import lookUpDeviant from "../lookUpDeviant.src.mjs"
import { onMount } from "svelte";
import { target } from "../../keyboardNavigation.src.mjs";

export let deviant;
let img;
let loading = true;

onMount(() => {
	if (deviant.avatar) {
		img.src = deviant.avatar;
	} else {
		lookUpDeviant(deviant.name).then( (results) => {
			if (!results.avatar) { throw false; }
			img.src = deviant.avatar = results.avatar;
		} ).catch( () => {
			loading = false;
		} );
	}
});
</script>

<a class="avatar {loading ? 'loading' : ''}" href="{deviant.baseURL}" use:target>
	<img bind:this={img} width="50" height="50" alt="{deviant.name}"
		on:load="{() => loading = false}" on:error="{() => loading = false}">
</a>