import { createChip8, KEY_MAP } from 'chip8_js';

interface IOut {
  isDrawFlag: () => boolean;
  setDrawFlag: (flag: boolean) => void;
  columns: () => number;
  rows: () => number;
  highRes: () => boolean;
  getPixel: (x: number, y: number) => boolean;
  rate: () => number;
  cycle: VoidFunction;
  ticker: VoidFunction;
  keyDown: (key: string) => boolean;
  keyUp: (key: string) => boolean;
  reset: VoidFunction;
  loadRom: (rom: Uint8Array) => void;
  toggleRunning: () => boolean;
  resetKeys: VoidFunction;
  soundTimer: () => number;
}

async function js(): Promise<IOut> {
  const chip8 = createChip8();
  return {
    isDrawFlag: () => chip8.cpu.drawFlag,
    setDrawFlag: (flag: boolean) => {
      chip8.cpu.drawFlag = flag;
    },
    columns: () => chip8.display.columns,
    rows: () => chip8.display.rows,
    highRes: () => chip8.highRes,
    getPixel: (x: number, y: number) => !!chip8.display.getPixel(x, y),
    rate: () => chip8.RATE,
    cycle: () => chip8.cpu.cycle(),
    ticker: () => chip8.cpu.ticker(),
    keyDown: (key: string) => chip8.keyboard.keyDown(key),
    keyUp: (key: string) => chip8.keyboard.keyUp(key),
    reset: () => chip8.reset(),
    loadRom: (rom: Uint8Array) => chip8.loadRom(rom),
    toggleRunning: () => chip8.toggleRunning(),
    resetKeys: () => chip8.keyboard.reset(),
    soundTimer: () => chip8.cpu.soundTimer,
  };
}

async function wasm(): Promise<IOut> {
  const wasmModule = await import('chip8_rust');
  await wasmModule.default();
  const chip8 = new wasmModule.Emulator();
  return {
    isDrawFlag: () => chip8.is_draw_flag(),
    setDrawFlag: (flag: boolean) => {
      chip8.set_draw_flag(flag);
    },
    columns: () => chip8.get_columns(),
    rows: () => chip8.get_rows(),
    highRes: () => chip8.get_high_res(),
    getPixel: (x: number, y: number) => chip8.get_pixel(x, y),
    rate: () => chip8.get_rate(),
    cycle: () => chip8.cycle(),
    ticker: () => chip8.ticker(),
    keyDown: (key: string) => chip8.key_down(key.toLowerCase()),
    keyUp: (key: string) => chip8.key_up(key.toLowerCase()),
    reset: () => chip8.reset(),
    loadRom: (rom: Uint8Array) => chip8.load_rom(rom),
    toggleRunning: () => chip8.toggle_running(),
    resetKeys: () => chip8.reset_keys(),
    soundTimer: () => chip8.get_sound_timer(),
  };
}

export function init(useWasm = false) {
  return useWasm ? wasm() : js();
}
