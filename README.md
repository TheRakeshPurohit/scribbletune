<p align="center">
  <img width="64" src="https://scribbletune.com/images/scribbletune-logo.png" alt="Scribbletune">
</p>

<h1 align="center">Scribbletune</h1>

<p align="center">
  Create music with JavaScript. Use simple strings and arrays to craft rhythms, melodies, and chord progressions — then export MIDI files or play them live in the browser with <a href="https://tonejs.github.io/">Tone.js</a>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/scribbletune"><img src="https://img.shields.io/npm/v/scribbletune.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/scribbletune"><img src="https://img.shields.io/npm/l/scribbletune.svg" alt="license"></a>
</p>

---

## Install

```bash
npm install scribbletune
```

## Quick start

### CLI

The package now ships a CLI binary: `scribbletune`.

Run modes:

```bash
# Global install
npm install -g scribbletune
scribbletune --help

# Local/project install
npm install scribbletune
npx scribbletune --help
```

Quick command examples:

```bash
# Use built file directly from repo (before publish)
node dist/cli.cjs --help

# Use local package binary
npx scribbletune --help

# If installed globally
scribbletune --help
```

#### Command format

```bash
scribbletune --riff <root> <mode> <pattern> [octaveShift] [motif] [options]
scribbletune --chord <root> <mode> <progression|random> <pattern> [subdiv] [options]
scribbletune --arp <root> <mode> <progression|random> <pattern> [subdiv] [options]
```

Progression input rules for `--chord` and `--arp`:

```bash
1645            # degree digits
"I IV vi V"     # roman numerals (space separated)
I,IV,vi,V       # roman numerals (comma separated)
random          # generated progression
CM-FM-Am-GM     # explicit chord names
```

Notes:
- Hyphenated romans like `I-IV-vi-V` are not supported currently.
- For explicit chords (`CM-FM-Am-GM`), `root` and `mode` are currently ignored.

Common options:

```bash
--outfile <file.mid>    # default: music.mid
--bpm <number>
--subdiv <4n|8n|1m...>
--sizzle [sin|cos|rampUp|rampDown] [reps]
--sizzle-reps <number>
--amp <0-127>
--accent <x--x...>
--accent-low <0-127>
--fit-pattern         # explicit enable (already enabled by default)
--no-fit-pattern      # disable automatic pattern fitting
```

Note: if your pattern uses `[` and `]` (for subdivisions), quote it in shell:

```bash
scribbletune --arp C3 major 1 'x-x[xx]-x-[xx]' 16n
```

Pattern helpers:

```bash
x.repeat(4)       # -> xxxx
'x-x[xx]'.repeat(2)
2(x-x[xx])        # prefix repeat shorthand
(x-x[xx])2        # suffix repeat shorthand
```

#### `--riff` examples

```bash
# Basic riff from scale
scribbletune --riff C3 phrygian x-xRx_RR --outfile riff.mid

# With octave shift and motif
scribbletune --riff C3 phrygian x-xRx_RR 0 AABC --sizzle sin 2 --outfile riff-aabc.mid

# Pattern with subdivisions (quote [] in shell)
scribbletune --riff C3 phrygian 'x-x[xx]-x-[xx]' 0 AABC --outfile riff-subdiv.mid
```

#### `--chord` examples

```bash
# Degree digits (resolved against root/mode)
scribbletune --chord C3 major 1645 xxxx 1m --sizzle cos 1 --outfile chords-1645.mid

# Roman numerals (space/comma separated)
scribbletune --chord C3 major "I IV vi V" xxxx 1m --outfile chords-roman.mid

# Random progression
scribbletune --chord C3 major random xxxx 1m --outfile chords-random.mid

# Explicit chord names (root/mode currently ignored for this style)
scribbletune --chord C3 major CM-FM-Am-GM xxxx 1m --outfile chords-explicit.mid

# Subdivisions in pattern
scribbletune --chord C3 major I,IV,vi,V 'x-x[xx]-x-[xx]' 8n --outfile chords-subdiv.mid
```

#### `--arp` examples

```bash
# Arp from degree progression
scribbletune --arp C3 major 1736 xxxx 1m --sizzle cos 4 --outfile arp-1736.mid

# Single degree "1" means tonic chord in the chosen key/mode
scribbletune --arp C3 major 1 xxxx 4n --outfile arp-degree-1.mid

# Arp from explicit chords
scribbletune --arp C3 major CM-FM-Am-GM xxxx 1m --count 4 --order 1234 --outfile arp-explicit.mid

# Custom note order inside each arpeggiated chord (one-based)
scribbletune --arp C3 major 1 xxxx 4n --order 2143 --outfile arp-order-2143.mid

# Same custom order using local dist build
node dist/cli.cjs --arp C3 major 1 xxxx 4n --order 2143 --outfile arp-order-local.mid

# Auto-fit is default (single x expands to full generated arp length)
scribbletune --arp C3 major 1736 x 4n --outfile arp-fit-default.mid

# Disable auto-fit if you want a short clip
scribbletune --arp C3 major 1736 x 4n --no-fit-pattern --outfile arp-no-fit.mid
```

`--order` behavior:
- One-based order is supported (`1234`, `2143`) and is recommended.
- Zero-based order is also accepted for backward compatibility (`0123`, `1032`).

Run `scribbletune --help` to see the latest CLI usage text.

### Generate a MIDI file (Node.js)

```js
import { scale, clip, midi } from 'scribbletune';

const notes = scale('C4 major');
const c = clip({ notes, pattern: 'x'.repeat(8) });

midi(c, 'c-major.mid');
```

Run it with `node` and open the `.mid` file in Ableton Live, GarageBand, Logic, or any DAW.

### Play in the browser (with Tone.js)

Scribbletune's browser entry point adds `Session`, `Channel`, and live `clip()` support on top of [Tone.js](https://tonejs.github.io/).

```js
import { Session } from 'scribbletune/browser';

const session = new Session();
const channel = session.createChannel({
  instrument: 'PolySynth',
  clips: [
    { pattern: 'x-x-', notes: 'C4 E4 G4' },
    { pattern: '[-xx]', notes: 'C4 D#4' },
  ],
});

await Tone.start();
Tone.Transport.start();
channel.startClip(0);
```

### Standalone sample clip (no Session/Channel needed)

```js
import { clip } from 'scribbletune/browser';

await Tone.start();
Tone.Transport.start();

const kick = clip({
  sample: 'https://scribbletune.com/sounds/kick.wav',
  pattern: 'x-x-',
});
kick.start();
```

## Core concepts

### Pattern language

Scribbletune uses a simple string notation to describe rhythms:

| Char | Meaning |
|------|---------|
| `x` | Note on |
| `-` | Note off (rest) |
| `_` | Sustain previous note |
| `R` | Random note (from `randomNotes` pool) |
| `[]` | Subdivide (e.g. `[xx]` = two notes in one beat) |

```js
'x---x---x-x-x---'   // basic kick pattern
'[xx][xx]x-x-'        // hihat with subdivisions
'x___'                 // one long sustained note
```

### Scales and chords

Powered by [harmonics](https://github.com/scribbletune/harmonics):

```js
import { scale, chord, scales, chords } from 'scribbletune';

scale('C4 major');       // ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']
chord('CM');             // ['C4', 'E4', 'G4']
scales();                // list all available scale names
chords();                // list all available chord names
```

### Arpeggios

```js
import { arp } from 'scribbletune';

arp({ chords: 'CM FM', count: 4, order: '0123' });
// ['C4', 'E4', 'G4', 'C5', 'F4', 'A4', 'C5', 'F5']
```

### Chord progressions

```js
import { progression, getChordsByProgression } from 'scribbletune';

progression('M', 4);  // e.g. ['I', 'ii', 'V', 'IV']

getChordsByProgression('C4 major', 'I IV V IV');
// 'CM_4 FM_4 GM_4 FM_4'
```

## Browser API

The browser entry point (`scribbletune/browser`) provides everything above plus:

### Session and Channel

```js
import { Session } from 'scribbletune/browser';

const session = new Session();
const drums = session.createChannel({
  sample: 'https://scribbletune.com/sounds/kick.wav',
  clips: [
    { pattern: 'x---x---' },
    { pattern: 'x-x-x-x-' },
  ],
});

const synth = session.createChannel({
  instrument: 'PolySynth',
  clips: [
    { pattern: 'x-x-', notes: 'C4 E4 G4' },
  ],
});

await Tone.start();
Tone.Transport.start();

// Start clips independently
drums.startClip(0);
synth.startClip(0);

// Switch patterns on the fly
drums.startClip(1);

// Or start a row across all channels
session.startRow(0);
```

### Channel options

Channels accept various sound sources:

```js
// Built-in Tone.js synth (by name)
{ instrument: 'PolySynth' }

// Pre-built Tone.js instrument
{ instrument: new Tone.FMSynth() }

// Audio sample URL
{ sample: 'https://example.com/kick.wav' }

// Multi-sample instrument
{ samples: { C3: 'piano-c3.wav', D3: 'piano-d3.wav' } }

// With effects
{ instrument: 'PolySynth', effects: ['Chorus', 'Reverb'] }
```

## API reference

| Export | Description |
|--------|-------------|
| `clip(params)` | Create a clip — returns note objects (Node.js) or a Tone.Sequence (browser) |
| `midi(clip, filename?)` | Export a clip to a MIDI file |
| `scale(name)` | Get notes of a scale, e.g. `'C4 minor'` |
| `chord(name)` | Get notes of a chord, e.g. `'CM'` |
| `scales()` | List all available scale names |
| `chords()` | List all available chord names |
| `arp(params)` | Generate arpeggiated note sequences |
| `progression(type, count)` | Generate a chord progression (`'M'` or `'m'`) |
| `getChordsByProgression(scale, degrees)` | Convert Roman numeral degrees to chord names |
| `getChordDegrees(mode)` | Get Roman numeral degrees for a mode |
| `Session` | _(browser only)_ Manage multiple channels and coordinate playback |

## Development

```bash
npm install       # install dependencies
npm test          # run tests
npm run build     # build with tsup
npm run lint      # check with biome
npm run dev       # build in watch mode
```

## License

MIT

---

[scribbletune.com](https://scribbletune.com) | [Soundcloud](https://soundcloud.com/scribbletune)
