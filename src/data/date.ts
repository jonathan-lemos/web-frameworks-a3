export const dateToNumber = (d: Date) => Math.floor(d.getTime() / 1000);

export const numberToDate = (n: number) => new Date(n * 1000);