import { createChip8 } from 'chip8_js';
import './roms';
import '@picocss/pico';
import { loadRom, roms } from './roms';
import 'nprogress/nprogress.css';
// @ts-ignore
import NProgress from 'nprogress';

const $id = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as any as T;

const chip8 = createChip8();
// @ts-ignore
window.chip8 = chip8;

$id('footerYear').innerHTML = new Date().getFullYear().toString();

const $canvas = $id<HTMLCanvasElement>('gameGrid');
$canvas.width = 640;
$canvas.height = 320;
const canvasCtx = $canvas.getContext('2d')!;
canvasCtx.fillStyle = '#000';
canvasCtx.fillRect(0, 0, $canvas.width, $canvas.height);

const $keys = $id<HTMLDivElement>('keys');
const $audio = $id<HTMLAudioElement>('audio');
const $romSelect = $id<HTMLSelectElement>('rom');

// --------------- initital dom state
$romSelect.innerHTML = roms
  .map(
    (it, i) =>
      `<option value="${i}">${it.name}${it.sc8 ? '(SC8)' : ''}</option>`
  )
  .join('');
$romSelect.value = '3';

const keyEntries = Object.entries(chip8.keyboard.KEY_MAP);
$keys.innerHTML = keyEntries
  .map(
    (it) =>
      `<div class="key-cell" data-key="${it[0]}">
        ${it[1].toString(16).toUpperCase()}
        <sup>${it[0].toUpperCase()}</sup>
      </div>`
  )
  .join('');

// --------------- define functions

const draw = () => {
  if (!chip8.cpu.drawFlag) return;
  chip8.cpu.drawFlag = false;
  const cellSize = {
    w: $canvas.width / chip8.display.columns,
    h: $canvas.height / chip8.display.rows,
  };

  if (!chip8.highRes) {
    cellSize.w *= 2;
    cellSize.h *= 2;
  }

  canvasCtx.clearRect(0, 0, $canvas.width, $canvas.height);
  for (let y = 0; y < chip8.display.rows; y++) {
    for (let x = 0; x < chip8.display.columns; x++) {
      canvasCtx.fillStyle = chip8.display.getPixel(x, y) ? '#6cf' : '#000';
      canvasCtx.fillRect(
        x * cellSize.w,
        y * cellSize.h,
        cellSize.w,
        cellSize.h
      );
    }
  }
};

let stop: VoidFunction;
const run = () => {
  stop?.();

  let t2 = requestAnimationFrame(function loop(t) {
    let count = 16 / (1000 / chip8.RATE);
    while (count > 0) {
      chip8.cpu.cycle();
      count--;
    }

    chip8.cpu.ticker();
    if (chip8.cpu.soundTimer) $audio.play();
    draw();
    t2 = requestAnimationFrame(loop);
  });

  const onDown = (e: KeyboardEvent) => {
    if (chip8.keyboard.keyDown(e.key)) {
      $keys.querySelector(`[data-key=${e.key}]`)!.classList.add('active');
    }
  };
  const onUp = (e: KeyboardEvent) => {
    if (chip8.keyboard.keyUp(e.key)) {
      $keys.querySelector(`[data-key=${e.key}]`)!.classList.remove('active');
    }
  };
  // bind key event
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);

  stop = () => {
    cancelAnimationFrame(t2);
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
  };
};

const loadAndRun = async () => {
  canvasCtx.clearRect(0, 0, $canvas.width, $canvas.height);
  chip8.reset();
  stop?.();
  const rom = roms[+$romSelect.value];
  $id('desc').innerHTML = rom.desc;
  try {
    NProgress.start();
    const uintRom = await loadRom(rom);
    chip8.loadRom(uintRom);
    console.log('load done.');
    run();
  } catch (error: any) {
    alert('Fetch rom error：' + error.response.statusText);
  } finally {
    NProgress.done();
  }
};

const togglePause = () => {
  if (!chip8.toggleRunning()) {
    stop?.();
  } else {
    run();
  }
};

// --------------- addEventListener

$id<HTMLButtonElement>('start').addEventListener('click', loadAndRun);

$id('pause').addEventListener('click', togglePause);

$romSelect.addEventListener('keydown', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      return loadAndRun();
    case 'KeyP':
      return togglePause();
  }
});

['touchstart', 'mousedown'].forEach((ev) => {
  $keys.addEventListener(ev, (e) => {
    const target = e.target as HTMLDivElement;
    if (!target.classList.contains('key-cell')) return;
    const key = target.dataset.key!;
    chip8.keyboard.keyDown(key);
  });
});

['mouseup', 'touchend', 'touchcancel'].forEach((ev) => {
  $keys.addEventListener(ev, () => {
    chip8.keyboard.reset();
  });
});
