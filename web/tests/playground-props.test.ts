import { describe, expect, it } from 'vitest';
import { playgroundDatabases, playgroundProps } from '../src/lib/playground-props';

const ROOT = 'tests/fixtures/content_ok';
const EMPTY = 'tests/fixtures/content_empty';

describe('playgroundDatabases', () => {
  it('reads schema, seed and renders the Chen diagram of both sample databases as inline SVG', async () => {
    const dbs = await playgroundDatabases();
    expect(dbs.map((d) => d.name)).toEqual(['musikschule', 'firma']);
    for (const db of dbs) {
      expect(db.schema).toContain('CREATE TABLE');
      expect(db.seed).toContain('INSERT INTO');
      expect(db.diagramHtml).toContain('<svg');
      expect(db.diagramHtml).toContain('role="img"');
      expect(db.diagramHtml).toContain(db.title);
    }
  });

  it('skips databases that are not there', async () => {
    expect(await playgroundDatabases('tests/fixtures/does-not-exist')).toEqual([]);
  });
});

describe('playgroundProps', () => {
  it('turns SQL tasks into sanitised island props', async () => {
    const { tasks, topics, databases } = await playgroundProps(ROOT);
    expect(topics.map((t) => t.id)).toEqual(['t04']);
    expect(databases).toHaveLength(2);
    expect(tasks.map((t) => t.id)).toEqual(['t04-s001', 't04-s002']);
    expect(tasks[1]).toMatchObject({ engines: ['fb'], paperMode: 'predict' });
    expect(tasks[0]).toMatchObject({
      id: 't04-s001',
      topic: 't04',
      db: 'firma',
      kind: 'query',
      ordered: true,
      engines: ['fb', 'pg'],
      paperMode: 'write',
      solution: 'SELECT FIRST 3 bezeichnung FROM abteilung ORDER BY bezeichnung;',
      solutionPg: 'SELECT bezeichnung FROM abteilung ORDER BY bezeichnung LIMIT 3;',
      hintsHtml: ['Sortiere nach dem Namen.'],
    });
    expect(tasks[0].promptHtml).toContain('<p>');
    expect(tasks[0].promptHtml).not.toMatch(/<script/i);
  });

  it('is empty without SQL tasks', async () => {
    expect((await playgroundProps(EMPTY)).tasks).toEqual([]);
  });
});
