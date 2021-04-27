<script>
    import { createEventDispatcher } from 'svelte';
    import { selectedFields } from './stores.js';
    import { isFieldSelected } from './util.js';

    export let number;
    export let isPassword;
    export let isBlack;
    export let row;
    export let column;

    const dispatch = createEventDispatcher();

    $: isSelected = isFieldSelected($selectedFields, [row, column]);

    $: style = `
        background-color: ${isBlack ? 'black' : 'white'};
        z-index: ${isSelected ? '3001' : '3000'};
        box-shadow: ${isSelected ? '0 0 0px 3px red;' : 'none'};
        border-right: ${isSelected ? '1px solid black' : '1px solid transparent'};
        border-bottom: ${isSelected ? '1px solid black' : '1px solid transparent'};
        justify-content: ${isPassword && !number ? 'flex-end' : 'space-between'};
    `;
</script>

<style>
    div.field {
        height: 40px;
        width: 40px;
        border-left: 1px solid black;
        border-top: 1px solid black;
        display: flex;
        flex-flow: column;
        transition: .1s;
    }

    div.field div.number {
        align-self: flex-start;
        font-size: 12px;
        padding: 2px;
    }

    div.field div.is-password {
        align-self: flex-end;
        width: 6px;
        height: 6px;
        min-width: 6px;
        max-width: 6px;
        min-height: 6px;
        max-height: 6px;
        padding: 2px;
        margin: 2px;
        border-radius: 50%;
        background-color: black;
    }
</style>

<div {style} class="field" on:click={() => dispatch('select', [row, column])}>
    {#if !isBlack}
        {#if number}
            <div class="number">{number}</div>
        {/if}
        {#if isPassword}
            <div class="is-password"></div>
        {/if}
    {/if}
</div>