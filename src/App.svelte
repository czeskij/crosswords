<script>
	import Crossword from './Crossword.svelte';
import FieldSettings from './FieldSettings.svelte';
	import Header from './Header.svelte';
	import InitialSettings from './InitialSettings.svelte';
	import { crossword, app, selectedFields } from './stores.js';

	const name = 'crosswords';

	
</script>

<style>
	div {
		background-color: white;
		display: flex;
		flex-flow: column;
		align-items: flex-start;
		justify-content: center;
		height: 100%;
	}
</style>

<div>
	<Header {name} />
	{#if $app.editMode && !$crossword.schema}
		<InitialSettings />
	{/if}
	{#if $app.editMode && $crossword.schema}
		<Crossword />
		<FieldSettings />
	{/if}

</div>
