export function formatVND(amount: number): string {
  if (!amount || amount === 0) return '0 VND';
  let val = Number(amount);
  if (isNaN(val)) return '0 VND';
  if (val < 10000) {
    val = val * 1000;
  }
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND';
}
