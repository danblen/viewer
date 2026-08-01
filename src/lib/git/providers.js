import {
  isGitRepoFsa,
  isGitRepoServer,
  getGitStatusFsa,
  getGitStatusServer,
  getFileDiffFsa,
  getFileDiffServer,
} from './index.js';

/** FSA git backend with headTreeMap cache between status() and diff(). */
export function makeFsaGit(handle) {
  let headTreeMap = null;
  let fs = null;
  return {
    async status() {
      const r = await getGitStatusFsa(handle);
      headTreeMap = r.headTreeMap;
      fs = r.fs;
      return { changes: r.changes, branch: r.branch };
    },
    diff(path, status) {
      return getFileDiffFsa(handle, path, headTreeMap, fs, status);
    },
  };
}

/** Server-backed git backend for cloned repos. */
export function makeServerGit(serverRoot) {
  return {
    async status() {
      const r = await getGitStatusServer(serverRoot);
      return { changes: r.changes, branch: r.branch };
    },
    diff(path, status) {
      return getFileDiffServer(serverRoot, path, status);
    },
  };
}

export async function buildFsaProvider(handle, FsaProvider) {
  let git;
  try {
    if (await isGitRepoFsa(handle)) git = makeFsaGit(handle);
  } catch { /* not a repo */ }
  return new FsaProvider(handle, git ? { git } : {});
}

export async function buildServerProvider(serverRoot, ServerProvider) {
  let git;
  try {
    if (await isGitRepoServer(serverRoot)) git = makeServerGit(serverRoot);
  } catch { /* not a repo */ }
  return new ServerProvider('', serverRoot, git ? { git } : {});
}
