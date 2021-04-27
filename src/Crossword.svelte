<script>
    import { crossword, selectedFields } from './stores.js';
    import Field from './Field.svelte';
    import { isFieldSelected, areFieldsEqual } from './util.js';

    function toggleSelect(event) {
        const changedField = event.detail;

        if (isFieldSelected($selectedFields, changedField)) {
            selectedFields.update(prev => prev.filter(field => !areFieldsEqual(field, changedField)));
        } else {
            selectedFields.update(prev => ([
                ...prev, changedField
            ]));
        }
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
        border: 1px dashed black;
        box-sizing: border-box;
        margin-bottom: 0.6rem;
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
