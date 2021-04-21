<script>
    import { crossword } from './stores.js';
    import { onMount } from 'svelte';
    import Field from './Field.svelte';

    onMount(() => {
        console.log($crossword);
    });    
</script>

<style>
    div.crossword-editor {
        display: flex;
        flex-flow: row;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        border: 1px dotted black;
    }
    div.crossword-editor div.crossword {
        display: flex;
        flex-flow: column;
        border-bottom: 1px solid black;
        border-right: 1px solid black;
    }
    div.crossword-editor div.crossword div.field-group {
        display: flex;
        flex-flow: row;
    }
</style>

<div class="crossword-editor">
    <div class="crossword">
        {#if Object.keys($crossword.schema).length > 0}
            {#each Object.keys($crossword.schema) as rowKey}
                <div class="field-group">
                    {#each Object.keys($crossword.schema[rowKey]) as columnKey}
                        <Field 
                            isBlack={$crossword.schema[rowKey][columnKey].isBlack}
                            isPassword={$crossword.schema[rowKey][columnKey].isPassword}
                            number={$crossword.schema[rowKey][columnKey].number} 
                        />
                    {/each}
                </div>
            {/each}
        {/if}
    </div>
</div>
