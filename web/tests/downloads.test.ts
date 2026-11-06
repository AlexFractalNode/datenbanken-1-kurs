import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeDownloadsFixture } from './support/downloads-fixture';
import { downloadsDir, isDownloadFile, listDownloads, resolveDownloadFile } from '../src/lib/downloads';

const OK = resolve('tests/fixtures/content_ok');
const FIXTURE_DIR = join(tmpdir(), 'db1-downloads-fixture');
makeDownloadsFixture(FIXTURE_DIR); // at load time: the describe blocks below read it while collecting

describe('listDownloads', () => {
  const items = listDownloads(OK, FIXTURE_DIR);
  const byFile = (file: string) => items.find((i) => i.file === file)!;

  it('lists the files that tools/pdf.py and tools/anki_export.py produce', () => {
    expect(items.map((i) => i.file)).toEqual([
      'db1-de.apkg',
      'db1-de-t04.apkg',
      'exam-01.pdf',
      'exam-01-loesung.pdf',
      'cheatsheet.pdf',
      'spickzettel-vorlage.pdf',
      'aufgaben-t04.pdf',
      'loesung-t04.pdf',
    ]);
  });

  it('groups the files', () => {
    expect(byFile('db1-de.apkg').group).toBe('anki');
    expect(byFile('db1-de-t04.apkg').group).toBe('anki-topic');
    expect(byFile('exam-01.pdf').group).toBe('exam');
    expect(byFile('cheatsheet.pdf').group).toBe('material');
    expect(byFile('aufgaben-t04.pdf').group).toBe('sheets');
  });

  it('marks only files that exist in the build as available', () => {
    expect(byFile('db1-de.apkg').available).toBe(true);
    expect(byFile('exam-01.pdf').available).toBe(true);
    expect(byFile('cheatsheet.pdf').available).toBe(true);
    expect(byFile('exam-01-loesung.pdf').available).toBe(false);
    expect(byFile('aufgaben-t04.pdf').available).toBe(false);
  });

  it('does not list topics without tasks or cards and works without any build output', () => {
    expect(items.some((i) => i.file.includes('t01'))).toBe(false);
    const none = listDownloads(OK, join(tmpdir(), 'db1-does-not-exist'));
    expect(none.length).toBe(items.length);
    expect(none.every((i) => !i.available)).toBe(true);
  });

  it('treats an empty file as missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'db1-dl-'));
    mkdirSync(join(dir, 'pdf'));
    writeFileSync(join(dir, 'pdf', 'cheatsheet.pdf'), '');
    expect(listDownloads(OK, dir).find((i) => i.file === 'cheatsheet.pdf')!.available).toBe(false);
  });
});

describe('download files', () => {
  it('accepts only the generated file name patterns', () => {
    for (const ok of ['db1-de.apkg', 'db1-de-t04.apkg', 'exam-01.pdf', 'exam-02-loesung.pdf', 'cheatsheet.pdf', 'spickzettel-vorlage.pdf', 'aufgaben-t12.pdf', 'loesung-t12.pdf']) {
      expect(isDownloadFile(ok)).toBe(true);
    }
    for (const bad of ['', 'x.pdf', '../exam-01.pdf', 'exam-01.pdf/../x', 'exam-1.pdf', 'db1-de.zip', 'pdf/exam-01.pdf', 'exam-01.PDF']) {
      expect(isDownloadFile(bad)).toBe(false);
    }
  });

  it('resolves a file inside the downloads directory only', () => {
    expect(resolveDownloadFile('exam-01.pdf', FIXTURE_DIR)).toBe(join(FIXTURE_DIR, 'pdf', 'exam-01.pdf'));
    expect(resolveDownloadFile('db1-de.apkg', FIXTURE_DIR)).toBe(join(FIXTURE_DIR, 'anki', 'db1-de.apkg'));
    expect(resolveDownloadFile('exam-02.pdf', FIXTURE_DIR)).toBeNull();
    expect(resolveDownloadFile('../../package.json', FIXTURE_DIR)).toBeNull();
  });

  it('defaults to dist next to the content (env DOWNLOADS_DIR overrides)', () => {
    const saved = process.env.DOWNLOADS_DIR;
    try {
      delete process.env.DOWNLOADS_DIR;
      expect(downloadsDir()).toBe(resolve('../dist'));
      process.env.DOWNLOADS_DIR = FIXTURE_DIR;
      expect(downloadsDir()).toBe(resolve(FIXTURE_DIR));
    } finally {
      if (saved === undefined) delete process.env.DOWNLOADS_DIR;
      else process.env.DOWNLOADS_DIR = saved;
    }
  });
});
