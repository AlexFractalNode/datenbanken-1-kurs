/**
 * Publishes the generated PDFs and Anki decks that exist in the downloads directory at build time
 * as static files below `downloads/` (see lib/downloads.ts). Missing files get no route at all.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { listDownloads, resolveDownloadFile } from '../../lib/downloads';

export const getStaticPaths = (() => listDownloads().filter((d) => d.available).map((d) => ({ params: { file: d.file } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const path = resolveDownloadFile(params.file ?? '');
  if (!path) return new Response('Not found', { status: 404 });
  const type = path.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
  return new Response(readFileSync(path), { headers: { 'Content-Type': type } });
};
