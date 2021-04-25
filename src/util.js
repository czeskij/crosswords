export function areFieldsEqual(first, second) {
    return first.every((value, index) => value === second[index]);
}

export function isFieldSelected(fields, changedField) {
    return fields.some(field => areFieldsEqual(field, changedField));
}