export function convertToFormattedPrize(prize: string | number | undefined) {
    // To prevent conflicts from what type of data the API sends. The intended data type should be number.
    if (typeof prize !== "number") {
        return prize;
    }
    if (prize < 100000)
        return `₹${new Intl.NumberFormat("en-IN").format(prize)}`;
    if (prize < 10000000) {
        const value = prize / 100000;
        const formatted = Number(value.toFixed(2));
        return `₹${formatted}L`;
    }
    const value = prize / 10000000;
    const formatted = Number(value.toFixed(2));
    return `₹${formatted}Cr`;
}
