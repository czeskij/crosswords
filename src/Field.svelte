<script>
    export let number = undefined;
    export let isPassword = false;
    export let isBlack = false;

    let style = isBlack
        ? 'background-color: black;'
        : 'background-color: white;';

</script>

<style>
    div.field {
        height: 40px;
        width: 40px;
        border-left: 1px solid black;
        border-top: 1px solid black;
        display: flex;
        flex-flow: column;
        justify-content: space-between;
    }

    div.field div.number {
        align-self: flex-start;
        font-size: 3px;
        padding: 1px;
    }

    div.field div.is-password {
        align-self: flex-end;
        width: 2px;
        height: 2px;
        padding: 1px;
        border-radius: 50%;
        background-color: black;
    }
</style>

<div {style} class="field">
    {#if !isBlack}
        {#if number}
            <div class="number">{number}</div>
        {/if}
        {#if isPassword}
            <div class="is-password"></div>
        {/if}
    {/if}
</div>