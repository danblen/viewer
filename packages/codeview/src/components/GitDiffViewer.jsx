import { useMemo } from 'react';
import * as Diff from 'diff';

const CONTEXT_LINES = 3;
const MIN_COLLAPSE = 8;

function normalizeEol(text) {
  return (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function normalizeLine(line) {
  if (line == null) return line;
  return line.replace(/\r$/, '');
}

function splitLines(text) {
  const n = normalizeEol(text);
  if (!n) return [];
  const s = n.endsWith('\n') ? n.slice(0, -1) : n;
  if (s === '') return [''];
  return s.split('\n').map(normalizeLine);
}

/** Align one changed hunk (flat — no recursion). */
function alignHunk(removedLines, addedLines, oldNum, newNum) {
  const rows = [];
  const hunkChanges = Diff.diffLines(
    removedLines.join('\n') + (removedLines.length ? '\n' : ''),
    addedLines.join('\n') + (addedLines.length ? '\n' : ''),
  );

  for (const part of hunkChanges) {
    const lines = splitLines(part.value);
    if (!part.added && !part.removed) {
      for (const line of lines) {
        rows.push({ type: 'context', oldNum: oldNum++, newNum: newNum++, oldContent: line, newContent: line });
      }
    } else if (part.removed) {
      for (const line of lines) {
        rows.push({ type: 'removed', oldNum: oldNum++, newNum: null, oldContent: line, newContent: null });
      }
    } else if (part.added) {
      for (const line of lines) {
        rows.push({ type: 'added', oldNum: null, newNum: newNum++, oldContent: null, newContent: line });
      }
    }
  }

  return { rows, oldNum, newNum };
}

/** Emit rows from a diffLines result chunk list. */
function emitDiffChunks(changes, rows, nums) {
  let { oldNum, newNum } = nums;

  for (let i = 0; i < changes.length; i++) {
    const part = changes[i];
    const lines = splitLines(part.value);

    if (!part.added && !part.removed) {
      for (const line of lines) {
        rows.push({ type: 'context', oldNum: oldNum++, newNum: newNum++, oldContent: line, newContent: line });
      }
    } else if (part.removed) {
      const removedLines = lines;
      const nextPart = changes[i + 1];
      if (nextPart && nextPart.added) {
        const addedLines = splitLines(nextPart.value);
        const sub = alignHunk(removedLines, addedLines, oldNum, newNum);
        rows.push(...sub.rows);
        oldNum = sub.oldNum;
        newNum = sub.newNum;
        i++;
      } else {
        for (const line of removedLines) {
          rows.push({ type: 'removed', oldNum: oldNum++, newNum: null, oldContent: line, newContent: null });
        }
      }
    } else if (part.added) {
      for (const line of lines) {
        rows.push({ type: 'added', oldNum: null, newNum: newNum++, oldContent: null, newContent: line });
      }
    }
  }

  return { rows, oldNum, newNum };
}

/** Side-by-side rows — insert/delete rows offset to one pane only (like VS Code). */
function buildSplitRows(oldText, newText) {
  const changes = Diff.diffLines(normalizeEol(oldText), normalizeEol(newText));
  return emitDiffChunks(changes, [], { oldNum: 1, newNum: 1 }).rows;
}

/** Collapse long unchanged runs (VS Code "⋯" skipped lines). */
function collapseContext(rows) {
  const out = [];
  let i = 0;
  while (i < rows.length) {
    if (rows[i].type !== 'context') {
      out.push(rows[i]);
      i++;
      continue;
    }
    let j = i;
    while (j < rows.length && rows[j].type === 'context') j++;
    const run = j - i;
    if (run <= CONTEXT_LINES * 2 + MIN_COLLAPSE) {
      for (let k = i; k < j; k++) out.push(rows[k]);
    } else {
      for (let k = i; k < i + CONTEXT_LINES; k++) out.push(rows[k]);
      out.push({ type: 'collapsed', count: run - CONTEXT_LINES * 2, id: `c-${i}` });
      for (let k = j - CONTEXT_LINES; k < j; k++) out.push(rows[k]);
    }
    i = j;
  }
  return out;
}

function wordDiff(oldLine, newLine) {
  if (oldLine == null || newLine == null) return null;
  if (normalizeLine(oldLine) === normalizeLine(newLine)) return null;
  const parts = Diff.diffWordsWithSpace(oldLine, newLine);
  return {
    old: parts.filter((p) => !p.added).map((p) => ({ text: p.value, type: p.removed ? 'del' : 'equal' })),
    new: parts.filter((p) => !p.removed).map((p) => ({ text: p.value, type: p.added ? 'add' : 'equal' })),
  };
}

const STATUS_LABELS = {
  modified: '已修改', added: '新增', untracked: '未跟踪', deleted: '已删除', renamed: '重命名',
};

function sideKind(row, side) {
  if (row.type === 'collapsed') return 'collapsed';
  const isOld = side === 'old';
  if (row.type === 'context') return 'context';
  if (row.type === 'removed') return isOld ? 'removed' : 'empty';
  if (row.type === 'added') return isOld ? 'empty' : 'added';
  if (row.type === 'modified') return isOld ? 'removed' : 'added';
  return 'context';
}

export default function GitDiffViewer({ gitFile, diffData, diffLoading, diffError, onClose }) {
  const rows = useMemo(() => {
    if (!diffData) return [];
    return collapseContext(buildSplitRows(diffData.oldText, diffData.newText));
  }, [diffData]);

  if (!gitFile) return null;

  return (
    <div className="git-diff-viewer-full">
      <div className="git-diff-viewer-header">
        <div className="git-diff-viewer-title">
          <span className="git-diff-viewer-file">{gitFile.path}</span>
          <span className={`git-diff-viewer-status status-${gitFile.status || 'modified'}`}>
            {STATUS_LABELS[gitFile.status] || gitFile.status}
          </span>
        </div>
        <button className="git-icon-btn" onClick={onClose} title="关闭差异对比">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="git-diff-viewer-body">
        {diffLoading ? (
          <div className="content-loading">加载差异…</div>
        ) : diffError ? (
          <div className="content-error">
            <div className="content-error-icon">⚠️</div>
            <p>无法加载差异</p>
            <p className="content-error-detail">{diffError}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="git-diff-empty">无差异内容</div>
        ) : (
          <div className="git-diff-viewer-split git-diff-vscode">
            <div className="git-diff-viewer-headers">
              <div className="git-diff-pane-header">
                <span className="git-diff-pane-tag removed">−</span>
                原始 (HEAD)
              </div>
              <div className="git-diff-pane-header">
                <span className="git-diff-pane-tag added">+</span>
                当前工作区
              </div>
            </div>
            <div className="git-diff-rows">
              {rows.map((row, idx) => (
                row.type === 'collapsed' ? (
                  <div key={row.id || idx} className="git-diff-collapsed">
                    <span>⋮</span>
                    {row.count} 行未更改
                    <span>⋮</span>
                  </div>
                ) : (
                  <div key={idx} className="git-diff-row-pair">
                    <DiffRowSide row={row} side="old" />
                    <div className="git-diff-divider" aria-hidden />
                    <DiffRowSide row={row} side="new" />
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DiffRowSide({ row, side }) {
  const kind = sideKind(row, side);
  const isOld = side === 'old';
  const lineNum = isOld ? row.oldNum : row.newNum;
  const content = isOld ? row.oldContent : row.newContent;

  const indicator = kind === 'added' ? '+' : kind === 'removed' ? '−' : ' ';

  let segments = null;
  if (row.type === 'modified' && row.oldContent != null && row.newContent != null) {
    segments = wordDiff(row.oldContent, row.newContent)?.[isOld ? 'old' : 'new'] ?? null;
  }

  return (
    <div className={`git-diff-row-side ${kind}`}>
      <span className="git-diff-indicator" aria-hidden>{indicator}</span>
      <span className="git-diff-linenum">{lineNum ?? ''}</span>
      <span className="git-diff-line-content">
        {content == null ? (
          <span className="git-diff-empty-cell" aria-hidden />
        ) : segments ? (
          segments.map((seg, i) => (
            <span key={i} className={`git-word-${seg.type}`}>{seg.text}</span>
          ))
        ) : (
          content
        )}
      </span>
    </div>
  );
}
