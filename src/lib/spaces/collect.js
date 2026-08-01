import { EXCLUDED_DIRS, isSearchableFile } from './file-rules.js';

const MAX_RAG_FILE_SIZE = 512 * 1024;
const RAG_COLLECT_CONCURRENCY = 8;

/** Collect indexable file contents from an FSA root for RAG upload. */
export async function collectDocuments(rootHandle, opts = {}) {
  const { signal, onProgress } = opts;
  if (!rootHandle) return [];
  const docs = [];

  const readFile = async (fileHandle, filePath) => {
    if (signal?.aborted) return;
    try {
      const file = await fileHandle.getFile();
      if (file.size > MAX_RAG_FILE_SIZE) return;
      const content = await file.text();
      if (content.trim()) docs.push({ path: filePath, name: fileHandle.name, content });
    } catch { /* unreadable */ }
  };

  const walkDir = async (dirHandle, basePath) => {
    if (signal?.aborted) return;
    const fileEntries = [];
    const subdirs = [];
    for await (const entry of dirHandle.values()) {
      if (signal?.aborted) return;
      if (entry.kind === 'directory') {
        if (!EXCLUDED_DIRS.has(entry.name.toLowerCase())) subdirs.push(entry);
      } else if (isSearchableFile(entry.name)) {
        const p = basePath ? `${basePath}/${entry.name}` : entry.name;
        fileEntries.push({ handle: entry, path: p });
      }
    }

    for (let i = 0; i < fileEntries.length; i += RAG_COLLECT_CONCURRENCY) {
      if (signal?.aborted) return;
      const batch = fileEntries.slice(i, i + RAG_COLLECT_CONCURRENCY);
      await Promise.all(batch.map((f) => readFile(f.handle, f.path)));
      onProgress?.({ files: docs.length });
    }

    for (const sub of subdirs) {
      if (signal?.aborted) return;
      const p = basePath ? `${basePath}/${sub.name}` : sub.name;
      await walkDir(sub, p);
    }
  };

  await walkDir(rootHandle, '');
  return docs;
}
