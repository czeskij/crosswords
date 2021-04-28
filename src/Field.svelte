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
    `;

    $: passwordDotStyle = `
        top: ${number ? '10px' : '25px'};
    `;
</script>

<style>
    div.field {
        height: 40px;
        width: 40px;
        border-left: 1px solid black;
        border-top: 1px solid black;
        transition: .1s;
    }

    div.field div.number {
        position: relative;
        top: 2px;
        left: 2px;
        font-size: 12px;
    }

    div.field div.is-password {
        position: relative;
        left: 25px;
        width: 10px;
        height: 10px;
        min-width: 10px;
        max-width: 10px;
        min-height: 10px;
        max-height: 10px;
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
            <div style={passwordDotStyle} class="is-password"></div>
        {/if}
    {/if}
</div>