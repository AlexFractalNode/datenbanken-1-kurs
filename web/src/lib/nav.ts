/** Site navigation and base-path aware URLs. */

export interface NavItem {
  /** Path below the base, without leading slash; '' is the dashboard. */
  path: string;
  label: string;
}

export const NAV: readonly NavItem[] = [
  { path: '', label: 'Dashboard' },
  { path: 'themen/', label: 'Themen' },
  { path: 'karten/', label: 'Karten' },
  { path: 'quiz/', label: 'Quiz' },
  { path: 'aufgaben/', label: 'Aufgaben' },
  { path: 'klausur/', label: 'Klausur' },
  { path: 'playground/', label: 'Playground' },
  { path: 'glossar/', label: 'Glossar' },
  { path: 'downloads/', label: 'Downloads' },
  { path: 'lernplan/', label: 'Lernplan' },
  { path: 'einstellungen/', label: 'Einstellungen' },
];

export const REPO_URL = 'https://github.com/AlexFractalNode/datenbanken-1-kurs';

/** Joins the configured base (`import.meta.env.BASE_URL`) with a site path. */
export function withBase(path: string, base: string = import.meta.env.BASE_URL ?? '/'): string {
  const b = base.endsWith('/') ? base : `${base}/`;
  return b + path.replace(/^\/+/, '');
}

/** Nav path that matches the current pathname best (longest prefix), for aria-current. */
export function activeNavPath(pathname: string, base: string = import.meta.env.BASE_URL ?? '/'): string {
  const b = base.endsWith('/') ? base : `${base}/`;
  const rest = (pathname.startsWith(b) ? pathname.slice(b.length) : pathname.replace(/^\/+/, '')).replace(/index\.html$/, '');
  const normalized = rest === '' || rest.endsWith('/') ? rest : `${rest}/`;
  let best = '';
  for (const item of NAV) if (item.path !== '' && normalized.startsWith(item.path) && item.path.length > best.length) best = item.path;
  return best;
}
