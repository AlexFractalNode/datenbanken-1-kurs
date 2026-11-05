import { describe, expect, it } from 'vitest';
import { NAV, activeNavPath, withBase } from '../src/lib/nav';

const BASE = '/datenbanken-1-kurs/';

describe('navigation', () => {
  it('contains the eleven sections in the agreed order', () => {
    expect(NAV.map((n) => n.label)).toEqual([
      'Dashboard',
      'Themen',
      'Karten',
      'Quiz',
      'Aufgaben',
      'Klausur',
      'Playground',
      'Glossar',
      'Downloads',
      'Lernplan',
      'Einstellungen',
    ]);
  });

  it('prefixes paths with the base', () => {
    expect(withBase('', BASE)).toBe('/datenbanken-1-kurs/');
    expect(withBase('/themen/t04/', BASE)).toBe('/datenbanken-1-kurs/themen/t04/');
    expect(withBase('glossar/', '/datenbanken-1-kurs')).toBe('/datenbanken-1-kurs/glossar/');
  });

  it('finds the active section, including nested pages', () => {
    expect(activeNavPath('/datenbanken-1-kurs/', BASE)).toBe('');
    expect(activeNavPath('/datenbanken-1-kurs/themen/t04/', BASE)).toBe('themen/');
    expect(activeNavPath('/datenbanken-1-kurs/glossar', BASE)).toBe('glossar/');
    expect(activeNavPath('/datenbanken-1-kurs/quiz/index.html', BASE)).toBe('quiz/');
  });
});
