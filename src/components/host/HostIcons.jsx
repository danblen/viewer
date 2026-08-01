/** Host-only icons (Clone modal + RAG panel). Workspace icons live in codeview. */

function MarkdownIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3.5 1.8c0-.3.3-.6.6-.6h5.2l3.5 3.5v9.1c0 .3-.3.6-.6.6H4.1c-.3 0-.6-.3-.6-.6V1.8z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="currentColor" fillOpacity="0.05" />
      <text x="8" y="11" textAnchor="middle" fontSize="4" fontWeight="700" fill="currentColor">M</text>
    </svg>
  );
}

function PdfIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3.5 1.8c0-.3.3-.6.6-.6h5.2l3.5 3.5v9.1c0 .3-.3.6-.6.6H4.1c-.3 0-.6-.3-.6-.6V1.8z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="currentColor" fillOpacity="0.05" />
      <text x="8" y="11" textAnchor="middle" fontSize="3.5" fontWeight="700" fill="currentColor">PDF</text>
    </svg>
  );
}

function ImageIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.05" />
      <circle cx="5.5" cy="6" r="1.2" stroke="currentColor" strokeWidth="1" />
      <path d="M2 11l3.5-3 2.5 2.5L11 7l3 3.5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

function TextIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3.5 1.8c0-.3.3-.6.6-.6h5.2l3.5 3.5v9.1c0 .3-.3.6-.6.6H4.1c-.3 0-.6-.3-.6-.6V1.8z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="currentColor" fillOpacity="0.05" />
      <path d="M5 7h6M5 9h6M5 11h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function CodeIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3.5 1.8c0-.3.3-.6.6-.6h5.2l3.5 3.5v9.1c0 .3-.3.6-.6.6H4.1c-.3 0-.6-.3-.6-.6V1.8z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="currentColor" fillOpacity="0.05" />
      <path d="M6 6.5L4 8l2 1.5M10 6.5L12 8l-2 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ExitIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function SparklesIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 1.5l1.2 3.3L12.5 6 9.2 7.2 8 10.5 6.8 7.2 3.5 6l3.3-1.2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="currentColor" fillOpacity="0.08" />
      <path d="M12.5 10.5l.5 1.4 1.5.6-1.5.6-.5 1.4-.5-1.4-1.5-.6 1.5-.6z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export function SettingsIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.1" />
      <path d="M8 1.5v1.8M8 12.7v1.8M14.5 8h-1.8M3.3 8H1.5M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3M12.6 12.6l-1.3-1.3M4.7 4.7L3.4 3.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function FileTypeIcon({ name, size = 16 }) {
  const ext = name.split('.').pop().toLowerCase();
  if (['md', 'markdown', 'mdx'].includes(ext)) return <MarkdownIcon size={size} />;
  if (ext === 'pdf') return <PdfIcon size={size} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) return <ImageIcon size={size} />;
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'json', 'py', 'java', 'go', 'rs', 'rb', 'php', 'swift', 'sh', 'sql', 'html', 'css', 'yaml', 'yml', 'toml', 'md'];
  if (codeExts.includes(ext)) return <CodeIcon size={size} />;
  const base = name.toLowerCase();
  if (base === 'dockerfile' || base === 'makefile') return <CodeIcon size={size} />;
  return <TextIcon size={size} />;
}
