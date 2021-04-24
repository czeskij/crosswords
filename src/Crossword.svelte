<script>
    import { crossword } from './stores.js';
    import Field from './Field.svelte';

    function toggleSelect(event) {
        const { row, column } = event.detail;
        const isSomeSelected = Object.keys($crossword.schema)

        if (Object.keys(cross))

        crossword.update(prev => ({
            ...prev,
            schema: {
                ...prev.schema,
                [row]: {
                    ...prev.schema[row],
                    [column]: {
                        ...prev.schema[row][column],
                        isSelected: !prev.schema[row][column].isSelected
                    }
                }
            }
        }));
    }
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
                            {...$crossword.schema[rowKey][columnKey]}
                            row={rowKey}
                            column={columnKey}
                            on:select={toggleSelect}
                        />
                    {/each}
                </div>
            {/each}
        {/if}
    </div>
</div>
