// Custom Android-style frame for CareLog — cool neutral, minimal, respecting our palette.
// Simpler than the starter; uses our TOKENS.

function StatusBar({ dark = false }) {
  const c = dark ? 'rgba(255,255,255,0.95)' : TOKENS.color.ink;
  return (
    <div style={{
      height: 34, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 18px',
      position: 'relative', flexShrink: 0,
      fontFamily: TOKENS.font.family,
      fontVariantNumeric: 'tabular-nums',
      fontWeight: 600, fontSize: 14, color: c,
    }}>
      <span>3:42</span>
      {/* pill camera */}
      <div style={{
        position: 'absolute', left: '50%', top: 10, transform: 'translateX(-50%)',
        width: 20, height: 20, borderRadius: 10, background: '#1a1a1a',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {/* signal */}
        <svg width="16" height="11" viewBox="0 0 16 11">
          <rect x="0" y="7" width="3" height="4" fill={c} rx="0.5"/>
          <rect x="4" y="4" width="3" height="7" fill={c} rx="0.5"/>
          <rect x="8" y="2" width="3" height="9" fill={c} rx="0.5"/>
          <rect x="12" y="0" width="3" height="11" fill={c} rx="0.5"/>
        </svg>
        {/* wifi */}
        <svg width="14" height="11" viewBox="0 0 14 11">
          <path d="M7 10.5L0 3.5a10 10 0 0114 0L7 10.5z" fill={c}/>
        </svg>
        {/* battery */}
        <svg width="22" height="11" viewBox="0 0 22 11">
          <rect x="0.5" y="0.5" width="18" height="10" rx="2" fill="none" stroke={c} strokeWidth="1"/>
          <rect x="2" y="2" width="14" height="7" rx="1" fill={c}/>
          <rect x="19.5" y="3.5" width="2" height="4" rx="0.5" fill={c}/>
        </svg>
      </div>
    </div>
  );
}

function NavPill({ dark = false }) {
  return (
    <div style={{
      height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: 108, height: 4, borderRadius: 2,
        background: dark ? 'rgba(255,255,255,0.85)' : 'rgba(15,27,42,0.7)',
      }} />
    </div>
  );
}

// Device — everything content goes in `children`. Handles status bar + nav.
function Device({ children, bg, dark = false, noNav = false, width = 380, height = 780 }) {
  return (
    <div style={{
      width, height,
      borderRadius: 28,
      background: bg || TOKENS.color.bg,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: TOKENS.font.family,
      color: TOKENS.color.ink,
      position: 'relative',
    }}>
      <StatusBar dark={dark} />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0,
      }}>
        {children}
      </div>
      {!noNav && <NavPill dark={dark} />}
    </div>
  );
}

// ─── UI primitives ──────────────────────────────────────────
function Chip({ active, onClick, children, tone = 'accent', size = 'md', style }) {
  const toneMap = {
    accent: { on: TOKENS.color.accent, onBg: TOKENS.color.accentSoft, onText: TOKENS.color.accentDeep },
    good:   { on: TOKENS.color.good,   onBg: TOKENS.color.goodSoft,   onText: '#2D5538' },
    warn:   { on: TOKENS.color.warn,   onBg: TOKENS.color.warnSoft,   onText: '#6F4612' },
    danger: { on: TOKENS.color.danger, onBg: TOKENS.color.dangerSoft, onText: TOKENS.color.dangerDeep },
    neutral:{ on: TOKENS.color.ink,    onBg: TOKENS.color.surfaceAlt, onText: TOKENS.color.ink },
  };
  const t = toneMap[tone] || toneMap.accent;
  const pad = size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 18px' : '9px 16px';
  const fs  = size === 'sm' ? 13 : size === 'lg' ? 'var(--fs-body)' : 'var(--fs-body-sm)';
  return (
    <button onClick={onClick} type="button"
      style={{
        padding: pad, fontSize: fs, fontWeight: 500,
        borderRadius: TOKENS.radius.pill,
        border: `1.5px solid ${active ? t.on : TOKENS.color.border}`,
        background: active ? t.onBg : TOKENS.color.surface,
        color: active ? t.onText : TOKENS.color.inkMuted,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.12s',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        ...style,
      }}>
      {children}
      {active && <Icon name="check" size={14} color={t.onText} strokeWidth={2.5} />}
    </button>
  );
}

function Card({ children, style, onClick, pad = 16 }) {
  return (
    <div onClick={onClick} style={{
      background: TOKENS.color.surface,
      borderRadius: TOKENS.radius.lg,
      border: `1px solid ${TOKENS.color.border}`,
      padding: pad,
      boxShadow: TOKENS.shadow.card,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontSize: 12, textTransform: 'uppercase',
      letterSpacing: 0.8, fontWeight: 600,
      color: TOKENS.color.inkSubtle,
      marginBottom: 8,
      ...style,
    }}>{children}</div>
  );
}

function Divider({ style }) {
  return <div style={{ height: 1, background: TOKENS.color.border, ...style }} />;
}

// Button — primary / secondary / ghost
function Button({ children, onClick, variant = 'primary', size = 'md', icon, iconRight, style, disabled }) {
  const variants = {
    primary: {
      bg: TOKENS.color.accent, c: '#fff', bd: TOKENS.color.accent,
    },
    primaryDark: {
      bg: TOKENS.color.ink, c: '#fff', bd: TOKENS.color.ink,
    },
    secondary: {
      bg: TOKENS.color.surface, c: TOKENS.color.accent, bd: TOKENS.color.accent,
    },
    ghost: {
      bg: 'transparent', c: TOKENS.color.inkMuted, bd: 'transparent',
    },
    danger: {
      bg: TOKENS.color.danger, c: '#fff', bd: TOKENS.color.danger,
    },
  };
  const v = variants[variant] || variants.primary;
  const pad = size === 'sm' ? '8px 14px' : size === 'lg' ? '16px 22px' : '12px 18px';
  const fs = size === 'sm' ? 14 : size === 'lg' ? 'var(--fs-body-lg)' : 'var(--fs-body)';
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{
        padding: pad, fontSize: fs, fontWeight: 600,
        borderRadius: TOKENS.radius.pill,
        border: `1.5px solid ${v.bd}`,
        background: v.bg, color: v.c,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.1s',
        ...style,
      }}>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </button>
  );
}

// Full-width button for mobile
function BigButton({ children, onClick, variant = 'primary', icon, disabled, style }) {
  return <Button variant={variant} size="lg" icon={icon} onClick={onClick} disabled={disabled}
    style={{ width: '100%', ...style }}>{children}</Button>;
}

Object.assign(window, {
  StatusBar, NavPill, Device,
  Chip, Card, SectionLabel, Divider, Button, BigButton,
});
