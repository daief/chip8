# (s)chip8 Emulator

资料：

- [CHIP-8 - wiki](https://en.wikipedia.org/wiki/CHIP-8)
- https://github.com/benc-uk/chip8
- [用 JavaScript 编写 Chip-8 模拟器](https://www.jianshu.com/p/87c7fdf1d0e7)
- [用 Rust 实现一个 CHIP-8 模拟器](http://blog.yanick.site/2020/11/05/rust/impl-CHIP-8-emulator-in-rust/)
- [Chip8 in python3](https://rsj217.github.io/chip8-py/)
- http://devernay.free.fr/hacks/chip8/
- [(S)Chip8 指令集](https://github.com/trapexit/chip-8_documentation)
- https://github.com/craigthomas/Chip8Python/

### 内存

```
+---------------+= 0x000 (0) Start of Chip-8 RAM
| 0x000 to 0x1FF|
| Reserved for  |
|  interpreter  |
+---------------+= 0x200 (512) Start of most Chip-8 programs
|               |
|               |
|               |
+- - - - - - - -+= 0x600 (1536) Start of ETI 660 Chip-8 programs
|               |
|               |
|               |
|               |
|               |
| 0x200 to 0xFFF|
|     Chip-8    |
| Program / Data|
|     Space     |
|               |
|               |
|               |
+---------------+= 0xFFF (4095) End of Chip-8 RAM
```

Chip8 的内存是 **4-KB** 的大小。每一个内存单元大小为 8-bit，即 1-byte。编号从 0x0000 开始，最后一个是 0x0FFF，从上往下，编号依次变大。一共可以分为 4096(4 \* 1024) 个内存单元。内存的地址大小可以使用 12-bit 大小。 地址的描述通常使用三位的十六进制表示。即 0x200，0xFFF 等

`0x000 ~ 0x1FF` 范围的地址是 chip8 系统内存空间，模拟器用这部分内容存储 Font 数据。

字体是 `0~f` 的的数据数字数据，每一个数字有 5-bytes 大小，8x5 个像素：

```
+---------------------+-----------------+--------------------+-------------------+
| Symbol  | Address   | Sprite          | Binary             | Hex               |
+=====================+=================+====================+===================+
| 0       | 0x050     | ****            | 11110000           | 0xF0              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | ****            | 11110000           | 0xF0              |
+---------+-----------+-----------------+--------------------+-------------------+
| 1       | 0x055     |   *             | 00100000           | 0x20              |
|         |           |  **             | 01100000           | 0x60              |
|         |           |   *             | 00100000           | 0x20              |
|         |           |   *             | 00100000           | 0x20              |
|         |           |  ***            | 01110000           | 0x70              |
+---------+-----------+-----------------+--------------------+-------------------+
| 2       | 0x05A     | ****            | 11110000           | 0xF0              |
|         |           |    *            | 00010000           | 0x10              |
|         |           | ****            | 11110000           | 0xF0              |
|         |           | *               | 10000000           | 0x80              |
|         |           | ****            | 11110000           | 0xF0              |
+---------+-----------+-----------------+--------------------+-------------------+
| 3       | 0x05F     | ****            | 11110000           | 0xF0              |
|         |           |    *            | 00010000           | 0x10              |
|         |           | ****            | 11110000           | 0xF0              |
|         |           |    *            | 00010000           | 0x10              |
|         |           | ****            | 11110000           | 0xF0              |
+---------+-----------+-----------------+--------------------+-------------------+
| 4       | 0x064     | *  *            | 10010000           | 0x90              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | ****            | 11110000           | 0xF0              |
|         |           |    *            | 00010000           | 0x10              |
|         |           |    *            | 00010000           | 0x10              |
+---------+-----------+-----------------+--------------------+-------------------+
| 5       | 0x069     | ****            | 11110000           | 0xF0              |
|         |           | *               | 10000000           | 0x80              |
|         |           | ****            | 11110000           | 0xF0              |
|         |           |    *            | 00010000           | 0x10              |
|         |           | ****            | 11110000           | 0xF0              |
+---------+-----------+-----------------+--------------------+-------------------+
| 6       | 0x06E     | ****            | 11110000           | 0xF0              |
|         |           | *               | 10000000           | 0x80              |
|         |           | ****            | 11110000           | 0xF0              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | ****            | 11110000           | 0xF0              |
+---------+-----------+-----------------+--------------------+-------------------+
| 7       | 0x073     | ****            | 11110000           | 0xF0              |
|         |           |    *            | 00010000           | 0x10              |
|         |           |   *             | 00100000           | 0x20              |
|         |           |  *              | 01000000           | 0x40              |
|         |           |  *              | 01000000           | 0x40              |
+---------+-----------+-----------------+--------------------+-------------------+
| 8       | 0x078     | ****            | 11110000           | 0xF0              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | ****            | 11110000           | 0xF0              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | ****            | 11110000           | 0xF0              |
+---------+-----------+-----------------+--------------------+-------------------+
| 9       | 0x07D     | ****            | 11110000           | 0xF0              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | ****            | 11110000           | 0xF0              |
|         |           |    *            | 00010000           | 0x10              |
|         |           | ****            | 11110000           | 0xF0              |
+---------+-----------+-----------------+--------------------+-------------------+
| 10      | 0x082     | ****            | 11110000           | 0xF0              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | ****            | 11110000           | 0xF0              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | *  *            | 10010000           | 0x90              |
+---------+-----------+-----------------+--------------------+-------------------+
| 11      | 0x087     | ***             | 11100000           | 0xE0              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | ***             | 11100000           | 0xE0              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | ***             | 11100000           | 0xE0              |
+---------+-----------+-----------------+--------------------+-------------------+
| 12      | 0x08C     | ****            | 11110000           | 0xF0              |
|         |           | *               | 10000000           | 0x80              |
|         |           | *               | 10000000           | 0x80              |
|         |           | *               | 10000000           | 0x80              |
|         |           | ****            | 11110000           | 0xF0              |
+---------+-----------+-----------------+--------------------+-------------------+
| 13      | 0x091     | ***             | 11100000           | 0xE0              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | *  *            | 10010000           | 0x90              |
|         |           | ***             | 11100000           | 0xE0              |
+---------+-----------+-----------------+--------------------+-------------------+
| 14      | 0x096     | ****            | 11110000           | 0xF0              |
|         |           | *               | 10000000           | 0x80              |
|         |           | ****            | 11110000           | 0xF0              |
|         |           | *               | 10000000           | 0x80              |
|         |           | ****            | 11110000           | 0xF0              |
+---------+-----------+-----------------+--------------------+-------------------+
| 15      | 0x09B     | ****            | 11110000           | 0xF0              |
|         |           | *               | 10000000           | 0x80              |
|         |           | ****            | 11110000           | 0xF0              |
|         |           | *               | 10000000           | 0x80              |
|         |           | *               | 10000000           | 0x80              |
+---------+-----------+-----------------+--------------------+-------------------+
```

### CPU

Chip8 的 CPU 主要用寄存器(register)， 定时器(timer)，按键缓存(key_pressed_buf)，屏幕缓存(screen_buf)组成。

- 寄存器：
  - 通用寄存器：16 个 8-bit 的通用寄存器，记为 V0 ~ VF，其中 VF 用来表示 flag 标记。可以用一个 16 长度数组表示，数组的每一个元素是一个寄存器，每个元素的类型是 uint8
  - 程序计数器：一个 16-bit 的程序计数器，即 PC 寄存器。初始值为 0x200。Chip8 的内存是 4k，实际上 PC 的最大值是 12-bit。
  - 索引寄存器：一个 16-bit 的地址索引寄存器。
  - 栈顶寄存器：8-bit 的栈顶寄存器，指向当前栈顶。内存直接使用了具有栈特点的数据结构模拟，这个寄存器可以忽略。
- 计时器：两个 8-bit 的定时器，一个 delay timer, 一个 sound timer，都按照 60hz 的频率递减直到 0
- 按键缓存：使用一个大小 16 的列表作为按键缓存，映射了 Chip8 的按键，按下的键其值为 1，未按的键是 0
- 屏幕缓存：传统的 Chip8 使用内存的 0xF00 ~ 0xFFF 用作屏幕缓存。模拟则可以使用另外的数据来存储

### Keyboard

chip8 的键盘、及布局如左图所示，程序模拟，将键盘（右图）的按键映射到 Chip8 的按键。

```
1 2 3 C        1 2 3 4
4 5 6 D   ->   Q W E R
7 8 9 E        A S D F
A 0 B F        Z X C V
```
