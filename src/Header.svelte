<script>
    import { crossword, app, selectedFields } from './stores.js';

    export let name;

    function createNewCrossword() {
        app.update(() => ({ editMode: true }));
        selectedFields.update(() => ([]));
        crossword.update(() => ({
            dimensions: {}
        }));
    }
</script>

<style>
    header {
        display: flex;
        flex-flow: row;
        background-color: black;
        width: 100%;
        align-items: center;
        justify-content: center;
        max-height: 100%;
        min-height: 100px;
    }

    button {
        background-color: white;
        border: none;
        border-radius: 5px;
        display: flex;
        margin: 0;
        margin-right: 5px;
        font-weight: 700;
        font-size: 80%;
    }

    h1 {
        color: white;
        margin: 0;
        margin-right: 0.5rem;
    }
</style>

<header>
    <h1>{name}!</h1>
    <button on:click={createNewCrossword}>new</button>
    <button>load</button>
</header>
