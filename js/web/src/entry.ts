import { KEY_MAP } from 'chip8_js';
import '@picocss/pico';
import { loadRom, roms } from './roms';
import 'nprogress/nprogress.css';
// @ts-ignore
import NProgress from 'nprogress';
import { init } from './init';
import { $id } from './utils';

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
const $sourceSelect = $id<HTMLSelectElement>('sourceType');

$sourceSelect.addEventListener('change', (e) => {
  const el = e.target as HTMLSelectElement;
  const s = new URLSearchParams(window.location.search);
  s.set('source', el.value);
  location.replace(location.href.split('?')[0] + '?' + s.toString());
});

// ------------------------ initital dom state
$romSelect.innerHTML = roms
  .map(
    (it, i) =>
      `<option value="${i}">${it.name}${it.sc8 ? '(SC8)' : ''}</option>`
  )
  .join('');
$romSelect.value = '3';

$sourceSelect.value =
  new URLSearchParams(window.location.search).get('source') || 'js';

const keyEntries = Object.entries(KEY_MAP);
$keys.innerHTML = keyEntries
  .map(
    (it) =>
      `<div class="key-cell" data-key="${it[0]}">
        ${it[1].toString(16).toUpperCase()}
        <sup>${it[0].toUpperCase()}</sup>
      </div>`
  )
  .join('');

// ------------------------ start main

$romSelect.value = '13';

init($sourceSelect.value === 'wasm').then((chip8) => {
  // @ts-ignore
  window.chip8 = chip8;
  const draw = () => {
    if (!chip8.isDrawFlag()) return;
    chip8.setDrawFlag(false);
    const cellSize = {
      w: $canvas.width / chip8.columns(),
      h: $canvas.height / chip8.rows(),
    };

    if (!chip8.highRes()) {
      cellSize.w *= 2;
      cellSize.h *= 2;
    }

    canvasCtx.clearRect(0, 0, $canvas.width, $canvas.height);
    for (let y = 0; y < chip8.rows(); y++) {
      for (let x = 0; x < chip8.columns(); x++) {
        canvasCtx.fillStyle = chip8.getPixel(x, y) ? '#6cf' : '#000';
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
      let count = 16 / (1000 / chip8.rate());
      while (count > 0) {
        chip8.cycle();
        count--;
      }

      chip8.ticker();
      if (chip8.soundTimer()) $audio.play();
      draw();
      t2 = requestAnimationFrame(loop);
    });

    const onDown = (e: KeyboardEvent) => {
      if (chip8.keyDown(e.key)) {
        $keys.querySelector(`[data-key=${e.key}]`)!.classList.add('active');
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (chip8.keyUp(e.key)) {
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
      chip8.keyDown(key);
    });
  });

  ['mouseup', 'touchend', 'touchcancel'].forEach((ev) => {
    $keys.addEventListener(ev, () => {
      chip8.resetKeys();
    });
  });
});
