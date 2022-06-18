#[derive(Debug)]
pub struct Screen {
    pub rows: u8,
    pub columns: u8,

    pub bit_map: Vec<bool>,
}

impl Screen {
    pub fn new() -> Self {
        Screen {
            rows: 64,
            columns: 128,
            bit_map: vec![false; 128 * 64],
        }
    }

    pub fn clear(&mut self) {
        self.bit_map.fill(false);
    }

    fn get_i(&self, x: u8, y: u8) -> usize {
        (y as usize) * self.columns as usize + x as usize
    }

    pub fn set_pixel(&mut self, x: u8, y: u8, value: bool) {
        let i = self.get_i(x, y);
        self.bit_map[i] = value;
    }

    pub fn get_pixel(&self, x: u8, y: u8) -> bool {
        self.bit_map[self.get_i(x, y)]
    }
}

#[derive(Debug)]
pub struct Keyboard {
    pub keys: Vec<bool>,
}

impl Keyboard {
    pub fn new() -> Self {
        Keyboard {
            keys: vec![false; 16],
        }
    }

    /// keyboard map to chip8 key code
    /// 1: 0x1, 2: 0x2, 3: 0x3, 4: 0xc,
    /// q: 0x4, w: 0x5, e: 0x6, r: 0xd,
    /// a: 0x7, s: 0x8, d: 0x9, f: 0xe,
    /// z: 0xa, x: 0x0, c: 0xb, v: 0xf,
    fn map_to(&mut self, key: char) -> Option<usize> {
        match key {
            '1' => Some(0x1),
            '2' => Some(0x2),
            '3' => Some(0x3),
            '4' => Some(0xC),

            'q' => Some(0x4),
            'w' => Some(0x5),
            'e' => Some(0x6),
            'r' => Some(0xD),

            'a' => Some(0x7),
            's' => Some(0x8),
            'd' => Some(0x9),
            'f' => Some(0xE),

            'z' => Some(0xA),
            'x' => Some(0x0),
            'c' => Some(0xB),
            'v' => Some(0xF),
            _ => None,
        }
    }

    pub fn reset(&mut self) {
        self.keys.fill(false);
    }

    pub fn key_down(&mut self, key: char) -> bool {
        if let Some(key_code) = self.map_to(key) {
            self.keys[key_code as usize] = true;
            return true;
        }
        false
    }

    pub fn key_up(&mut self, key: char) -> bool {
        if let Some(key_code) = self.map_to(key) {
            self.keys[key_code as usize] = false;
            return true;
        }
        false
    }
}
