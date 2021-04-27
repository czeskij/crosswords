<script>
    import { crossword, selectedFields } from './stores.js';

    function areAllFieldsBlack(fields) {
        return fields.every(field => {
            const [row, column] = field;
            return $crossword.schema[row][column].isBlack;
        })
    }

    function areAllFieldsWhite(fields) {
        return fields.every(field => {
            const [row, column] = field;
            return !$crossword.schema[row][column].isBlack;
        });
    }

    $: areFieldsBlack = areAllFieldsBlack($selectedFields);
    $: areFieldsIndeterminate = !areAllFieldsBlack($selectedFields) && !areAllFieldsWhite($selectedFields);
    
    let isBlackCheckbox;

    $: if (areFieldsIndeterminate) {
        isBlackCheckbox.indeterminate = true;
    }
    
    function toggleBlack() {
        if (areFieldsIndeterminate) {
            return $selectedFields.forEach(field => {
                const [row, column] = field;
                crossword.update(prev => ({
                    ...prev,
                    schema: {
                        ...prev.schema,
                        [row]: {
                            ...prev.schema[row],
                            [column]: {
                                ...prev.schema[row][column],
                                isBlack: true
                            }
                        }
                    }
                }));
            });
        }    
        
        return $selectedFields.forEach(field => {
            const [row, column] = field;
            crossword.update(prev => ({
                ...prev,
                schema: {
                    ...prev.schema,
                    [row]: {
                        ...prev.schema[row],
                        [column]: {
                            ...prev.schema[row][column],
                            isBlack: !prev.schema[row][column].isBlack
                        }
                    }
                }
            }));
        });
    }

    function deselectAll() {
        selectedFields.set([]);
    }
</script>

<style>
    div.field-settings {
        display: flex;
        flex-flow: row;
        align-items: center;
        justify-content: space-evenly;
        min-height: 100px;
        width: 100%;
        border: 1px dashed black;
        box-sizing: border-box;
    }

    div.field-settings div.setting {
        display: flex;
        flex-flow: column;
        justify-content: center;
        align-items: center;
    }
</style>

<div class="field-settings">
    {#if $selectedFields.length === 1}
        <div class="setting">
            <label for="field-number">Number</label>
            <input 
            type="number" 
            name="field-number"
            bind:value={$crossword.schema[$selectedFields[0][0]][$selectedFields[0][1]].number} />
        </div>
        <div class="setting">
            <label for="is-password">Is for password?</label>
            <input 
            type="checkbox" 
            name="is-password"
            bind:checked={$crossword.schema[$selectedFields[0][0]][$selectedFields[0][1]].isPassword} />
        </div>
    {/if}
    {#if $selectedFields.length >= 1}
        <div class="setting">
            <label for="is-black">Is field black?</label>
            <input 
                type="checkbox" 
                name="is-black" 
                on:change={toggleBlack}
                bind:this={isBlackCheckbox}
                value={areFieldsBlack} />
        </div>
        <button on:click={deselectAll}>Deselect</button>
    {/if}
</div>