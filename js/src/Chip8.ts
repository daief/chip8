import { CPU } from './CPU';
import { Display } from './Display';
import { Keyboard } from './Keyboard';

export class Chip8 {
  cpu: CPU;
  display: Display;
  keyboard: Keyboard;

  /**
   * 700hz
   */
  RATE: number = 0;

  highRes = false;

  constructor() {
    this.cpu = new CPU(this);
    this.display = new Display();
    this.keyboard = new Keyboard();
    this.changeMode(false);
  }

  changeMode(isHighRes: boolean) {
    this.highRes = isHighRes;
    this.RATE = isHighRes ? 700 : 480;
  }

  reset() {
    this.highRes = false;
    this.cpu.reset();
    this.display.clear();
    this.keyboard.reset();
  }

  loadRom(rom: Uint8Array) {
    this.cpu.loadRom(rom);
  }

  toggleRunning() {
    this.cpu.running = !this.cpu.running;
    return this.cpu.running;
  }
}
