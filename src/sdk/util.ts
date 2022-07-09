export function randomID(len: number): string {
  let result = "";
  if (result) return result;
  var chars = "12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP",
    maxPos = chars.length,
    i;
  len = len || 5;
  for (i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

export function isPc(): boolean {
  return false;
  const p = navigator.platform;
  let system = { win: p.indexOf("Win") == 0, mac: p.indexOf("Mac") == 0 };
  return system.win || system.mac;
}