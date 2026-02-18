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
      ['--riff', 'C3', 'phrygian', 'x-xRx_RR', '0', 'AABC', '--sizzle', 'sin', '2', '--outfile', 'riff.mid'],
      { stdout: out, stderr: err, writeMidi }
    );

    expect(code).toBe(0);
    expect(err).not.toHaveBeenCalled();
    expect(writeMidi).toHaveBeenCalledOnce();
    expect(writeMidi.mock.calls[0][1]).toBe('riff.mid');
    expect(writeMidi.mock.calls[0][0].length).toBeGreaterThan(0);
  });

  it('generates chord clip from digit progression', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(
      ['--chord', 'C3', 'major', '1645', 'xxxx', '1m', '--sizzle', 'cos', '1'],
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
      ['--chord', 'C3', 'major', 'CM-FM-Am-GM', 'xxxx', '1m'],
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
      ['--arp', 'C3', 'major', '1736', 'xxxx', '1m', '--sizzle', 'cos', '4'],
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

    const code = runCli(
      ['--arp', 'C3', 'major', 'I,IV,v,vi', 'x', '8n'],
      { stdout: out, stderr: err, writeMidi }
    );

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
      ['--arp', 'C3', 'major', '1', 'xxxx', '4n', '--order', '2143'],
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
      ['--arp', 'C3', 'major', '1', 'xxxx', '4n', '--order', '1032'],
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

    const code = runCli(
      ['--arp', 'C3', 'major', '1', 'x.repeat(4)', '4n'],
      { stdout: out, stderr: err, writeMidi }
    );

    expect(code).toBe(0);
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(notes.length).toBe(4);
  });

  it('fits pattern to generated note count by default', () => {
    const writeMidi = vi.fn();
    const out = vi.fn();
    const err = vi.fn();

    const code = runCli(['--arp', 'C3', 'major', '1736', 'x', '4n'], {
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
      ['--arp', 'C3', 'major', '1736', 'x', '4n', '--no-fit-pattern'],
      { stdout: out, stderr: err, writeMidi }
    );

    expect(code).toBe(0);
    const notes = writeMidi.mock.calls[0][0] as NoteObject[];
    expect(notes.length).toBe(1);
  });
});
