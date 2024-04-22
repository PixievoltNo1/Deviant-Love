<script>
import { target } from "../../keyboardNavigation.esm";
export let deviations;
export let root = undefined;
</script>
<div class="deviationList" bind:this={root}>
	{#each deviations as deviation (deviation.URL)}
		<div class="deviation"><a href="{deviation.URL}" use:target>{deviation.name}</a></div>
	{/each}
</div>