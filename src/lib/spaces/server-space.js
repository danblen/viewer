import { apiUrl } from '../api/config.js';

/** Open a server-backed cloned repo path as workspace root. */
export async function openPathAsSpace(destPath) {
  const r = await fetch(apiUrl(`/api/read-tree?path=${encodeURIComponent(destPath)}`));
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || '无法读取目录');
  }
  const { name } = await r.json();
  return { name, serverRoot: destPath };
}
