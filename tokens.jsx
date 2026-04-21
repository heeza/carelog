// Shared tokens + app state for CareLog.
// Theme is Tweakable — read CSS variables at runtime, don't bake colors.

const TOKENS = {
  // Typography scale has two levels; multiplier applied at runtime
  font: {
    family: "'Pretendard', 'Inter', 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, -apple-system, sans-serif",
    familyMono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
  },
  // These are baseline colors. Overridden per-theme via CSS vars.
  color: {
    // cool clinical neutrals
    bg:          '#F4F7FA',
    surface:     '#FFFFFF',
    surfaceAlt:  '#EDF1F6',
    border:      '#DCE3EB',
    borderStrong:'#C4CFDB',
    ink:         '#0F1B2A',
    inkMuted:    '#4A5A6E',
    inkSubtle:   '#7A8A9E',
    // medical blue accent
    accent:      '#3B7A9E',
    accentDeep:  '#2A5E7E',
    accentSoft:  '#E7EEF5',
    // states
    good:        '#4C8A5E',
    goodSoft:    '#E4EFE7',
    warn:        '#B5761F',
    warnSoft:    '#F4EADA',
    danger:      '#C2453A',
    dangerSoft:  '#F7E2DF',
    dangerDeep:  '#8A2D24',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  shadow: {
    card: '0 1px 2px rgba(15,27,42,0.04), 0 2px 8px rgba(15,27,42,0.04)',
    sheet: '0 -4px 24px rgba(15,27,42,0.08)',
    lift: '0 8px 24px rgba(15,27,42,0.10)',
  },
};

// Icon — simple inline stroke-set, Material-ish (24px grid)
function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.8, style }) {
  const paths = {
    back: <path d="M15 6l-6 6 6 6" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    chevron: <path d="M9 6l6 6-6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="M5 12l5 5 9-10" />,
    bell: (<>
      <path d="M6 10a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 21a2 2 0 004 0" />
    </>),
    phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
    more: (<>
      <circle cx="5" cy="12" r="1.2" fill={color} stroke="none"/>
      <circle cx="12" cy="12" r="1.2" fill={color} stroke="none"/>
      <circle cx="19" cy="12" r="1.2" fill={color} stroke="none"/>
    </>),
    edit: <path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" />,
    meal: (<>
      <path d="M6 3v9a3 3 0 003 3v6" />
      <path d="M9 3v6" /><path d="M12 3v6" />
      <path d="M17 3c-1.5 2-2 5-2 7a2 2 0 002 2v9" />
    </>),
    pill: (<>
      <rect x="3" y="9" width="18" height="6" rx="3" />
      <path d="M12 9v6" />
    </>),
    smile: (<>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <circle cx="9" cy="10" r="0.6" fill={color} stroke="none"/>
      <circle cx="15" cy="10" r="0.6" fill={color} stroke="none"/>
    </>),
    alert: (<>
      <path d="M12 3l10 17H2L12 3z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="18" r="0.6" fill={color} stroke="none"/>
    </>),
    heart: <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />,
    clock: (<>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>),
    home: <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z" />,
    timeline: (<>
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="6" cy="18" r="2" />
      <path d="M10 6h10M10 12h10M10 18h10" />
    </>),
    user: (<>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </>),
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    note: (<>
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M14 3v6h6" />
      <path d="M9 13h8M9 17h6" />
    </>),
    filter: <path d="M4 5h16l-6 8v6l-4-2v-4L4 5z" />,
    sun: (<>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/>
    </>),
    moon: <path d="M20 15A8 8 0 019 4a8 8 0 1011 11z" />,
    coffee: (<>
      <path d="M4 8h13v7a5 5 0 01-5 5H9a5 5 0 01-5-5V8z"/>
      <path d="M17 10h2a2 2 0 010 4h-2"/>
      <path d="M7 3v2M10 3v2M13 3v2"/>
    </>),
    sparkle: <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />,
    settings: (<>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </>),
    refresh: (<>
      <path d="M4 10a8 8 0 0114-3l2 2" />
      <path d="M20 14a8 8 0 01-14 3l-2-2" />
      <path d="M20 4v5h-5M4 20v-5h5" />
    </>),
    shield: (<>
      <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </>),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}>
      {paths[name] || null}
    </svg>
  );
}

// Global time mock — stable app clock so demo doesn't drift
const MOCK_NOW = new Date('2026-04-21T15:42:00');
function fmtTime(d) {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ap = h >= 12 ? '오후' : '오전';
  const hh = ((h + 11) % 12) + 1;
  return `${ap} ${hh}:${m}`;
}
function fmtTimeShort(d) {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h.toString().padStart(2,'0')}:${m}`;
}
function fmtRelative(d, now = MOCK_NOW) {
  const diffMin = Math.round((now - d) / 60000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h/24)}일 전`;
}

Object.assign(window, { TOKENS, Icon, MOCK_NOW, fmtTime, fmtTimeShort, fmtRelative });
