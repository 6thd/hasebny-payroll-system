export async function convertCurrency(amount: number, from: string, to: string) {
  const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
  const data = await res.json();
  return +(amount * data.rates[to]).toFixed(2);
}
