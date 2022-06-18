#![allow(clippy::new_without_default)]

extern crate wasm_bindgen;

use chip8_core::vm::Chip8;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {}

#[wasm_bindgen]
pub struct Emulator {
    chip8: Chip8,
}

#[wasm_bindgen]
impl Emulator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Emulator {
            chip8: Chip8::create(),
        }
    }

    pub fn is_draw_flag(&self) -> bool {
        self.chip8.draw_flag
    }

    pub fn set_draw_flag(&mut self, flag: bool) {
        self.chip8.draw_flag = flag;
    }

    pub fn get_columns(&self) -> u8 {
        self.chip8.screen.columns
    }

    pub fn get_rows(&self) -> u8 {
        self.chip8.screen.rows
    }

    pub fn get_high_res(&self) -> bool {
        self.chip8.high_res
    }

    pub fn get_pixel(&self, x: u8, y: u8) -> bool {
        self.chip8.screen.get_pixel(x, y)
    }

    pub fn get_rate(&self) -> u16 {
        self.chip8.rate
    }

    pub fn cycle(&mut self) {
        self.chip8.cycle();
    }

    pub fn ticker(&mut self) {
        self.chip8.ticker();
    }

    pub fn key_down(&mut self, key: char) -> bool {
        self.chip8.keyboard.key_down(key)
    }

    pub fn key_up(&mut self, key: char) -> bool {
        self.chip8.keyboard.key_up(key)
    }

    pub fn reset(&mut self) {
        self.chip8.reset();
    }

    pub fn load_rom(&mut self, rom: Vec<u8>) {
        let _ = self.chip8.load_rom(&rom);
    }

    pub fn toggle_running(&mut self) -> bool {
        self.chip8.running = !self.chip8.running;
        self.chip8.running
    }

    pub fn reset_keys(&mut self) {
        self.chip8.keyboard.reset();
    }

    pub fn get_sound_timer(&self) -> u8 {
        self.chip8.s_timer
    }
}
