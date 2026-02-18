import { describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli';
import type { NoteObject } from '../src/types';

const getFirstNote = (notes: NoteObject[]): string | null => {
  const first = notes.find(noteObj => noteObj.note)?.note;
  if (!first || !first.length) {
    return null;
  }
  return first[0] || null;
};

describe('../src/cli', () => {
  it('prints help and exits with code 0', () => {
    const out = vi.fn();
    const err = vi.fn();
    const writeMidi = vi.fn();

    const code = runCli(['--help'], { stdout: out, stderr: err, writeMidi });

    expect(code).toBe(0);
    expect(out).toHaveBeenCalled();
    expect(err).not.toHaveBeenCalled();
    expect(writeMidi).not.toHaveBeenCalled();
  });

  it('generates a riff clip from issue-like args', () => {
    const out = vi.fn();
    const err = vi.fn();
    const writeMidi = vi.fn();

    const code = runCli(
      [
        '--riff',
        'C3',
        'phrygian',
        'x-xRx_RR',
        '8n',
        '--style',
        'AABC',
        '--sizzle',
        'sin',
        '2',
        '--outfile',
        'riff.mid',
      ],
      { stdout: out, stderr: err, writeMidi }
    );

    expect(code).toBe(0);
    expect(err).not.toHaveBeenCalled();
    expect(writeMidi).toHaveBeenCalledOnce();
    expect(writeMidi.mock.calls[0][1]).toBe('riff.mid');
    expect(writeMidi.mock.calls[0][0].length).toBeGreaterThan(0);
  });

  it('applies --subdiv for riff command', () => {
    const out = vi.fn();
    const err = vi.fn();
    const writeMidi = vi.fn();

    const code = runCli(
      ['--riff', 'C3', 'phrygian', 'x', '8n', '--style', 'AABC'],
      { stdout: out, stderr: err, writeMidi }
    );

    expect(code).toBe(0);
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(notes[0].length).toBe(64);
  });

  it('generates chord clip from digit progression', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(
      ['--chord', 'C3', 'major', 'xxxx', '1m', '1645', '--sizzle', 'cos', '1'],
      { stdout: out, stderr: err, writeMidi }
    );

    expect(code).toBe(0);
    expect(writeMidi).toHaveBeenCalledOnce();
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(getFirstNote(notes)).toBe('C3');
  });

  it('generates chord clip from explicit chord list', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(
      ['--chord', 'C3', 'major', 'xxxx', '1m', 'CM-FM-Am-GM'],
      { stdout: out, stderr: err, writeMidi }
    );

    expect(code).toBe(0);
    expect(writeMidi).toHaveBeenCalledOnce();
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(getFirstNote(notes)).toBe('C4');
  });

  it('generates arp clip from digit progression', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(
      ['--arp', 'C3', 'major', 'xxxx', '1m', '1736', '--sizzle', 'cos', '4'],
      { stdout: out, stderr: err, writeMidi }
    );

    expect(code).toBe(0);
    expect(writeMidi).toHaveBeenCalledOnce();
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(notes.length).toBeGreaterThan(0);
  });

  it('applies positional subdiv for arp command', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(['--arp', 'C3', 'major', 'x', '8n', 'I,IV,v,vi'], {
      stdout: out,
      stderr: err,
      writeMidi,
    });

    expect(code).toBe(0);
    expect(writeMidi).toHaveBeenCalledOnce();
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(notes[0].length).toBe(64);
  });

  it('returns non-zero with unknown option', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(['--riff', 'C3', 'major', 'xxxx', '--bad-flag'], {
      stdout: out,
      stderr: err,
      writeMidi,
    });

    expect(code).toBe(1);
    expect(writeMidi).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalled();
  });

  it('supports one-based arp order from cli', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(
      ['--arp', 'C3', 'major', 'xxxx', '4n', '1', '--order', '2143'],
      { stdout: out, stderr: err, writeMidi }
    );

    expect(code).toBe(0);
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(notes[0].note?.[0]).toBe('E3');
    expect(notes[1].note?.[0]).toBe('C3');
    expect(notes[2].note?.[0]).toBe('C4');
    expect(notes[3].note?.[0]).toBe('G3');
  });

  it('keeps zero-based arp order backward compatible', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(
      ['--arp', 'C3', 'major', 'xxxx', '4n', '1', '--order', '1032'],
      { stdout: out, stderr: err, writeMidi }
    );

    expect(code).toBe(0);
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(notes[0].note?.[0]).toBe('E3');
    expect(notes[1].note?.[0]).toBe('C3');
    expect(notes[2].note?.[0]).toBe('C4');
    expect(notes[3].note?.[0]).toBe('G3');
  });

  it('supports repeat syntax for pattern strings', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(['--arp', 'C3', 'major', 'x.repeat(4)', '4n', '1'], {
      stdout: out,
      stderr: err,
      writeMidi,
    });

    expect(code).toBe(0);
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(notes.length).toBe(4);
  });

  it('applies style as section sequence for riff', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(
      ['--riff', 'C3', 'major', 'x', '4n', '--style', 'AABC'],
      {
        stdout: out,
        stderr: err,
        writeMidi,
      }
    );

    expect(code).toBe(0);
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(notes.length).toBe(4);
    expect(notes[0].note?.[0]).toBe('C3');
    expect(notes[1].note?.[0]).toBe('C3');
    expect(notes[2].note?.[0]).toBe('D3');
    expect(notes[3].note?.[0]).toBe('E3');
  });

  it('repeats each style section by pattern step count', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(
      ['--riff', 'C3', 'major', 'x-x[xx]', '4n', '--style', 'AABC'],
      { stdout: out, stderr: err, writeMidi }
    );

    expect(code).toBe(0);
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(notes.length).toBe(20);
    const played = notes.filter(n => n.note).map(n => n.note?.[0]);
    expect(played.length).toBe(16);
    expect(played.slice(0, 4)).toEqual(['C3', 'C3', 'C3', 'C3']);
    expect(played.slice(4, 8)).toEqual(['C3', 'C3', 'C3', 'C3']);
    expect(played.slice(8, 12)).toEqual(['D3', 'D3', 'D3', 'D3']);
    expect(played.slice(12, 16)).toEqual(['E3', 'E3', 'E3', 'E3']);
  });

  it('reuses exact style section notes for repeated letters (including R)', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();
    const randomSpy = vi.spyOn(Math, 'random');

    // Two A sections would diverge without caching due to different random values.
    const seq = [
      0.9,
      0.0,
      0.9,
      0.15, // A section (R picks low notes)
      0.9,
      0.95,
      0.9,
      0.8, // would be different for 2nd A if recomputed
      0.9,
      0.3,
      0.9,
      0.45, // B
      0.9,
      0.6,
      0.9,
      0.75, // C
    ];
    randomSpy.mockImplementation(() => seq.shift() ?? 0.9);

    const code = runCli(
      ['--riff', 'C3', 'major', 'xRxR', '4n', '--style', 'AABC'],
      { stdout: out, stderr: err, writeMidi }
    );

    randomSpy.mockRestore();

    expect(code).toBe(0);
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    const played = notes.filter(n => n.note).map(n => n.note?.[0] as string);
    const firstA = played.slice(0, 4);
    const secondA = played.slice(4, 8);
    expect(firstA).toEqual(secondA);
  });

  it('fits pattern to generated note count by default', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(['--arp', 'C3', 'major', 'x', '4n', '1736'], {
      stdout: out,
      stderr: err,
      writeMidi,
    });

    expect(code).toBe(0);
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(notes.length).toBe(16);
  });

  it('can disable auto fit with --no-fit-pattern', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(
      ['--arp', 'C3', 'major', 'x', '4n', '1736', '--no-fit-pattern'],
      { stdout: out, stderr: err, writeMidi }
    );

    expect(code).toBe(0);
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(notes.length).toBe(1);
  });
});
