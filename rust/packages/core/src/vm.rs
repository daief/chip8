use rand::{prelude::ThreadRng, thread_rng};

use crate::hardware::{Keyboard, Screen};

const START_ADDRESS: u16 = 0x200;
const FONT_BASE: u16 = 0x50;
const LARGE_FONT_BASE: u16 = FONT_BASE + 0x50;

static FONTS: [u8; 80] = [
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

static LARGE_FONTS: [u8; 100] = [
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
];

#[derive(Debug)]
pub struct Chip8 {
    // CPU 频率
    pub rate: u16,
    /// 4KB size of the RAM
    pub memory: Vec<u8>,
    /// 栈模拟
    pub stack: Vec<u16>,
    /// 16 个 8bit 的通用寄存器
    pub r_v: Vec<u8>,
    /// 计数器，实际上最大值是 12bit，默认值 0x200
    pub r_pc: u16,
    ///
    pub r_rpl: Vec<u8>,
    /// 地址索引寄存器
    pub r_i: u16,
    /// delay 计时器
    pub d_timer: u8,
    /// sound 计时器
    pub s_timer: u8,
    ///
    pub running: bool,
    /// schip8 模式
    pub high_res: bool,
    pub draw_flag: bool,

    pub screen: Screen,
    pub keyboard: Keyboard,

    rng: ThreadRng,
}

impl Chip8 {
    fn new() -> Self {
        Chip8 {
            rate: 480,
            memory: vec![0; 4 * 1024],
            stack: vec![0; 16],
            r_v: vec![0; 16],
            r_pc: START_ADDRESS,
            r_rpl: vec![0; 16],
            r_i: 0,
            d_timer: 0,
            s_timer: 0,
            running: true,
            high_res: false,
            draw_flag: false,

            screen: Screen::new(),
            keyboard: Keyboard::new(),

            rng: thread_rng(),
        }
    }

    pub fn create() -> Self {
        let mut c8 = Chip8::new();
        c8.reset();
        c8.change_mode(false);
        c8
    }

    pub fn load_rom(&mut self, rom: &[u8]) -> Result<(), String> {
        for (i, byte) in rom.iter().enumerate() {
            let m_idx = i + START_ADDRESS as usize;
            if m_idx < self.memory.len() {
                self.memory[m_idx] = *byte;
            } else {
                return Err("ROM is too large to load into memory".to_string());
            }
        }
        Ok(())
    }

    pub fn reset(&mut self) {
        // reset memory
        self.memory.fill(0);

        // load fonts
        for (i, byte) in FONTS.iter().enumerate() {
            self.memory[i] = *byte;
        }
        for (i, byte) in LARGE_FONTS.iter().enumerate() {
            self.memory[LARGE_FONT_BASE as usize + i] = *byte;
        }

        // reset stack
        self.stack = vec![0; 16];

        // reset registers
        self.r_v.fill(0);
        self.r_pc = START_ADDRESS;
        self.r_rpl.fill(0);
        self.r_i = 0;

        // reset timers
        self.d_timer = 0;
        self.s_timer = 0;

        self.running = true;
        self.draw_flag = false;
        self.high_res = false;

        self.change_mode(false);

        self.screen.clear();
        self.keyboard.reset();
    }

    fn fetch(&mut self) -> u16 {
        let high = self.memory[self.r_pc as usize] as u16;
        let low = self.memory[self.r_pc as usize + 1] as u16;
        self.r_pc += 2;

        (high << 8) | low
    }

    fn execute(&mut self, ir: &Instruction) {
        match ir.opcode {
            0x0000 => match ir.y {
                0x1 => ops::exit_n(self, ir),
                0xc => ops::s8_scd_n(self, ir),
                _ => match ir.kk {
                    0x00e0 => ops::cls(self),
                    0x00ee => ops::ret(self),
                    0x00fb => ops::s8_scr(self),
                    0x00fc => ops::s8_scl(self),
                    0x00fd => ops::s8_exit(self),
                    0x00fe => ops::s8_low(self),
                    0x00ff => ops::s8_high(self),
                    _ => ops::call_nnn(self),
                },
            },
            0x1000 => ops::jmp_nnn(self, ir),
            0x2000 => ops::call_nnn_2(self, ir),
            0x3000 => ops::se_vx_nn(self, ir),
            0x4000 => ops::sne_vx_nn(self, ir),
            0x5000 => ops::se_vx_vy(self, ir),
            0x6000 => ops::ld_vx_nn(self, ir),
            0x7000 => ops::add_vx_nn(self, ir),
            0x8000 => match ir.n {
                0x0 => ops::ld_vx_vy(self, ir),
                0x1 => ops::or_vx_vy(self, ir),
                0x2 => ops::and_vx_vy(self, ir),
                0x3 => ops::xor_vx_vy(self, ir),
                0x4 => ops::add_vx_vy(self, ir),
                0x5 => ops::sub_vx_vy(self, ir),
                0x6 => ops::shr_vx_vy(self, ir),
                0x7 => ops::subn_vy_vx(self, ir),
                0xe => ops::shl_vx_vy(self, ir),
                _ => {}
            },
            0x9000 => ops::sne_vx_vy(self, ir),
            0xa000 => ops::ld_i_nnn(self, ir),
            0xb000 => ops::jp_v0_nnn(self, ir),
            0xc000 => ops::rnd_vx_nn(self, ir),
            0xd000 => {
                if self.high_res && ir.n == 0 {
                    ops::s8_drw_vx_vy_0(self, ir);
                } else {
                    ops::drw_vx_vy_n(self, ir)
                }
            }
            0xe000 => match ir.kk {
                0x009e => ops::skp_vx(self, ir),
                0x00a1 => ops::sknp_vx(self, ir),
                _ => {}
            },
            0xf000 => match ir.kk {
                0x0007 => ops::ld_vx_dt(self, ir),
                0x000a => ops::ld_vx_key(self, ir),
                0x0015 => ops::ld_dt_vx(self, ir),
                0x0018 => ops::ld_st_vx(self, ir),
                0x001e => ops::add_i_vx(self, ir),
                0x0029 => ops::ld_i_font_vx(self, ir),
                0x0030 => ops::s8_ld_i_font_vx(self, ir),
                0x0033 => ops::bcd_vx(self, ir),
                0x0055 => ops::ld_i_vx(self, ir),
                0x0065 => ops::ld_vx_i(self, ir),
                0x0075 => ops::ld_r_vx(self, ir),
                0x0085 => ops::ld_vx_r(self, ir),
                _ => {}
            },
            _ => {
                // let x = self.c8.as_ptr();
            }
        }
    }

    /// fetch -> decode -> execute
    pub fn cycle(&mut self) {
        // fetch
        let ir_code = self.fetch();

        // decode
        let ir = Instruction::new(ir_code);

        // execute
        self.execute(&ir);
    }

    pub fn ticker(&mut self) {
        if self.d_timer > 0 {
            self.d_timer -= 1;
        }
        if self.s_timer > 0 {
            self.s_timer -= 1;
        }
    }

    pub fn change_mode(&mut self, is_high_res: bool) {
        self.high_res = is_high_res;
        self.rate = if is_high_res { 700 } else { 480 };
    }
}

impl Default for Chip8 {
    fn default() -> Self {
        Self::new()
    }
}

pub struct Instruction {
    pub ir_code: u16,
    /// 操作码，第一位
    pub opcode: u16,
    /// 获取寄存器编号，第二位
    pub x: u8,
    /// 获取寄存器编号，第三位
    pub y: u8,
    /// 第四位
    pub n: u8,
    /// 后二位
    pub kk: u8,
    /// 后三位
    pub nnn: u16,
}

impl Instruction {
    pub fn new(ir_code: u16) -> Instruction {
        Instruction {
            ir_code,
            opcode: ir_code & 0xf000,
            x: ((ir_code & 0x0f00) >> 8) as u8,
            y: ((ir_code & 0x00f0) >> 4) as u8,
            n: (ir_code & 0x000f) as u8,
            kk: (ir_code & 0x00ff) as u8,
            nnn: ir_code & 0x0fff,
        }
    }
}

mod ops {
    use rand::Rng;

    use super::{Chip8, Instruction, LARGE_FONT_BASE};

    /**
     * 001N
     * From Peter Miller's chip8run. Exit emulator with a return value of N.
     */
    pub fn exit_n(_vm: &Chip8, ir: &Instruction) {
        panic!("Exit with return value {}", ir.n);
    }

    /**
     * 00CN
     * Scroll display N lines down.
     */
    pub fn s8_scd_n(vm: &mut Chip8, ir: &Instruction) {
        for y in vm.screen.rows - 1..ir.n.wrapping_sub(1) {
            for x in 0..vm.screen.columns {
                vm.screen.set_pixel(x, y, vm.screen.get_pixel(x, y - ir.n));
            }
        }
        for y in 0..ir.n {
            for x in 0..vm.screen.columns {
                vm.screen.set_pixel(x, y, false);
            }
        }
        vm.draw_flag = true;
    }

    /**
     * 00E0
     * Clears the display. Sets all pixels to off.
     */
    pub fn cls(vm: &mut Chip8) {
        vm.screen.clear();
        vm.draw_flag = true;
    }

    /**
     * 00EE
     * Return from subroutine. Set the PC to the address at the top of the stack and subtract 1 from the SP.
     */
    pub fn ret(vm: &mut Chip8) {
        if let Some(res) = vm.stack.pop() {
            vm.r_pc = res;
        }
    }

    /**
     * 00FB
     * Scroll display 4 pixels to the right.
     */
    pub fn s8_scr(vm: &mut Chip8) {
        for y in 0..vm.screen.columns {
            for x in (4..vm.screen.columns).rev() {
                vm.screen.set_pixel(x - 4, y, vm.screen.get_pixel(x, y));
            }

            for x in 0..4 {
                vm.screen.set_pixel(x, y, false);
            }
        }
        vm.draw_flag = true;
    }

    /**
     * 00FC
     * Scroll display 4 pixels to the left.
     */
    pub fn s8_scl(vm: &mut Chip8) {
        for y in 0..vm.screen.rows {
            for x in 0..vm.screen.columns {
                if x < vm.screen.columns - 4 {
                    vm.screen.set_pixel(x, y, vm.screen.get_pixel(x + 4, y));
                } else {
                    vm.screen.set_pixel(x, y, false);
                }
            }
        }
    }

    /**
     * 00FD
     * Exit the interpreter.
     */
    pub fn s8_exit(vm: &mut Chip8) {
        vm.running = false;
    }

    /**
     * 00FE
     * Enable low res (64x32) mode.
     */
    pub fn s8_low(vm: &mut Chip8) {
        vm.change_mode(false);
    }

    /**
     * 00FF
     * Enable high res (128x64) mode.
     */
    pub fn s8_high(vm: &mut Chip8) {
        vm.change_mode(true);
    }

    /**
     * 0NNN
     * Call machine language subroutine at address NNN.
     * This instruction is only used on the old computers on which Chip-8 was originally implemented.
     * It is ignored by modern interpreters.
     */
    pub fn call_nnn(vm: &mut Chip8) {
        vm.r_pc = (vm.r_pc + 2) & 0xfff;
    }

    /**
     * 1NNN
     * Set PC to NNN.
     */
    pub fn jmp_nnn(vm: &mut Chip8, ir: &Instruction) {
        vm.r_pc = ir.nnn;
    }

    /**
     * 2NNN
     * Call subroutine a NNN.
     * Increment the SP and put the current PC value on the top of the stack.
     * Then set the PC to NNN.
     * Generally there is a limit of 16 successive calls.
     */
    pub fn call_nnn_2(vm: &mut Chip8, ir: &Instruction) {
        vm.stack.push(vm.r_pc);
        vm.r_pc = ir.nnn;
    }

    /**
     * 3XNN
     * Skip the next instruction if register VX is equal to NN.
     */
    pub fn se_vx_nn(vm: &mut Chip8, ir: &Instruction) {
        if vm.r_v[ir.x as usize] == ir.kk {
            vm.r_pc += 2;
        }
    }

    /**
     * 4XNN
     * Skip the next instruction if register VX is not equal to NN.
     */
    pub fn sne_vx_nn(vm: &mut Chip8, ir: &Instruction) {
        if vm.r_v[ir.x as usize] != ir.kk {
            vm.r_pc += 2;
        }
    }

    /**
     * 5XY0
     * Skip the next instruction if register VX equals VY.
     */
    pub fn se_vx_vy(vm: &mut Chip8, ir: &Instruction) {
        if vm.r_v[ir.x as usize] == vm.r_v[ir.y as usize] {
            vm.r_pc += 2;
        }
    }

    /**
     * 6XNN
     * Load immediate value NN into register VX.
     */
    pub fn ld_vx_nn(vm: &mut Chip8, ir: &Instruction) {
        vm.r_v[ir.x as usize] = ir.kk;
    }

    /**
     * 7XNN
     * Add immediate value NN to register VX. Does not effect VF.
     */
    pub fn add_vx_nn(vm: &mut Chip8, ir: &Instruction) {
        let x = ir.x as usize;
        vm.r_v[x] = vm.r_v[x].wrapping_add(ir.kk);
    }

    /**
     * 8XY0
     * Copy the value in register VY into VX
     */
    pub fn ld_vx_vy(vm: &mut Chip8, ir: &Instruction) {
        vm.r_v[ir.x as usize] = vm.r_v[ir.y as usize];
    }

    /**
     * 8XY1
     * Set VX equal to the bitwise or of the values in VX and VY.
     */
    pub fn or_vx_vy(vm: &mut Chip8, ir: &Instruction) {
        vm.r_v[ir.x as usize] |= vm.r_v[ir.y as usize];
    }

    /**
     * 8XY2
     * Set VX equal to the bitwise and of the values in VX and VY.
     */
    pub fn and_vx_vy(vm: &mut Chip8, ir: &Instruction) {
        vm.r_v[ir.x as usize] &= vm.r_v[ir.y as usize];
    }

    /**
     * 8XY3
     * Set VX equal to the bitwise xor of the values in VX and VY.
     * Note: This instruction was originally undocumented
     * but functional due to how the 8XXX instructions were implemented on teh COSMAC VIP.
     */
    pub fn xor_vx_vy(vm: &mut Chip8, ir: &Instruction) {
        vm.r_v[ir.x as usize] ^= vm.r_v[ir.y as usize];
    }

    /**
     * 8XY4
     * Set VX equal to VX plus VY. In the case of an overflow VF is set to 1. Otherwise 0.
     */
    pub fn add_vx_vy(vm: &mut Chip8, ir: &Instruction) {
        let x = ir.x as usize;
        let y = ir.y as usize;
        let (vx, vy) = (vm.r_v[x], vm.r_v[y]);
        let (sum, is_overflow) = vx.overflowing_add(vy);
        vm.r_v[x] = sum;
        vm.r_v[0xF] = if is_overflow { 1 } else { 0 };
    }

    /**
     * 8XY5
     * Set VX equal to VX minus VY. In the case of an underflow VF is set 0. Otherwise 1. (VF = VX > VY)
     */
    pub fn sub_vx_vy(vm: &mut Chip8, ir: &Instruction) {
        let x = ir.x as usize;
        let y = ir.y as usize;
        let (vx, vy) = (vm.r_v[x], vm.r_v[y]);
        let (diff, is_underflow) = vx.overflowing_sub(vy);
        vm.r_v[x] = diff;
        vm.r_v[0xF] = if is_underflow { 0 } else { 1 };
    }

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
    pub fn shr_vx_vy(vm: &mut Chip8, ir: &Instruction) {
        vm.r_v[0xF] = vm.r_v[ir.x as usize] & 0x1;
        vm.r_v[ir.x as usize] >>= 1;
    }

    /**
     * 8XY7
     * Set VX equal to VY minus VX. VF is set to 1 if VY > VX. Otherwise 0.
     *
     * Note: This instruction was originally undocumented
     * but functional due to how the 8XXX instructions were implemented on teh COSMAC VIP.
     */
    pub fn subn_vy_vx(vm: &mut Chip8, ir: &Instruction) {
        let x = ir.x as usize;
        let y = ir.y as usize;
        let (vx, vy) = (vm.r_v[x], vm.r_v[y]);
        vm.r_v[x] = vy.wrapping_sub(vx);
        vm.r_v[0xF] = if vy > vx { 1 } else { 0 };
    }

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
    pub fn shl_vx_vy(vm: &mut Chip8, ir: &Instruction) {
        let x = ir.x as usize;
        vm.r_v[0xF] = (vm.r_v[x] >> 7) & 0x1;
        vm.r_v[x] <<= 1;
        vm.r_v[x] &= 0xFF;
    }

    /**
     * 9XY0
     * Skip the next instruction if VX does not equal VY.
     */
    pub fn sne_vx_vy(vm: &mut Chip8, ir: &Instruction) {
        let x = ir.x as usize;
        let y = ir.y as usize;
        if vm.r_v[x] != vm.r_v[y] {
            vm.r_pc += 2;
        }
    }

    /**
     * ANNN
     * Set I equal to NNN.
     */
    pub fn ld_i_nnn(vm: &mut Chip8, ir: &Instruction) {
        vm.r_i = ir.nnn;
    }

    /**
     * BNNN
     * Set the PC to NNN plus the value in V0.
     */
    pub fn jp_v0_nnn(vm: &mut Chip8, ir: &Instruction) {
        vm.r_pc = ir.nnn + vm.r_v[0x0] as u16;
    }

    /**
     * CXNN
     * Set VX equal to a random number ranging from 0 to 255 which is logically anded with NN.
     */
    pub fn rnd_vx_nn(vm: &mut Chip8, ir: &Instruction) {
        vm.r_v[ir.x as usize] = vm.rng.gen_range(0..0xFF) & ir.kk;
    }

    /**
     * DXY0
     * When in high res mode show a 16x16 sprite at (VX, VY).
     *
     * Draws a sprite on the screen while in EXTENDED mode.
     * Sprites in this mode are assumed to be 16x16 pixels.
     * This means that two bytes will be read from the memory location, and 16 two-byte sequences in total will be read.
     */
    pub fn s8_drw_vx_vy_0(vm: &mut Chip8, ir: &Instruction) {
        let x = ir.x as usize;
        let y = ir.y as usize;
        let vx = vm.r_v[x];
        let vy = vm.r_v[y];

        for row in 0..16 {
            if vy + row >= vm.screen.rows {
                break;
            }
            let sprite_byte_1 = vm.memory[(vm.r_i + 2 * row as u16) as usize];
            let sprite_byte_2 = vm.memory[(vm.r_i + (2 * row + 1) as u16) as usize];

            for bit_index in 0..16 {
                if vx + bit_index >= vm.screen.columns {
                    continue;
                }

                let sprite_bit = if bit_index < 8 {
                    sprite_byte_1 >> (7 - bit_index) & 0x1
                } else {
                    sprite_byte_2 >> (15 - bit_index) & 0x1
                };

                let display_bit = vm.screen.get_pixel(vx + bit_index, vy + row);

                if sprite_bit == 1 {
                    if display_bit {
                        vm.r_v[0xF] = 1;
                        vm.screen.set_pixel(vx + bit_index, vy + row, false);
                    } else {
                        vm.screen.set_pixel(vx + bit_index, vy + row, true);
                    }
                }
            }
        }

        vm.draw_flag = true;
    }

    /**
     * DXYN
     * Display N-byte sprite starting at memory location I at (VX, VY).
     * Each set bit of xored with what's already drawn. VF is set to 1 if a collision occurs.
     * 0 otherwise.
     */
    pub fn drw_vx_vy_n(vm: &mut Chip8, ir: &Instruction) {
        vm.r_v[0xF] = 0;
        let x = ir.x as usize;
        let y = ir.y as usize;
        let nums = ir.n as usize;
        let vx = vm.r_v[x];
        let vy = vm.r_v[y];

        // 64 * 32
        for yy in 0..nums {
            let sys_byte = vm.memory[(vm.r_i + yy as u16) as usize];

            for xx in 0..8 {
                let x_cord = vx + xx;
                let y_cord = vy + yy as u8;

                if x_cord < vm.screen.columns && y_cord < vm.screen.rows {
                    let sys_bit = (sys_byte >> (7 - xx)) & 0x1;
                    let xy_bit = vm.screen.get_pixel(x_cord, y_cord) as u8;

                    if xy_bit & sys_bit == 1 {
                        vm.r_v[0xF] = 1;
                    }
                    vm.screen.set_pixel(x_cord, y_cord, (xy_bit ^ sys_bit) == 1);
                }
            }
        }

        vm.draw_flag = true;
    }

    /**
     * EX9E
     * Skip the following instruction if the key represented by the value in VX is pressed.
     */
    pub fn skp_vx(vm: &mut Chip8, ir: &Instruction) {
        let i = vm.r_v[ir.x as usize] & 0xF;
        let i = i as usize;
        if vm.keyboard.keys[i] {
            vm.r_pc += 2;
        }
    }

    /**
     * EXA1
     * Skip the following instruction if the key represented by the value in VX is not pressed.
     */
    pub fn sknp_vx(vm: &mut Chip8, ir: &Instruction) {
        let i = vm.r_v[ir.x as usize] & 0xF;
        let i = i as usize;
        if !vm.keyboard.keys[i] {
            vm.r_pc += 2;
        }
    }
    /**
     * FX07
     * Set VX equal to the delay timer.
     */
    pub fn ld_vx_dt(vm: &mut Chip8, ir: &Instruction) {
        vm.r_v[ir.x as usize] = vm.d_timer;
    }

    /**
     * FX0A
     * Wait for a key press and store the value of the key into VX.
     */
    pub fn ld_vx_key(vm: &mut Chip8, ir: &Instruction) {
        let mut key_pressed = false;
        for (i, key) in vm.keyboard.keys.iter().enumerate() {
            if *key {
                vm.r_v[ir.x as usize] = i as u8;
                key_pressed = true;
                break;
            }
        }
        if key_pressed {
            vm.r_pc += 2;
        }
    }

    /**
     * FX15
     * Set the delay timer DT to VX.
     */
    pub fn ld_dt_vx(vm: &mut Chip8, ir: &Instruction) {
        vm.d_timer = vm.r_v[ir.x as usize];
    }

    /**
     * FX18
     * Set the sound timer ST to VX.
     */
    pub fn ld_st_vx(vm: &mut Chip8, ir: &Instruction) {
        vm.s_timer = vm.r_v[ir.x as usize];
    }

    /**
     * FX1E
     * Add VX to I. VF is set to 1 if I > 0x0FFF. Otherwise set to 0.
     */
    pub fn add_i_vx(vm: &mut Chip8, ir: &Instruction) {
        let vx = vm.r_v[ir.x as usize];
        let i = vm.r_i;
        let i_plus_vx = i + vx as u16;
        vm.r_v[0xF] = if i_plus_vx > 0x0FFF { 1 } else { 0 };
        vm.r_i = i_plus_vx & 0x0FFF;
    }

    /**
     * FX29
     * Set I to the address of the CHIP-8 8x5 font sprite representing the value in VX.
     */
    pub fn ld_i_font_vx(vm: &mut Chip8, ir: &Instruction) {
        vm.r_i = vm.r_v[ir.x as usize] as u16 * 5;
    }

    /**
     * FX30
     * Set I to the address of the SCHIP-8 16x10 font sprite representing the value in VX.
     */
    pub fn s8_ld_i_font_vx(vm: &mut Chip8, ir: &Instruction) {
        let val = vm.r_v[ir.x as usize] as u16 * 10;
        vm.r_i = (LARGE_FONT_BASE + val) & 0x0FFF;
    }

    /**
     * FX33
     * Convert that word to BCD and store the 3 digits at memory location I through I+2.
     * I does not change.
     */
    pub fn bcd_vx(vm: &mut Chip8, ir: &Instruction) {
        let vx = vm.r_v[ir.x as usize];
        // 百位
        vm.memory[vm.r_i as usize] = vx / 100;
        // 十位
        vm.memory[(vm.r_i + 1) as usize] = (vx % 100) / 10;
        // 个位
        vm.memory[(vm.r_i + 2) as usize] = vx % 100 % 10;
    }

    /**
     * FX55
     * Store registers V0 through VX in memory starting at location I. I does not change.
     */
    pub fn ld_i_vx(vm: &mut Chip8, ir: &Instruction) {
        for i in 0..=ir.x {
            let i = i as usize;
            vm.memory[(vm.r_i) as usize + i] = vm.r_v[i];
        }
    }

    /**
     * FX65
     * Copy values from memory location I through I + X into registers V0 through VX. I does not change.
     */
    pub fn ld_vx_i(vm: &mut Chip8, ir: &Instruction) {
        for i in 0..=ir.x {
            let i = i as usize;
            vm.r_v[i] = vm.memory[(vm.r_i) as usize + i];
        }
    }

    /**
     * FX75
     * Store V0 through VX to HP-48 RPL user flags (X <= 7).
     */
    pub fn ld_r_vx(vm: &mut Chip8, ir: &Instruction) {
        for i in 0..=ir.x {
            let i = i as usize;
            vm.r_rpl[i] = vm.r_v[i];
        }
    }

    /**
     * FX85
     * Read V0 through VX to HP-48 RPL user flags (X <= 7)
     */
    pub fn ld_vx_r(vm: &mut Chip8, ir: &Instruction) {
        for i in 0..=ir.x {
            let i = i as usize;
            vm.r_v[i] = vm.r_rpl[i];
        }
    }
}
