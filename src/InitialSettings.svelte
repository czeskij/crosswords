<script>
    import { app, crossword } from './stores.js';

    let rows;
    let columns;

    $: buttonDisabled = !rows || !columns;

    const initialFieldValue = {
        isBlack: false,
        isPassword: false,
        number: undefined
    }

    function cancelCrosswordCreation() {
        crossword.set({});
        app.update(prev => ({ ...prev, editMode: false }));
    }

    function continueCrosswordCreation() {
        let schema = {};

        for (let i = 0; i < rows; ++i) {
            schema[i] = {};
            for (let j = 0; j < columns; ++j) {
                schema[i][j] = {...initialFieldValue};
            }
        }

        crossword.update(prev => ({
            ...prev,
            dimensions: { rows, columns }, 
            schema
        }));
    }
</script>

<style>
    div.settings {
        display: flex;
        flex-flow: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: white;
        background-color: black;
        border: 1px dashed white;
        font-weight: 700;
        width: 100%;
    }

    button {
        margin-top: 2rem;
        font-weight: 700;
        background-color: white;
        border: 0;
        border-radius: 5px;

    }
</style>

<div class="settings">
    <label for="rows">Rows</label>
    <input type="number" name="rows" bind:value={rows} />
    <label for="columns">Columns</label>
    <input type="number" name="columns" bind:value={columns} />
    <button disabled={buttonDisabled} on:click={continueCrosswordCreation}>Continue</button>
    <button on:click={cancelCrosswordCreation}>Cancel</button>
</div>