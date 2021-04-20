<script>
    import { app, crossword } from './stores.js';

    let rows = 0;
    let columns = 0;

    function cancelCrosswordCreation() {
        crossword.set({});
        app.update(() => ({ editMode: false }));
    }

    function continueCrosswordCreation() {
        crossword.set({
            dimensions: { rows, columns },
            structure: []
        })
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
    <button on:click={continueCrosswordCreation}>Continue with {rows}x{columns} field</button>
    <button on:click={cancelCrosswordCreation}>Cancel</button>
</div>