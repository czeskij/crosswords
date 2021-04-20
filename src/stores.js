import { writable } from "svelte/store";

export const app = writable({
    editMode: false
});

export const crossword = writable({});