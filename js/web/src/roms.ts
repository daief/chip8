const sc8 = (name: string, ext: string = 'ch8') =>
  `/chip8/roms/schip8/${name}.${ext}`;
const c8 = (name: string, ext: string = 'ch8') =>
  `/chip8/roms/chip8/${name}.${ext}`;

const a = (name: string, isC8 = true) =>
  `<a target="target" href="${(isC8 ? sc8 : c8)(name, 'txt')}">${name}.txt</a>`;

interface IItem {
  name: string;
  desc: string;
  sc8?: boolean;
}

export const roms: IItem[] = [
  // ------------ sc8
  {
    name: 'ALIEN',
    desc: 'A Space Invaders clone. Start/Shoot with A, Move with 3 and C.  *NOTEA->5 3->4 C->6',
    sc8: true,
  },
  {
    name: 'ANT',
    desc: 'A Mariobross clone... Move with 3 & C, jump with A.  *NOTE3->4 C->6 A->5',
    sc8: true,
  },
  {
    name: 'BLINKY',
    desc: 'A PACMAN clone. Eat the gums in the maze. Avoid being eaten by the enemies. Move with 7/8 (left/right) and 3/6 (up/down). 1 goes to  next level, F skips pause.          *NOTEsame as CHIP-8 blinky',
    sc8: true,
  },
  {
    name: 'CAR',
    desc: 'A car game. Move with 7 and 8s.  *NOTE7->4 8->6',
    sc8: true,
  },
  {
    name: 'DRAGON1',
    desc: `See ${a('DRAGON')}`,
    sc8: true,
  },
  {
    name: 'DRAGON2',
    desc: `See ${a('DRAGON')}`,
    sc8: true,
  },
  {
    name: 'FIELD',
    desc: 'See <a target="target" href="/roms/schip8/FIELD.txt">FIELD.txt</a>',
    sc8: true,
  },
  {
    name: 'HPIPER',
    desc: `A Pipe-mania clone. Move using 7/8 3/6. Place a pipe using 4 or 1. See ${a(
      'HPIPER'
    )}. *NOTE7->4 8->6 3->2 6->8 4->5`,
    sc8: true,
  },
  {
    name: 'JOUST23',
    desc: `See ${a(
      'JOUST23'
    )} (A = start/up, 3/C = left/right)  *NOTEA->5 3->4 C->6`,
    sc8: true,
  },
  {
    name: 'LASER',
    desc: 'Shoot the opponent using your laser gun. E=start 1P game,  F=start 2P game, player 11/4=up/down, 2=fire.  player 2C/D=up/down, 3=fire.',
    sc8: true,
  },
  {
    name: 'MATCHES',
    desc: 'This is a two-player game. Select the number of matches with 1/2/3,          then each player removes 1, 2, or 3 matches using 4/5/6 (player 1)          or 7/8/9 (player 2). The one who gets the last match wins.',
    sc8: true,
  },
  {
    name: 'MAZE',
    desc: 'This little program draws random mazes.',
    sc8: true,
  },
  {
    name: 'MINES',
    desc: `See ${a('MINES')} (2 4 6 8 to move, 5 to show square, C to mark)`,
    sc8: true,
  },
  {
    name: 'RACE',
    desc: 'A car game. Move with 7 and 8.  *NOTE7->4 8->6',
    sc8: true,
  },
  {
    name: 'SPACEFIG',
    desc: `See ${a(
      'SPACEFIG'
    )} (A=start/fire, 3/C=left/right)  *NOTEA->5 3->4 C->6`,
    sc8: true,
  },
  {
    name: 'SQUARE',
    desc: `See ${a('SQUARE')} (2 4 6 8 to move, 5 to select)`,
    sc8: true,
  },
  {
    name: 'UBOAT',
    desc: `See ${a(
      'UBOAT'
    )} (7/8/9 to stop/half speef/full speed,  E to drop depth charge, C to abort game)          *NOTE7/8/9->4/5/6, E->8 C->2`,
    sc8: true,
  },
  {
    name: 'WORM3',
    desc: "Like SYZYGY, you're a snake. You have to eat the eggs which appear a random locations on the screen. As you eat, you grow... Avoid eating yourself or crashing on the extremities of the screen. To turn 90 left, press 8. Press 9 to turn 90 right.  *NOTE2->4 9->6",
    sc8: true,
  },
  // ------------ SCHIP test programs:
  {
    name: 'TEST/BMPviewer',
    desc: 'Draw a bitmap picture.',
    sc8: true,
  },
  {
    name: 'TEST/Emutest',
    desc: 'Test the SCHIP half-line scrolling.',
    sc8: true,
  },
  {
    name: 'TEST/HEX_MIXT',
    desc: 'Draws random characters, and beeps a lot.',
    sc8: true,
  },
  {
    name: 'TEST/LINEDEMO',
    desc: 'Draw lines.',
    sc8: true,
  },
  {
    name: 'TEST/ROBOT',
    desc: '???',
    sc8: true,
  },
  {
    name: 'TEST/SCR_TEST',
    desc: 'Test display capabilities.',
    sc8: true,
  },
  {
    name: 'TEST/TEST',
    desc: 'A little program to show some basic functions of the super-chip          instructions. Not interesting.',
    sc8: true,
  },
  {
    name: 'TEST/TEST_128',
    desc: 'Idem.',
    sc8: true,
  },
  {
    name: 'TEST/WORMS',
    desc: 'Draw random worms.',
    sc8: true,
  },
  // ------------ c8
  {
    name: '15PUZZLE',
    desc: 'You have to move all the items and put them in increasing order,          starting at the upper-left corner. Move the item you want by          pressing his associated key (exto move item 3, press 3).          WARNINGuses the original CHIP8 keyboard, so you may have several          confusions.',
  },
  {
    name: 'AIRPLANE',
    desc: 'You must drop packets from your airplane (key 8) and make sure          they hit the ground without colliding with other planes.',
  },
  {
    name: 'BLINKY',
    desc: 'This game is a PACMAN clone. Your goal is to eat all the balls in          the maze. There are some enemies, so be careful. Use 2 4 6 and 8          to move.          *NOTEreally use 3/6 to go up/down, 7/8 to go left/right, and  F to restart the game. HAS TO BE CHANGED.',
  },
  {
    name: 'BLITZ',
    desc: 'This game is a BOMBER clone. You are in a plane, and you must          destroy the towers of a town. Your plane is flying left to right,          and goes down. Use 5 to drop a bomb. The game ends when you crash          yourself on a tower...',
  },
  {
    name: 'BREAKOUT',
    desc: 'Same than BRIX, but has graphics looking like the game on the          Atari 2600 console.',
  },
  {
    name: 'BRIX',
    desc: 'This game is an "arkanoid" precursor. You have 5 lives, and your          goal is the destruction of all the brixs. Use 4 and 6 to move          your paddle. The game ends when all the brixs are destroyed.',
  },
  {
    name: 'CAVE',
    desc: 'Type F to start, then use 2 4 6 8 to move through the CAVE without          hitting the walls.',
  },
  {
    name: 'CONNECT4',
    desc: "This game is for two players. The goal is to align 4 coins in the          game area. Each player's coins are colored. When you drop a coin,          it is paced on the latest dropped coin in the same column, or at          the bottom if the column is empty. Once the column is full, you          cannot place any more coins in it. To select a column, use 4 and 6.          To drop a coin, use 5. There is no winner detection yet. This will          be soon avalaible (Hey! I don't spend my life on CHIP8 !).",
  },
  {
    name: 'FIGURES',
    desc: "Kind of Tetris with numbers. Use 4 and 6 to move, and 2 do do          something I didn't get.",
  },
  {
    name: 'FILTER',
    desc: 'Catch everything that falls. Use 4 and 6 to move.',
  },
  {
    name: 'GUESS',
    desc: 'Think to a number between 1 and 63. CHIP8 shows you several boards          and you have to tell if you see your number in them. Press 5 if so,          or another key if not. CHIP8 gives you the number...',
  },
  {
    name: 'HIDDEN',
    desc: `See ${a('HIDDEN')} (use 2 4 6 8 to move, 5 to pick)`,
  },
  {
    name: 'INVADERS',
    desc: 'The well known game. Destroy the invaders with your ship. Shoot with 5, move with 4 and 6. Press 5 to begin a game.',
  },
  {
    name: 'LANDING',
    desc: 'Try to flatten the field for landing (?). Key 9 drops a bomb.',
  },
  {
    name: 'KALEID',
    desc: 'A little program (not a game) to make funny graphics. Move around the screen with 2 4 6 8. To finish and make CHIP8 repeat your          moves, press 0.',
  },
  {
    name: 'MAZE',
    desc: 'This little program draws random mazes.',
  },
  {
    name: 'MERLIN',
    desc: 'This is the SIMON game. The goal is to remember in which order the          squares are lighted. The game begins by lighting 4 random squares,          and then asks you to light the squares in the correct order.          You win a level when you give the exact order, and each increasing          level shows a additionnal square. The game ends when you light an          incorrect square. Keys are 4 and 5 for the two upper squares, then          7 and 8 for the two other ones.  *NOTE5->2 8->6 7->8',
  },
  {
    name: 'MISSILE',
    desc: 'You must shoot the 8 targets on the screen using key 8. Your  shooter moves a little bit faster each time you shoot. You  have 12 missiles to shoot all the targets, and you win 5  points per target shot.',
  },
  {
    name: 'PADDLES',
    desc: 'F=1P game, E=2Pgame 7/9=P1 left/right, 4/6=P2 left/right.',
  },
  {
    name: 'PONG(1P)',
    desc: '1-player pong, play against the computer. 1/4=up/down.',
  },
  {
    name: 'PONG (2)',
    desc: 'Here is the well known pong game. Two versions are available.          The only difference is that PONG2 is mostly like the original          game. Player 1 uses 1 and 4, player 2 uses C and D.',
  },
  {
    name: 'PUZZLE',
    desc: 'Same than PUZZLE2. Wait for randomization... Instead of moving the          item by pressing his associated key, move it UP DOWN LEFT RIGHT          with respectively 2 8 4 6. Up and Down are inverted as the game          uses the original CHIP8 keyboard.  *NOTEmust exchange up and down keys.',
  },
  {
    name: 'ROCKET',
    desc: 'Follow the tunnel. B=start, 4/6=left/right.  *NOTEB->5',
  },
  {
    name: 'SOCCER',
    desc: 'Pong-like. 1/4=P1 up/down, C/D=P2 up/down.',
  },
  {
    name: 'SPACEF',
    desc: 'Fly through the screen 3 times to win the level.  F=start, E=start level, 1/4=up/down  *NOTEF->5 E->6',
  },
  {
    name: 'SQUASH',
    desc: 'Exactely same than WALL, except that you have 5 balls, which are          not to be lost...  *NOTE1->2 4->6',
  },
  {
    name: 'SYZYGY',
    desc: 'This game is a SNAFU, or TRON variant. You are a snake, and you are very hungry. So, you eat the "0" which appears on the screen. Each time you eat, your size and score increase. You can choose to play with or without a border by pressing F or E before playing. Use 7 8 3 6 to move respectively LEFT RIGHT UP DOWN. When finished, press B to see the score.  *NOTEchange E/F->2/8 3/6->2/8 7/8->4/6 B->5',
  },
  {
    name: 'TANK',
    desc: 'You are in a tank which has 25 bombs. Your goal is to hit 25 times          a mobile target. The game ends when all your bombs are shot.          If your tank hits the target, you lose 5 bombs. Use 2 4 6 and 8 to          move. This game uses the original CHIP8 keyboard, so directions 2          and 8 are swapped.  *NOTEexchange 2/8',
  },
  {
    name: 'TETRIS',
    desc: "Guess what this game is... I'm sure you don't need the rules. If          you do, please ask your friends. Use 4 to rotate, 5 and 6 to move,          1 to drop a piece.  *NOTE4->5 5->4 1->8",
  },
  {
    name: 'TICTAC',
    desc: 'A TIC-TAC-TOE game. Play with [1] to [9] keys. Each key corresponds          to a square in the grid. The game never ends, so at any time, the          winner is the one who has the best score.',
  },
  {
    name: 'TRON',
    desc: 'B=with borders. F=without borders. 0=start. Player 11/4 3/C.  Player 27/A 9/E.',
  },
  {
    name: 'UFO',
    desc: 'A precursor of INVADERS. You have 15 missiles to shoot on the two          invaders. The big one moves on the left and gives you 5 points.          The small one moves on the right at variant speeds. You can shoot          them in three directionsleft, up and right. Use 4 to shoot on the          left, 5 to shoot up, 6 to shoot on the right. The game ends after          having shot the 15 missiles.',
  },
  {
    name: 'VBRIX',
    desc: 'Like BRIX, but the brix are put vertically, and the pad also moves          vertically. Start by pressing 7, and move using 4 and 1.  *NOTE7->5 1->2 4->6',
  },
  {
    name: 'VERS',
    desc: 'A TRON clone. Keys                                  Left Pl.   Right Pl.                          UP          7          C                          DOWN        A          D                          LEFT        1          B                          RIGHT       2          F',
  },
  {
    name: 'WALL',
    desc: 'One of these PONG variations. Move using 1 and 4. As said in the          early seventies"AVOID MISSING BALL FOR HIGH SCORE" !!!  *NOTE1->2 4->6',
  },
  {
    name: 'WIPEOFF',
    desc: 'Another BRIX variant, but quite hard to play. Move with 4 and 6.          Your score is shown when you lose all your lives.',
  },
  // ------------ CHIP-8 test programs:
  {
    name: 'TEST/C8PIC',
    desc: 'Display the word CHIP8.',
  },
  {
    name: 'TEST/IBM',
    desc: 'Display an IBM logo.',
  },
  {
    name: 'TEST/ROCKET2',
    desc: 'Small animation. F=start.  *NOTEF->5',
  },
  {
    name: 'TEST/TAPEWORM',
    desc: 'Make a very long snake. F=start, 2 4 6 8=turn.  *NOTEF->5',
  },
  {
    name: 'TEST/TIMEBOMB',
    desc: 'Chronometer. 2/8Set time. 5Start.',
  },
  {
    name: 'TEST/X-MIRROR',
    desc: 'Draws symmetric patterns using 2 4 6 8.',
  },
];

export async function loadRom(it: IItem) {
  return await fetch(it.sc8 ? sc8(it.name) : c8(it.name))
    .then((resp) => {
      if (!resp.ok) {
        console.warn('Fetch rom error', {
          item: it,
          response: resp,
        });
        throw new Error('Fetch rom error');
      }
      return resp.arrayBuffer();
    })
    .then((ab) => new Uint8Array(ab));
}
