import { scale } from 'harmonics';
import { arp } from './arp';
import { clip } from './clip';
import { midi } from './midi';
import {
  getChordDegrees,
  getChordsByProgression,
  progression,
} from './progression';
import type { ClipParams, NoteObject, SizzleStyle } from './types';

type CommandType = 'riff' | 'chord' | 'arp';

type CliDeps = {
  writeMidi?: (notes: NoteObject[], fileName: string, bpm?: number) => void;
  stdout?: (msg: string) => void;
  stderr?: (msg: string) => void;
};

type ParsedOptions = {
  command: CommandType;
  positionals: string[];
  outfile: string;
  bpm?: number;
  amp?: number;
  accent?: string;
  accentLow?: number;
  sizzle?: boolean | SizzleStyle;
  sizzleReps?: number;
  subdiv?: string;
  count?: number;
  order?: string;
};

const HELP_TEXT = `Usage:
  scribbletune --riff <root> <mode> <pattern> [octaveShift] [motif]
  scribbletune --chord <root> <mode> <progression|random> <pattern> [subdiv]
  scribbletune --arp <root> <mode> <progression|random> <pattern> [subdiv]

Examples:
  scribbletune --riff C3 phrygian x-xRx_RR 0 AABC --sizzle sin 2 --outfile riff.mid
  scribbletune --chord C3 major 1645 xxxx 1m --sizzle cos 1 --outfile chord.mid
  scribbletune --chord C3 major CM-FM-Am-GM xxxx 1m
  scribbletune --chord C3 major random xxxx 1m
  scribbletune --arp C3 major 1736 xxxx 1m --sizzle cos 4

Options:
  --outfile <name>      Output MIDI filename (default: music.mid)
  --bpm <number>        Tempo in BPM
  --subdiv <value>      Note subdivision (e.g. 4n, 1m)
  --sizzle [style] [n]  Sizzle style: sin|cos|rampUp|rampDown and optional reps
  --sizzle-reps <n>     Repetitions for sizzle
  --amp <0-127>         Maximum note level
  --accent <pattern>    Accent pattern using x and -
  --accent-low <0-127>  Accent low level
  --count <2-8>         Arp note count (arp command only)
  --order <digits>      Arp order string (arp command only)
  -h, --help            Show this help
`;

const romanByDigit = (
  progDigits: string,
  mode: string
): { chordDegrees: string; raw: string } => {
  const modeForDegrees = mode.toLowerCase();
  const chordDegrees = getChordDegrees(modeForDegrees);
  if (!chordDegrees.length) {
    throw new TypeError(`Unsupported mode "${mode}" for progression digits`);
  }

  const romans = progDigits.split('').map(digit => {
    const idx = Number(digit) - 1;
    if (idx < 0 || idx >= chordDegrees.length) {
      throw new TypeError(`Invalid progression digit "${digit}" in "${progDigits}"`);
    }
    return chordDegrees[idx];
  });

  return { chordDegrees: romans.join(' '), raw: progDigits };
};

const setOctave = (note: string, octaveShift = 0): string => {
  const base = note.replace(/\d+/g, '');
  const oct = Number((note.match(/\d+/)?.[0] || '4') as string);
  return `${base}${oct + octaveShift}`;
};

const parseProgression = (
  root: string,
  mode: string,
  progressionInput: string
): string => {
  if (progressionInput === 'random') {
    const modeType = mode === 'minor' || mode === 'm' ? 'minor' : 'major';
    const randomProg = progression(modeType, 4).join(' ');
    return getChordsByProgression(`${root} ${mode}`, randomProg);
  }

  if (/^[1-7]+$/.test(progressionInput)) {
    const converted = romanByDigit(progressionInput, mode);
    return getChordsByProgression(`${root} ${mode}`, converted.chordDegrees);
  }

  if (/^[ivIV°+7\s,]+$/.test(progressionInput)) {
    const normalized = progressionInput.replace(/\s*,+\s*/g, ' ');
    return getChordsByProgression(`${root} ${mode}`, normalized);
  }

  return progressionInput.replace(/-/g, ' ');
};

const parseCliArgs = (argv: string[]): ParsedOptions | null => {
  if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
    return null;
  }

  let commandArg = argv[0];
  if (commandArg.startsWith('--')) {
    commandArg = commandArg.slice(2);
  }
  if (commandArg !== 'riff' && commandArg !== 'chord' && commandArg !== 'arp') {
    throw new TypeError(
      `First argument must be riff/chord/arp (or --riff/--chord/--arp), received "${argv[0]}"`
    );
  }

  const positionals: string[] = [];
  const options: ParsedOptions = {
    command: commandArg,
    positionals,
    outfile: 'music.mid',
  };

  let i = 1;
  while (i < argv.length) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      positionals.push(token);
      i++;
      continue;
    }

    if (token === '--outfile') {
      options.outfile = argv[i + 1];
      i += 2;
      continue;
    }

    if (token === '--bpm') {
      options.bpm = Number(argv[i + 1]);
      i += 2;
      continue;
    }

    if (token === '--subdiv') {
      options.subdiv = argv[i + 1];
      i += 2;
      continue;
    }

    if (token === '--sizzle') {
      const styleOrNum = argv[i + 1];
      const maybeNum = argv[i + 2];
      if (!styleOrNum || styleOrNum.startsWith('--')) {
        options.sizzle = true;
        i += 1;
        continue;
      }
      if (/^\d+$/.test(styleOrNum)) {
        options.sizzle = true;
        options.sizzleReps = Number(styleOrNum);
        i += 2;
        continue;
      }
      options.sizzle = styleOrNum as SizzleStyle;
      if (maybeNum && /^\d+$/.test(maybeNum)) {
        options.sizzleReps = Number(maybeNum);
        i += 3;
      } else {
        i += 2;
      }
      continue;
    }

    if (token === '--sizzle-reps') {
      options.sizzleReps = Number(argv[i + 1]);
      i += 2;
      continue;
    }

    if (token === '--amp') {
      options.amp = Number(argv[i + 1]);
      i += 2;
      continue;
    }

    if (token === '--accent') {
      options.accent = argv[i + 1];
      i += 2;
      continue;
    }

    if (token === '--accent-low') {
      options.accentLow = Number(argv[i + 1]);
      i += 2;
      continue;
    }

    if (token === '--count') {
      options.count = Number(argv[i + 1]);
      i += 2;
      continue;
    }

    if (token === '--order') {
      options.order = argv[i + 1];
      i += 2;
      continue;
    }

    throw new TypeError(`Unknown option "${token}"`);
  }

  return options;
};

const baseClipParams = (parsed: ParsedOptions): Partial<ClipParams> => {
  return {
    sizzle: parsed.sizzle,
    sizzleReps: parsed.sizzleReps,
    amp: parsed.amp,
    accent: parsed.accent,
    accentLow: parsed.accentLow,
    subdiv: parsed.subdiv,
  };
};

const makeRiff = (parsed: ParsedOptions): NoteObject[] => {
  const [root, mode, pattern, octaveShiftArg, motif] = parsed.positionals;
  if (!root || !mode || !pattern) {
    throw new TypeError(
      'riff requires: <root> <mode> <pattern> [octaveShift] [motif]'
    );
  }
  const octaveShift = Number(octaveShiftArg || '0');
  const riffScale = scale(`${setOctave(root, octaveShift)} ${mode}`);
  const riffNotes =
    motif && motif.length
      ? motif
          .toUpperCase()
          .split('')
          .map(letter => {
            const idx = letter.charCodeAt(0) - 65;
            if (idx < 0) {
              return riffScale[0];
            }
            return riffScale[idx % riffScale.length];
          })
      : riffScale;

  return clip({
    notes: riffNotes,
    randomNotes: riffScale,
    pattern,
    ...baseClipParams(parsed),
  });
};

const makeChord = (parsed: ParsedOptions): NoteObject[] => {
  const [root, mode, progressionInput, pattern, subdiv] = parsed.positionals;
  if (!root || !mode || !progressionInput || !pattern) {
    throw new TypeError(
      'chord requires: <root> <mode> <progression|random> <pattern> [subdiv]'
    );
  }
  const chords = parseProgression(root, mode, progressionInput);
  return clip({
    notes: chords,
    pattern,
    subdiv: parsed.subdiv || subdiv,
    ...baseClipParams(parsed),
  });
};

const makeArp = (parsed: ParsedOptions): NoteObject[] => {
  const [root, mode, progressionInput, pattern, subdiv] = parsed.positionals;
  if (!root || !mode || !progressionInput || !pattern) {
    throw new TypeError(
      'arp requires: <root> <mode> <progression|random> <pattern> [subdiv]'
    );
  }
  const chords = parseProgression(root, mode, progressionInput);
  const arpNotes = arp({
    chords,
    count: parsed.count || 4,
    order: parsed.order || '0123',
  });

  return clip({
    notes: arpNotes,
    pattern,
    subdiv: parsed.subdiv || subdiv,
    ...baseClipParams(parsed),
  });
};

export const runCli = (argv: string[], deps?: CliDeps): number => {
  const stdout = deps?.stdout || console.log;
  const stderr = deps?.stderr || console.error;
  const writeMidi =
    deps?.writeMidi ||
    ((notes, fileName, bpm) => {
      midi(notes, fileName, bpm);
    });

  try {
    const parsed = parseCliArgs(argv);
    if (!parsed) {
      stdout(HELP_TEXT);
      return 0;
    }

    let notes: NoteObject[] = [];
    if (parsed.command === 'riff') {
      notes = makeRiff(parsed);
    } else if (parsed.command === 'chord') {
      notes = makeChord(parsed);
    } else {
      notes = makeArp(parsed);
    }

    writeMidi(notes, parsed.outfile, parsed.bpm);
    stdout(
      `Generated ${parsed.command} clip (${notes.length} events) -> ${parsed.outfile}`
    );
    return 0;
  } catch (e) {
    stderr(e instanceof Error ? e.message : String(e));
    stderr('Run with --help for usage');
    return 1;
  }
};

if (process.argv[1]?.includes('cli')) {
  process.exit(runCli(process.argv.slice(2)));
}
