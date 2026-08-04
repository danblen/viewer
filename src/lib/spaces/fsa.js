import { getDirHandle } from './indexed-db.js';

export function isFsaSupported() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

async function verifyPermission(dirHandle) {
  const opts = { mode: 'read' };
  if ((await dirHandle.queryPermission(opts)) === 'granted') return true;
  if ((await dirHandle.requestPermission(opts)) === 'granted') return true;
  return false;
}

/** Open OS directory picker (Chrome/Edge FSA). */
export async function selectAndBuildTree() {
  if (isFsaSupported()) {
    const handle = await window.showDirectoryPicker();
    return { handle, name: handle.name };
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.setAttribute('multiple', '');
    input.onchange = (e) => {
      const files = e.target.files;
      if (!files?.length) {
        reject(new Error('No directory selected'));
        return;
      }
      resolve({ handle: null, name: files[0].webkitRelativePath.split('/')[0] });
    };
    input.click();
  });
}

export async function switchToSpace(spaceId) {
  const handle = await getDirHandle(spaceId);
  if (!handle) throw new Error('该空间已失效，请重新选择目录');
  if (!(await verifyPermission(handle))) throw new Error('未获得目录读取权限');
  return { handle, name: handle.name };
}

/** Boot restore: only when read permission is already granted. */
export async function tryRestoreSpace(spaceId) {
  const handle = await getDirHandle(spaceId);
  if (!handle) return null;
  if ((await handle.queryPermission({ mode: 'read' })) !== 'granted') return null;
  return { handle, name: handle.name };
}
