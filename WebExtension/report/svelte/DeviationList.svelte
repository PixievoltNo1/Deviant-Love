<script>
export let deviations;
</script>
<div class="deviationList">
	{#each deviations as deviation (deviation.URL)}
		<div class="deviation"><a href="{deviation.URL}">{deviation.name}</a></div>
	{/each}
</div>