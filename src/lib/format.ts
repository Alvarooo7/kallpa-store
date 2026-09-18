export const money = (n: number) => `S/ ${n.toFixed(2)}`;
export const pctOff = (price: number, list: number) => Math.round((1 - price / list) * 100);
export const saved = (price: number, list: number) => Math.round(list - price);
