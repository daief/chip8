/**
 * 模拟屏幕，chip8 的显示分辨率为 64 * 32
 */
export class Display {
  /**
   * 兼容 chip8 的显示分辨率
   */
  rows = 64;
  columns = 128;
  /** 分辨率 */
  resolution: number = 0;

  /**
   * 传统的 Chip8 使用内存的 0xF00 ~ 0xFFF 用作屏幕缓存，这里用另外的空间来模拟
   */
  bitMap: (0 | 1)[] = [];

  constructor() {
    this.resolution = this.rows * this.columns;
    this.bitMap = new Array(this.resolution).fill(0);
  }

  clear() {
    this.bitMap.fill(0);
  }

  setPixel(x: number, y: number, value: 0 | 1) {
    const index = this.getIndex(x, y);
    this.bitMap[index] = value;
  }

  getPixel(x: number, y: number) {
    return this.bitMap[this.getIndex(x, y)];
  }

  getIndex(x: number, y: number) {
    return y * this.columns + x;
  }
}
