// prettier-ignore
export const KEY_MAP: Record<string, number> = {
  1: 0x1, 2: 0x2, 3: 0x3, 4: 0xc,
  q: 0x4, w: 0x5, e: 0x6, r: 0xd,
  a: 0x7, s: 0x8, d: 0x9, f: 0xe,
  z: 0xa, x: 0x0, c: 0xb, v: 0xf,
};

export class Keyboard {
  readonly KEY_MAP = KEY_MAP;

  /** 按键缓存，16 个长度，按下为 1、未按为 0 */
  keysBuff = new Uint8Array(16);

  keyDown(key: string): boolean {
    key = key.toLowerCase();
    const mappedKey = KEY_MAP[key];
    if (typeof mappedKey !== 'undefined') {
      this.keysBuff[mappedKey] = 1;
      return true;
    }

    return false;
  }

  keyUp(key: string): boolean {
    key = key.toLowerCase();
    const mappedKey = KEY_MAP[key];
    if (typeof mappedKey !== 'undefined') {
      this.keysBuff[mappedKey] = 0;
      return true;
    }

    return false;
  }

  reset() {
    this.keysBuff.fill(0);
  }
}
