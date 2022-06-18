import { Chip8 } from './Chip8';

const choice = (
  key: string | number,
  map: Record<string | number, VoidFunction>,
  fb?: VoidFunction
) => {
  const f = map[key] || fb;
  if (f) {
    f();
    return true;
  }

  return false;
};

// prettier-ignore
const FONTS = [
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
	0x20, 0x60, 0x20, 0x20, 0x70, // 1
	0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
	0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
	0x90, 0x90, 0xF0, 0x10, 0x10, // 4
	0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
	0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
	0xF0, 0x10, 0x20, 0x40, 0x40, // 7
	0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
	0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
	0xF0, 0x90, 0xF0, 0x90, 0x90, // A
	0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
	0xF0, 0x80, 0x80, 0x80, 0xF0, // C
	0xE0, 0x90, 0x90, 0x90, 0xE0, // D
	0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
	0xF0, 0x80, 0xF0, 0x80, 0x80, // F
];

// prettier-ignore
const LARGE_FONTS = [
  0x3C, 0x7E, 0xE7, 0xC3, 0xC3, 0xC3, 0xC3, 0xE7, 0x7E, 0x3C, // 0
	0x18, 0x38, 0x58, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x3C, // 1
	0x3E, 0x7F, 0xC3, 0x06, 0x0C, 0x18, 0x30, 0x60, 0xFF, 0xFF, // 2
	0x3C, 0x7E, 0xC3, 0x03, 0x0E, 0x0E, 0x03, 0xC3, 0x7E, 0x3C, // 3
	0x06, 0x0E, 0x1E, 0x36, 0x66, 0xC6, 0xFF, 0xFF, 0x06, 0x06, // 4
	0xFF, 0xFF, 0xC0, 0xC0, 0xFC, 0xFE, 0x03, 0xC3, 0x7E, 0x3C, // 5
	0x3E, 0x7C, 0xC0, 0xC0, 0xFC, 0xFE, 0xC3, 0xC3, 0x7E, 0x3C, // 6
	0xFF, 0xFF, 0x03, 0x06, 0x0C, 0x18, 0x30, 0x60, 0x60, 0x60, // 7
	0x3C, 0x7E, 0xC3, 0xC3, 0x7E, 0x7E, 0xC3, 0xC3, 0x7E, 0x3C, // 8
	0x3C, 0x7E, 0xC3, 0xC3, 0x7F, 0x3F, 0x03, 0x03, 0x3E, 0x7C, // 9
]

class Instruction {
  instruction: number;
  /** 第1位 */
  opcode: number;
  /** 第2位 */
  x: number;
  /** 第3位 */
  y: number;
  /** 第4位 */
  n: number;
  /** 后2位 */
  kk: number;
  /** 后3位 */
  nnn: number;

  constructor(instruction: number) {
    this.instruction = instruction;

    /** 获取8-bit立即数 kk */
    this.kk = instruction & 0x00ff;
    /** 获取立即数 n */
    this.n = instruction & 0x000f;
    /** 获取12-bit地址立即数 NNN */
    this.nnn = instruction & 0x0fff;
    /** 获取操作码 opcode  */
    this.opcode = instruction & 0xf000;
    /** 获取寄存器编号 */
    this.x = (instruction & 0x0f00) >> 8;
    /** 获取寄存器编号 y */
    this.y = (instruction & 0x00f0) >> 4;
  }
}

export class CPU {
  static readonly START_ADDRESS = 0x200;
  static readonly FONT_BASE = 0x0050;
  static readonly LARGE_FONT_BASE = 0x0050 + 0x50;

  c8: Chip8;
  /**
   * 内存空间，使用 Uint8Array 来模拟，大小为 4KB
   * 实际上给大一些
   */
  #memory: Uint8Array = new Uint8Array(4 * 1024);
  /**
   * 栈
   */
  #stack: number[] = [];
  /**
   * 16 个 8bit 的通用寄存器
   */
  #register_V = new Uint8Array(16);
  /**
   * 计数器，实际上最大值是 12bit，默认值 0x200
   */
  #register_PC = CPU.START_ADDRESS;
  /**
   * rpl 寄存器，暂时不知道干啥的
   */
  #register_Rpl = new Uint8Array(16);
  /**
   * 地址索引寄存器
   */
  #register_Index = 0;

  /** 计时器，8bit */
  #delayTimer = 0;
  soundTimer = 0;

  running = true;

  /**
   * 指令集
   * @see https://github.com/trapexit/chip-8_documentation#opcodes
   */
  #cpu_is(ir: Instruction) {
    const { instruction, opcode, x, y, n, kk, nnn } = ir;
    /**
     * - noraml is CHIP8
     * - S8 => SCHIP-8
     * - whitout: CHIP-8I, CHIP-8X, CHIP-8E
     * - NN is same as kk
     */
    return {
      /**
       * 001N
       * From Peter Miller's chip8run. Exit emulator with a return value of N.
       */
      EXIT_N: () => {
        const error = new Error(`Exit with return value ${n}`);
        error.name = 'QUIT';
        // @ts-ignore
        error.code = n;
        throw error;
      },
      /**
       * 00CN
       * Scroll display N lines down.
       */
      S8_SCD_N: () => {
        for (let y = this.c8.display.rows - 1; y >= n; y--) {
          for (let x = 0; x < this.c8.display.columns; x++) {
            this.c8.display.setPixel(x, y, this.c8.display.getPixel(x, y - n));
          }
        }
        for (let y = 0; y < n; y++) {
          for (let x = 0; x < this.c8.display.columns; x++) {
            this.c8.display.setPixel(x, y, 0);
          }
        }
        this.drawFlag = true;
      },
      /**
       * 00E0
       * Clears the display. Sets all pixels to off.
       */
      CLS: () => {
        this.c8.display.clear();
        this.drawFlag = true;
      },
      /**
       * 00EE
       * Return from subroutine. Set the PC to the address at the top of the stack and subtract 1 from the SP.
       */
      RET: () => {
        this.#register_PC = this.#stack.pop()!;
      },
      /**
       * 00FB
       * Scroll display 4 pixels to the right.
       */
      S8_SCR: () => {
        for (let y = 0; y < this.c8.display.rows; y++) {
          let x = 0;
          for (x = this.c8.display.columns - 1; x >= 4; x--) {
            this.c8.display.setPixel(x - 4, y, this.c8.display.getPixel(x, y));
          }
          this.c8.display.setPixel(x, y, 0);
          this.c8.display.setPixel(x - 1, y, 0);
          this.c8.display.setPixel(x - 2, y, 0);
          this.c8.display.setPixel(x - 3, y, 0);
        }
        this.drawFlag = true;
      },
      /**
       * 00FC
       * Scroll display 4 pixels to the left.
       */
      S8_SCL: () => {
        for (let y = 0; y < this.c8.display.rows; y++) {
          let x = 0;
          for (x = 0; x < this.c8.display.columns - 4; x++) {
            this.c8.display.setPixel(x, y, this.c8.display.getPixel(x + 4, y));
          }
          this.c8.display.setPixel(x, y, 0);
          this.c8.display.setPixel(x + 1, y, 0);
          this.c8.display.setPixel(x + 2, y, 0);
          this.c8.display.setPixel(x + 3, y, 0);
        }
        this.drawFlag = true;
      },
      /**
       * 00FD
       * Exit the interpreter.
       */
      S8_EXIT: () => {
        this.running = false;
      },
      /**
       * 00FE
       * Enable low res (64x32) mode.
       */
      S8_LOW: () => {
        this.c8.changeMode(false);
      },
      /**
       * 00FF
       * Enable high res (128x64) mode.
       */
      S8_HIGH: () => {
        this.c8.changeMode(true);
      },
      /**
       * 0NNN
       * Call machine language subroutine at address NNN.
       * This instruction is only used on the old computers on which Chip-8 was originally implemented.
       * It is ignored by modern interpreters.
       */
      CALL_NNN: () => {
        this.#register_PC = (this.#register_PC + 2) & 0xfff;
      },
      /**
       * 1NNN
       * Set PC to NNN.
       */
      JMP_NNN: () => {
        this.#register_PC = nnn;
      },
      /**
       * 2NNN
       * Call subroutine a NNN.
       * Increment the SP and put the current PC value on the top of the stack.
       * Then set the PC to NNN.
       * Generally there is a limit of 16 successive calls.
       */
      CALL_NNN_2: () => {
        this.#stack.push(this.#register_PC);
        this.#register_PC = nnn;
      },
      /**
       * 3XNN
       * Skip the next instruction if register VX is equal to NN.
       */
      SE_VX_NN: () => {
        if (this.#register_V[x] === kk) {
          this.#register_PC += 2;
        }
      },
      /**
       * 4XNN
       * Skip the next instruction if register VX is not equal to NN.
       */
      SNE_VX_NN: () => {
        if (this.#register_V[x] !== kk) {
          this.#register_PC += 2;
        }
      },
      /**
       * 5XY0
       * Skip the next instruction if register VX equals VY.
       */
      SE_VX_VY: () => {
        if (this.#register_V[x] === this.#register_V[y]) {
          this.#register_PC += 2;
        }
      },
      /**
       * 6XNN
       * Load immediate value NN into register VX.
       */
      LD_VX_NN: () => {
        this.#register_V[x] = kk;
      },
      /**
       * 7XNN
       * Add immediate value NN to register VX. Does not effect VF.
       */
      ADD_VX_NN: () => {
        this.#register_V[x] += kk;
        this.#register_V[x] &= 0xff;
      },
      /**
       * 8XY0
       * Copy the value in register VY into VX
       */
      LD_VX_VY: () => {
        this.#register_V[x] = this.#register_V[y];
      },
      /**
       * 8XY1
       * Set VX equal to the bitwise or of the values in VX and VY.
       */
      OR_VX_VY: () => {
        this.#register_V[x] |= this.#register_V[y];
      },
      /**
       * 8XY2
       * Set VX equal to the bitwise and of the values in VX and VY.
       */
      AND_VX_VY: () => {
        this.#register_V[x] &= this.#register_V[y];
      },
      /**
       * 8XY3
       * Set VX equal to the bitwise xor of the values in VX and VY.
       * Note: This instruction was originally undocumented
       * but functional due to how the 8XXX instructions were implemented on teh COSMAC VIP.
       */
      XOR_VX_VY: () => {
        this.#register_V[x] ^= this.#register_V[y];
      },
      /**
       * 8XY4
       * Set VX equal to VX plus VY. In the case of an overflow VF is set to 1. Otherwise 0.
       */
      ADD_VX_VY: () => {
        const sum = this.#register_V[x] + this.#register_V[y];
        this.#register_V[0x0f] = sum > 0xff ? 1 : 0;
        this.#register_V[x] = sum & 0xff;
      },
      /**
       * 8XY5
       * Set VX equal to VX minus VY. In the case of an underflow VF is set 0. Otherwise 1. (VF = VX > VY)
       */
      SUB_VX_VY: () => {
        const res = this.#register_V[x] - this.#register_V[y];
        this.#register_V[0xf] = res < 0 ? 0 : 1;
        this.#register_V[x] = res & 0xff;
      },
      /**
       * 8XY6
       * Set VX equal to VX bitshifted right 1.
       * VF is set to the least significant bit of VX prior to the shift.
       * Originally this opcode meant set VX equal to VY bitshifted right 1
       * but emulators and software seem to ignore VY now.
       *
       * Note: This instruction was originally undocumented
       * but functional due to how the 8XXX instructions were implemented on teh COSMAC VIP.
       */
      SHR_VX_VY: () => {
        this.#register_V[0xf] = this.#register_V[x] & 0x1;
        this.#register_V[x] = this.#register_V[x] >> 1;
      },
      /**
       * 8XY7
       * Set VX equal to VY minus VX. VF is set to 1 if VY > VX. Otherwise 0.
       *
       * Note: This instruction was originally undocumented
       * but functional due to how the 8XXX instructions were implemented on teh COSMAC VIP.
       */
      SUBN_VY_VX: () => {
        this.#register_V[0xf] =
          this.#register_V[x] < this.#register_V[y] ? 1 : 0;
        this.#register_V[x] = this.#register_V[y] - this.#register_V[x];
        this.#register_V[x] &= 0xff;
      },
      /**
       * 8XYE
       * Set VX equal to VX bitshifted left 1.
       * VF is set to the most significant bit of VX prior to the shift.
       * Originally this opcode meant set VX equal to VY bitshifted left 1
       * but emulators and software seem to ignore VY now.
       *
       * Note: This instruction was originally undocumented
       * but functional due to how the 8XXX instructions were implemented on teh COSMAC VIP.
       */
      SHL_VX_VY: () => {
        this.#register_V[0xf] = (this.#register_V[x] >> 7) & 0x01;
        this.#register_V[x] = this.#register_V[x] << 1;
        this.#register_V[x] = this.#register_V[x] & 0xff;
      },
      /**
       * 9XY0
       * Skip the next instruction if VX does not equal VY.
       */
      SNE_VX_VY: () => {
        if (this.#register_V[x] !== this.#register_V[y]) {
          this.#register_PC += 2;
        }
      },
      /**
       * ANNN
       * Set I equal to NNN.
       */
      LD_I_NNN: () => {
        this.#register_Index = nnn;
      },
      /**
       * BNNN
       * Set the PC to NNN plus the value in V0.
       */
      JP_V0_NNN: () => {
        this.#register_PC = nnn + this.#register_V[0];
      },
      /**
       * CXNN
       * Set VX equal to a random number ranging from 0 to 255 which is logically anded with NN.
       */
      RND_VX_NN: () => {
        this.#register_V[x] = Math.floor(Math.random() * 0xff) & kk;
      },
      /**
       * DXY0
       * When in high res mode show a 16x16 sprite at (VX, VY).
       *
       * Draws a sprite on the screen while in EXTENDED mode.
       * Sprites in this mode are assumed to be 16x16 pixels.
       * This means that two bytes will be read from the memory location, and 16 two-byte sequences in total will be read.
       */
      S8_DRW_VX_VY_0: () => {
        this.#register_V[0xf] = 0;
        const vx = this.#register_V[x];
        const vy = this.#register_V[y];

        for (let row = 0; row < 16; row++) {
          if (vy + row >= this.c8.display.rows) {
            break;
          }
          let spriteByte1 = this.#memory[this.#register_Index + row * 2];
          let spriteByte2 = this.#memory[this.#register_Index + (row * 2 + 1)];

          for (let bitIndex = 0; bitIndex < 16; bitIndex++) {
            if (vx + bitIndex >= this.c8.display.columns) {
              continue;
            }

            let spriteBit =
              bitIndex < 8
                ? (spriteByte1 >> (7 - bitIndex)) & 1
                : (spriteByte2 >> (15 - bitIndex)) & 1;
            let displayBit = this.c8.display.getPixel(vx + bitIndex, vy + row);

            if (spriteBit === 1 && displayBit) {
              this.#register_V[0xf] = 1;
              this.c8.display.setPixel(vx + bitIndex, vy + row, 0);
              continue;
            }

            if (spriteBit === 1 && !displayBit) {
              this.c8.display.setPixel(vx + bitIndex, vy + row, 1);
            }
          }
        }

        this.drawFlag = true;
      },
      /**
       * DXYN
       * Display N-byte sprite starting at memory location I at (VX, VY).
       * Each set bit of xored with what's already drawn. VF is set to 1 if a collision occurs.
       * 0 otherwise.
       */
      DRW_VX_VX_N: () => {
        this.#register_V[0xf] = 0;
        const vx = this.#register_V[x];
        const vy = this.#register_V[y];
        const nums = n;

        // 64 * 32
        for (let yy = 0; yy < nums; yy++) {
          const sys_byte = this.#memory[this.#register_Index + yy];
          for (let xx = 0; xx < 8; xx++) {
            const x_cord = vx + xx;
            const y_cord = vy + yy;
            if (
              x_cord < this.c8.display.columns &&
              y_cord < this.c8.display.rows
            ) {
              const sys_bit = (sys_byte >> (7 - xx)) & 0x01;
              const xy_bit = this.c8.display.getPixel(x_cord, y_cord);
              if ((xy_bit & sys_bit) === 1) {
                this.#register_V[0xf] = 1;
              }
              this.c8.display.setPixel(
                x_cord,
                y_cord,
                (xy_bit ^ sys_bit) as 0 | 1
              );
            }
          }
        }

        // for (let row = 0; row < nums; row++) {
        //   if (vy + row >= this.c8.display.rows) {
        //     break;
        //   }
        //   const spriteByte = this.#memory[this.#register_Index + row];
        //   for (let xbit = 0; xbit < 8; xbit++) {
        //     if (vx + xbit > this.c8.display.columns) {
        //       continue;
        //     }
        //     const spriteBit = (spriteByte >> (7 - xbit)) & 1;
        //     const displayBit = this.c8.display.getPixel(vx + xbit, vy + row);
        //     // XOR logic and setting of VF
        //     if (spriteBit && displayBit) {
        //       this.#register_V[0xf] = 1;
        //       this.c8.display.setPixel(vx + xbit, vy + row, 0);
        //     }
        //     if (spriteBit && !displayBit) {
        //       this.c8.display.setPixel(vx + xbit, vy + row, 1);
        //     }
        //   }
        // }

        this.drawFlag = true;
      },
      /**
       * EX9E
       * Skip the following instruction if the key represented by the value in VX is pressed.
       */
      SKP_VX: () => {
        if (this.#keysBuff[this.#register_V[x]]) {
          this.#register_PC += 2;
        }
      },
      /**
       * EXA1
       * Skip the following instruction if the key represented by the value in VX is not pressed.
       */
      SKNP_VX: () => {
        if (!this.#keysBuff[this.#register_V[x]]) {
          this.#register_PC += 2;
        }
      },
      /**
       * FX07
       * Set VX equal to the delay timer.
       */
      LD_VX_DT: () => {
        this.#register_V[x] = this.#delayTimer;
      },
      /**
       * FX0A
       * Wait for a key press and store the value of the key into VX.
       */
      LD_VX_KEY: () => {
        let pressed = false;
        for (const [i, bit] of this.#keysBuff.entries()) {
          if (bit) {
            this.#register_V[x] = i;
            pressed = true;
            break;
          }
        }
        if (!pressed) this.#register_PC -= 2;
      },
      /**
       * FX15
       * Set the delay timer DT to VX.
       */
      LD_DT_VX: () => {
        this.#delayTimer = this.#register_V[x];
      },
      /**
       * FX18
       * Set the sound timer ST to VX.
       */
      LD_ST_VX: () => {
        this.soundTimer = this.#register_V[x];
      },
      /**
       * FX1E
       * Add VX to I. VF is set to 1 if I > 0x0FFF. Otherwise set to 0.
       */
      ADD_I_VX: () => {
        const sum = this.#register_Index + this.#register_V[x];
        this.#register_V[0xf] = sum > 0x0fff ? 1 : 0;
        this.#register_Index = sum & 0x0fff;
      },
      /**
       * FX29
       * Set I to the address of the CHIP-8 8x5 font sprite representing the value in VX.
       */
      LD_I_FONT_VX: () => {
        this.#register_Index = this.#register_V[x] * 5;
      },
      /**
       * FX30
       * Set I to the address of the SCHIP-8 16x10 font sprite representing the value in VX.
       */
      S8_LD_I_FONT_VX: () => {
        // Each font sprite is 10 bytes "high"
        const val = this.#register_V[x] * 10;
        this.#register_Index = (CPU.LARGE_FONT_BASE + val) & 0x0fff;
      },
      /**
       * FX33
       * Convert that word to BCD and store the 3 digits at memory location I through I+2.
       * I does not change.
       */
      BCD_VX: () => {
        // 取得十进制百位
        this.#memory[this.#register_Index] = Math.floor(
          this.#register_V[x] / 100
        );
        // 取得十进制十位
        this.#memory[this.#register_Index + 1] = Math.floor(
          (this.#register_V[x] % 100) / 10
        );
        // 取得十进制个位
        this.#memory[this.#register_Index + 2] =
          (this.#register_V[x] % 100) % 10;
      },
      /**
       * FX55
       * Store registers V0 through VX in memory starting at location I. I does not change.
       */
      LD_I_VX: () => {
        for (let i = 0; i <= x; i++) {
          this.#memory[this.#register_Index + i] = this.#register_V[i];
        }
      },
      /**
       * FX65
       * Copy values from memory location I through I + X into registers V0 through VX. I does not change.
       */
      LD_VX_I: () => {
        for (let i = 0; i <= x; i++) {
          this.#register_V[i] = this.#memory[this.#register_Index + i];
        }
      },
      /**
       * FX75
       * Store V0 through VX to HP-48 RPL user flags (X <= 7).
       */
      LD_R_VX: () => {
        for (let i = 0; i <= x; i++) {
          this.#register_Rpl[i] = this.#register_V[i];
        }
      },
      /**
       * FX85
       * Read V0 through VX to HP-48 RPL user flags (X <= 7)
       */
      LD_VX_R: () => {
        for (let i = 0; i <= x; i++) {
          this.#register_V[i] = this.#register_Rpl[i];
        }
      },
    };
  }

  get #keysBuff() {
    return this.c8.keyboard.keysBuff;
  }

  drawFlag = false;

  constructor(chip8: Chip8) {
    this.c8 = chip8;
    this.reset();
  }

  loadRom(units: Uint8Array) {
    for (let i = 0; i < units.length; i++) {
      const memoryIndex = i + CPU.START_ADDRESS;
      if (memoryIndex < this.#memory.length) {
        this.#memory[memoryIndex] = units[i];
      } else {
        throw new Error('ROM too large');
      }
    }
  }

  reset() {
    // 初始化内存
    this.#memory.fill(0);

    // 加载字体
    for (const [i, byte] of FONTS.entries()) {
      this.#memory[i] = byte;
    }
    for (const [i, byte] of LARGE_FONTS.entries()) {
      this.#memory[CPU.LARGE_FONT_BASE + i] = byte;
    }

    this.#stack = [];

    // 初始化各寄存器
    this.#register_V.fill(0);
    this.#register_PC = CPU.START_ADDRESS;
    this.#register_Rpl.fill(0);
    this.#register_Index = 0;

    this.#delayTimer = 0;
    this.soundTimer = 0;

    this.drawFlag = false;
    this.running = true;
  }

  fetch() {
    // 通过 PC 寄存器分别读取读取高低字节数据
    const high = this.#memory[this.#register_PC];
    const low = this.#memory[this.#register_PC + 1];
    this.#register_PC += 2;

    // 然后把高字节左移 8-bit 和 低字节数据进行或操作
    const instruction = (high << 8) | low;
    return instruction;
  }

  decode(instruction: number) {
    return new Instruction(instruction);
  }

  decodeAndExecute(ir: number) {
    const irIns = new Instruction(ir);
    const { opcode, x, y, n, kk, nnn } = irIns;
    const ops = this.#cpu_is(irIns);

    choice(opcode, {
      0x0000: () =>
        choice(y, {
          0x1: ops.EXIT_N,
          0xc: ops.S8_SCD_N,
        }) ||
        choice(kk, {
          0x00e0: ops.CLS,
          0x00ee: ops.RET,
          0x00fb: ops.S8_SCR,
          0x00fc: ops.S8_SCL,
          0x00fd: ops.S8_EXIT,
          0x00fe: ops.S8_LOW,
          0x00ff: ops.S8_HIGH,
        }) ||
        ops.CALL_NNN(),
      0x1000: ops.JMP_NNN,
      0x2000: ops.CALL_NNN_2,
      0x3000: ops.SE_VX_NN,
      0x4000: ops.SNE_VX_NN,
      0x5000: ops.SE_VX_VY,
      0x6000: ops.LD_VX_NN,
      0x7000: ops.ADD_VX_NN,
      0x8000: () =>
        choice(n, {
          0x0: ops.LD_VX_VY,
          0x1: ops.OR_VX_VY,
          0x2: ops.AND_VX_VY,
          0x3: ops.XOR_VX_VY,
          0x4: ops.ADD_VX_VY,
          0x5: ops.SUB_VX_VY,
          0x6: ops.SHR_VX_VY,
          0x7: ops.SUBN_VY_VX,
          0xe: ops.SHL_VX_VY,
        }),
      0x9000: ops.SNE_VX_VY,
      0xa000: ops.LD_I_NNN,
      0xb000: ops.JP_V0_NNN,
      0xc000: ops.RND_VX_NN,
      0xd000: () =>
        this.c8.highRes && n === 0 ? ops.S8_DRW_VX_VY_0() : ops.DRW_VX_VX_N(),
      0xe000: () =>
        choice(kk, {
          0x009e: ops.SKP_VX,
          0x00a1: ops.SKNP_VX,
        }),
      0xf000: () =>
        choice(kk, {
          0x0007: ops.LD_VX_DT,
          0x000a: ops.LD_VX_KEY,
          0x0015: ops.LD_DT_VX,
          0x0018: ops.LD_ST_VX,
          0x001e: ops.ADD_I_VX,
          0x0029: ops.LD_I_FONT_VX,
          0x0030: ops.S8_LD_I_FONT_VX,
          0x0033: ops.BCD_VX,
          0x0055: ops.LD_I_VX,
          0x0065: ops.LD_VX_I,
          0x0075: ops.LD_R_VX,
          0x0085: ops.LD_VX_R,
        }),
    });
  }

  cycle() {
    // 指令循环 fetch-decode-execute
    // fetch
    const instruction = this.fetch();
    // decode && execute
    this.decodeAndExecute(instruction);
  }

  ticker() {
    if (this.#delayTimer > 0) this.#delayTimer -= 1;
    if (this.soundTimer > 0) this.soundTimer -= 1;
  }
}
