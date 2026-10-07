// Potong string aman-emoji (#216): String.slice memotong UTF-16 code unit
// dan bisa membelah surrogate pair (emoji rusak di Telegram). Spread
// menghitung code point.
export function potong(s: string, n: number): string {
  if (s.length <= n) return s;
  return [...s].slice(0, n).join("");
}
