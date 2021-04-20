<script>
    let rows = 0;
    let columns = 0;
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
    <input type="number" name="rows" value={rows} />
    <label for="columns">Columns</label>
    <input type="number" name="columns" value={columns} />
    <button>Next</button>
</div>