<script>
	import Header from './Header.svelte';
	import Settings from './Settings.svelte';
	const name = 'crosswords';
</script>

<style>
	div {
		background-color: white;
		display: flex;
		flex-flow: column;
		align-items: flex-start;
		justify-content: flex-start;
		height: 100%;
	}
</style>

<div>
	<Header {name} />
	<Settings />
</div>
