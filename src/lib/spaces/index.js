export {
  selectAndBuildTree,
  switchToSpace,
  tryRestoreSpace,
  isFsaSupported,
} from './fsa.js';
export { saveDirHandle, getDirHandle, deleteDirHandle } from './indexed-db.js';
export {
  loadRecentSpaces,
  saveRecentSpaces,
  loadLastSpaceId,
  saveLastSpaceId,
  addRecentSpace,
  removeRecentSpace,
} from './recent.js';
export { openPathAsSpace } from './server-space.js';
export { collectDocuments } from './collect.js';
