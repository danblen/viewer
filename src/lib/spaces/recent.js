const LS_RECENT_SPACES = 'nv_recent_spaces';
const LS_LAST_SPACE = 'nv_last_space';
const MAX_SPACES = 12;

export function loadRecentSpaces() {
  try {
    return JSON.parse(localStorage.getItem(LS_RECENT_SPACES) || '[]');
  } catch {
    return [];
  }
}

export function saveRecentSpaces(spaces) {
  try {
    localStorage.setItem(LS_RECENT_SPACES, JSON.stringify(spaces));
  } catch { /* quota / private mode */ }
}

export function loadLastSpaceId() {
  try {
    return localStorage.getItem(LS_LAST_SPACE);
  } catch {
    return null;
  }
}

export function saveLastSpaceId(spaceId) {
  try {
    if (spaceId) localStorage.setItem(LS_LAST_SPACE, spaceId);
    else localStorage.removeItem(LS_LAST_SPACE);
  } catch { /* ignore */ }
}

export function addRecentSpace(spaces, spaceId, name) {
  const filtered = spaces.filter((s) => s.name !== name);
  const updated = [{ id: spaceId, name }, ...filtered].slice(0, MAX_SPACES);
  saveRecentSpaces(updated);
  return updated;
}

export function removeRecentSpace(spaces, spaceId) {
  const updated = spaces.filter((s) => s.id !== spaceId);
  saveRecentSpaces(updated);
  return updated;
}
