/** Shared directory walk rules (aligned with server/rag/engine.cjs). */

export const EXCLUDED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  'coverage', '.cache', '.turbo', '.parcel-cache',
  '.svelte-kit', '.vercel', '.deno', '.gradle',
  '.idea', '.vscode', '.DS_Store', 'out', '.output',
  '__pycache__', '.pytest_cache', '.mypy_cache',
  'vendor', 'bower_components', 'jspm_packages',
]);

const SEARCHABLE_EXTS = new Set([
  'md', 'markdown', 'mdx', 'txt', 'log', 'csv',
  'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx',
  'json', 'json5', 'jsonc',
  'css', 'scss', 'sass', 'less', 'styl',
  'html', 'htm', 'xml', 'xhtml', 'vue', 'svelte',
  'yml', 'yaml', 'toml', 'ini', 'conf', 'cfg', 'properties',
  'py', 'pyw', 'pyi', 'java', 'kt', 'kts', 'scala', 'groovy',
  'c', 'h', 'cpp', 'cc', 'cxx', 'hpp', 'hh', 'cs', 'go', 'rs', 'rb', 'erb', 'php', 'swift',
  'sh', 'bash', 'zsh', 'fish', 'ksh', 'bat', 'cmd', 'ps1',
  'sql', 'graphql', 'gql', 'lua', 'r', 'dart', 'pl', 'pm',
  'clj', 'cljs', 'edn', 'ex', 'exs', 'hs', 'elm', 'ml', 'mli',
  'proto', 'diff', 'patch', 'dockerfile', 'makefile', 'mk', 'cmake', 'nginx', 'vim', 'tf', 'env',
]);

const SEARCHABLE_SPECIAL = new Set([
  'dockerfile', 'makefile', 'gnumakefile', 'cmakelists',
  '.gitignore', '.dockerignore', '.npmignore', '.env',
  '.editorconfig', '.eslintrc', '.prettierrc', '.babelrc',
]);

export function isSearchableFile(filename) {
  const base = filename.toLowerCase();
  if (SEARCHABLE_SPECIAL.has(base)) return true;
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return false;
  return SEARCHABLE_EXTS.has(filename.slice(dot + 1).toLowerCase());
}
