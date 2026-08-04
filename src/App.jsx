import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { CodeWorkspace, FsaProvider, ServerProvider } from 'codeview';
import { SparklesIcon } from './components/host/HostIcons';
import CloneModal from './components/CloneModal';
import RagPanel from './components/RagChat';
import {
  selectAndBuildTree,
  loadRecentSpaces,
  addRecentSpace,
  removeRecentSpace,
  saveDirHandle,
  deleteDirHandle,
  switchToSpace,
  tryRestoreSpace,
  loadLastSpaceId,
  saveLastSpaceId,
  openPathAsSpace,
} from './lib/spaces';
import { buildFsaProvider, buildServerProvider } from './lib/git/providers';

const LS_LAYOUT = 'nv_layout';

function loadLayout() {
  const v = localStorage.getItem(LS_LAYOUT);
  const valid = ['top-left', 'left-only', 'auto-hide'];
  return valid.includes(v) ? v : 'left-only';
}

export default function App() {
  const [provider, setProvider] = useState(null);
  const [providerKey, setProviderKey] = useState(null);
  const [rootName, setRootName] = useState(null);
  const [loading, setLoading] = useState(false);

  const [recentSpaces, setRecentSpaces] = useState([]);
  const [activeSpaceId, setActiveSpaceId] = useState(null);

  const [layoutMode, setLayoutMode] = useState(loadLayout);
  const changeLayoutMode = useCallback((mode) => {
    setLayoutMode(mode);
    localStorage.setItem(LS_LAYOUT, mode);
  }, []);

  const [showClone, setShowClone] = useState(false);
  const openClone = useCallback(() => setShowClone(true), []);
  const closeClone = useCallback(() => setShowClone(false), []);

  const rootHandleRef = useRef(null);
  const serverRootRef = useRef(null);
  const providerRef = useRef(null);
  providerRef.current = provider;

  const activeSpaceIdRef = useRef(null);
  const recentSpacesRef = useRef([]);
  recentSpacesRef.current = recentSpaces;

  const dirtyRef = useRef(false);
  const handleDirtyChange = useCallback((d) => { dirtyRef.current = d; }, []);

  const handleSelectDirectory = useCallback(async () => {
    if (dirtyRef.current && !window.confirm('当前文件有未保存的修改，是否放弃？')) return;
    dirtyRef.current = false;
    setLoading(true);
    try {
      const { name, handle } = await selectAndBuildTree();
      if (!handle) {
        alert('当前浏览器不支持此功能，请使用 Chrome 或 Edge 打开目录。');
        return;
      }
      rootHandleRef.current = handle;
      serverRootRef.current = null;
      const p = await buildFsaProvider(handle, FsaProvider);

      const spaceId = `space_${Date.now()}`;
      await saveDirHandle(spaceId, handle);
      setRecentSpaces((prev) => addRecentSpace(prev, spaceId, name));
      setActiveSpaceId(spaceId);
      activeSpaceIdRef.current = spaceId;
      saveLastSpaceId(spaceId);

      setProvider(p);
      setProviderKey(spaceId);
      setRootName(name);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Failed to select directory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSwitchSpace = useCallback(async (spaceId) => {
    if (spaceId === activeSpaceIdRef.current) return;
    if (dirtyRef.current) return;
    setLoading(true);
    try {
      const { name, handle } = await switchToSpace(spaceId);
      rootHandleRef.current = handle;
      serverRootRef.current = null;
      const p = await buildFsaProvider(handle, FsaProvider);
      setActiveSpaceId(spaceId);
      activeSpaceIdRef.current = spaceId;
      saveLastSpaceId(spaceId);
      setProvider(p);
      setProviderKey(spaceId);
      setRootName(name);
    } catch (err) {
      console.error('Failed to switch space:', err);
      setRecentSpaces((prev) => removeRecentSpace(prev, spaceId));
      await deleteDirHandle(spaceId).catch(() => {});
      if (activeSpaceIdRef.current === spaceId) {
        setActiveSpaceId(null);
        activeSpaceIdRef.current = null;
        saveLastSpaceId(null);
      }
      alert(`无法切换到该笔记空间：\n${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenAsWorkspace = useCallback(async (node) => {
    if (!node || node.kind !== 'directory') return;
    const p = providerRef.current;
    if (!p || typeof p.getDirHandle !== 'function') return;
    if (dirtyRef.current && !window.confirm('当前文件有未保存的修改，是否放弃？')) return;
    dirtyRef.current = false;
    setLoading(true);
    try {
      const subHandle = await p.getDirHandle(node.path);
      rootHandleRef.current = subHandle;
      serverRootRef.current = null;
      const next = await buildFsaProvider(subHandle, FsaProvider);
      const name = node.name;

      const spaceId = `space_${Date.now()}`;
      await saveDirHandle(spaceId, subHandle);
      setRecentSpaces((prev) => addRecentSpace(prev, spaceId, name));
      setActiveSpaceId(spaceId);
      activeSpaceIdRef.current = spaceId;
      saveLastSpaceId(spaceId);

      setProvider(next);
      setProviderKey(spaceId);
      setRootName(name);
    } catch (err) {
      console.error('Failed to open as workspace:', err);
      alert(`打开空间失败：\n${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenClonedSpace = useCallback(async (destPath) => {
    if (!destPath) return;
    if (dirtyRef.current && !window.confirm('当前文件有未保存的修改，是否放弃？')) return;
    dirtyRef.current = false;
    setLoading(true);
    try {
      const { name, serverRoot } = await openPathAsSpace(destPath);
      rootHandleRef.current = null;
      serverRootRef.current = serverRoot;
      const p = await buildServerProvider(serverRoot, ServerProvider);
      setActiveSpaceId(null);
      activeSpaceIdRef.current = null;
      saveLastSpaceId(null);
      setProvider(p);
      setProviderKey(`server_${serverRoot}`);
      setRootName(name);
      closeClone();
    } catch (err) {
      console.error('Failed to open cloned space:', err);
      alert(`打开克隆仓库失败：\n${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [closeClone]);

  const handleDeleteSpace = useCallback(async (spaceId) => {
    const spaces = recentSpacesRef.current;
    const space = spaces.find((s) => s.id === spaceId);
    if (!space) return;
    const isActive = spaceId === activeSpaceIdRef.current;
    await deleteDirHandle(spaceId).catch(() => {});
    setRecentSpaces((prev) => removeRecentSpace(prev, spaceId));
    if (isActive) {
      rootHandleRef.current = null;
      serverRootRef.current = null;
      setProvider(null);
      setProviderKey(null);
      setRootName(null);
      setActiveSpaceId(null);
      activeSpaceIdRef.current = null;
      saveLastSpaceId(null);
    }
  }, []);

  useEffect(() => {
    const spaces = loadRecentSpaces();
    setRecentSpaces(spaces);

    const lastId = loadLastSpaceId();
    const tryId = lastId || (spaces.length > 0 ? spaces[0].id : null);
    if (tryId) {
      tryRestoreSpace(tryId)
        .then(async (result) => {
          if (!result) return;
          rootHandleRef.current = result.handle;
          serverRootRef.current = null;
          const p = await buildFsaProvider(result.handle, FsaProvider);
          setActiveSpaceId(tryId);
          activeSpaceIdRef.current = tryId;
          saveLastSpaceId(tryId);
          setProvider(p);
          setProviderKey(tryId);
          setRootName(result.name);
        })
        .catch(() => {});
    }
  }, []);

  const extraPanels = useMemo(() => [
    {
      id: 'rag',
      title: 'AI 问答',
      icon: <SparklesIcon size={16} />,
      render: ({ revealFile }) => (
        <RagPanel
          rootHandle={rootHandleRef.current}
          serverRoot={serverRootRef.current}
          spaceId={activeSpaceId}
          rootName={rootName}
          onCitationClick={(citation) => {
            if (!citation) return;
            revealFile({ path: citation.path, name: citation.name, line: citation.startLine });
          }}
        />
      ),
    },
  ], [activeSpaceId, rootName]);

  return (
    <>
      <CodeWorkspace
        provider={provider}
        providerKey={providerKey}
        rootName={rootName}
        spaces={recentSpaces}
        activeSpaceId={activeSpaceId}
        onSwitchSpace={handleSwitchSpace}
        onSelectDirectory={handleSelectDirectory}
        onDeleteSpace={handleDeleteSpace}
        onCloneGithub={openClone}
        onOpenAsWorkspace={handleOpenAsWorkspace}
        layoutMode={layoutMode}
        onChangeLayout={changeLayoutMode}
        onDirtyChange={handleDirtyChange}
        panels={{ search: true, git: true }}
        extraPanels={extraPanels}
        loading={loading}
      />
      {showClone && <CloneModal onClose={closeClone} onOpenAsSpace={handleOpenClonedSpace} />}
    </>
  );
}
