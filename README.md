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
