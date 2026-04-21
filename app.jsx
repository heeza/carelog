// Main app: wraps screens in phone frame, manages role + navigation,
// hosts Tweaks panel and theme/font-size controls.

function CareLogPhone({ role, screen, setScreen, store, theme, fontSize, settings, patchSettings }) {
  // Caregiver screens have light bg; Guardian varies.
  const isDarkScreen =
    screen === 'guardianAlert' || screen === 'guardianCall' ||
    (screen === 'caregiverEmergency');

  const screens = {
    caregiverHome: <CaregiverHome store={store} onNav={setScreen} />,
    caregiverLog: <CaregiverLog store={store} onNav={setScreen} />,
    caregiverEmergency: <CaregiverEmergency store={store} onNav={setScreen} />,
    caregiverEmergencySent: <CaregiverEmergencySent store={store} onNav={setScreen} />,
    caregiverSettings: <CaregiverSettings store={store} onNav={setScreen} settings={settings} patch={patchSettings}/>,
    caregiverCompanion: <CaregiverCompanion store={store} onNav={setScreen}/>,
    guardianHome: <GuardianHome store={store} onNav={setScreen} />,
    guardianTimeline: <GuardianTimeline store={store} onNav={setScreen} />,
    guardianAlert: <GuardianAlert store={store} onNav={setScreen} />,
    guardianCall: <GuardianCall store={store} onNav={setScreen} />,
    guardianSettings: <GuardianSettings store={store} onNav={setScreen} settings={settings} patch={patchSettings}/>,
  };

  return (
    <Device dark={isDarkScreen} bg={TOKENS.color.bg}>
      {screens[screen] || screens[role === 'caregiver' ? 'caregiverHome' : 'guardianHome']}
    </Device>
  );
}

// ─── Tweaks Panel ────────────────────────────────────────────
const DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#3B7A9E",
  "accentDeep": "#2A5E7E",
  "accentSoft": "#E7EEF5",
  "fontSize": "normal",
  "role": "both"
}/*EDITMODE-END*/;

const ACCENT_PRESETS = [
  { name: 'Medical Blue', accent: '#3B7A9E', accentDeep: '#2A5E7E', accentSoft: '#E7EEF5' },
  { name: 'Clinical Teal', accent: '#3B8A7E', accentDeep: '#2A5E56', accentSoft: '#E1EEEB' },
  { name: 'Ink', accent: '#1E2A3A', accentDeep: '#0F1B2A', accentSoft: '#E7EAEE' },
  { name: 'Warm Amber', accent: '#B5761F', accentDeep: '#8A5912', accentSoft: '#F4EADA' },
];

function App() {
  const store = useCareLogStore();
  const [settings, setSettings] = React.useState(DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [tweaksAvailable, setTweaksAvailable] = React.useState(false);

  const [caregiverScreen, setCaregiverScreen] = React.useState('caregiverHome');
  const [guardianScreen, setGuardianScreen] = React.useState('guardianHome');
  const [singleScreen, setSingleScreen] = React.useState('caregiverHome');

  // When caregiver triggers emergency, auto-flip guardian screen so side-by-side demo shines
  React.useEffect(() => {
    if (store.emergencyActive && settings.role === 'both') {
      setGuardianScreen('guardianAlert');
    }
  }, [store.emergencyActive]);

  // Apply theme to CSS vars
  React.useEffect(() => {
    const fs = settings.fontSize;
    const scale = fs === 'large' ? 1.18 : 1;
    const root = document.documentElement;
    root.style.setProperty('--fs-body', (15 * scale) + 'px');
    root.style.setProperty('--fs-body-sm', (13 * scale) + 'px');
    root.style.setProperty('--fs-body-lg', (17 * scale) + 'px');
    root.style.setProperty('--fs-title', (24 * scale) + 'px');
    TOKENS.color.accent = settings.accent;
    TOKENS.color.accentDeep = settings.accentDeep;
    TOKENS.color.accentSoft = settings.accentSoft;
  }, [settings]);

  // Tweaks protocol
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    setTweaksAvailable(true);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const patchSettings = (p) => {
    const next = { ...settings, ...p };
    setSettings(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: p }, '*');
  };

  const showBoth = settings.role === 'both';
  const singleRole = settings.role === 'caregiver' ? 'caregiver' : 'guardian';

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: '#E8ECF1',
      fontFamily: TOKENS.font.family,
      color: TOKENS.color.ink,
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 16,
        background: 'linear-gradient(180deg, rgba(232,236,241,0.95), rgba(232,236,241,0))',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: settings.accent, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 15, letterSpacing: -0.3,
          }}>C</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>CareLog</div>
            <div style={{ fontSize: 11, color: TOKENS.color.inkSubtle, fontWeight: 500 }}>인터랙티브 프로토타입 · v0.1</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
          <button onClick={() => store.reset()}
            style={segButton()}>
            <Icon name="refresh" size={14} color={TOKENS.color.inkMuted} /> 데이터 초기화
          </button>
        </div>
      </div>

      {/* Phone stage */}
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 40, padding: '70px 20px 40px', boxSizing: 'border-box',
      }}>
        {showBoth ? (
          <>
            <PhoneColumn
              label="부모님"
              sublabel="직접 기록을 남기고 도움이 필요할 때 호출합니다"
              role="caregiver"
              screen={caregiverScreen}
              setScreen={setCaregiverScreen}
              store={store}
              settings={settings}
              patchSettings={patchSettings}
            />
            <PhoneColumn
              label="보호자 (딸)"
              sublabel="부모님 상태를 확인하고 알림에 대응합니다"
              role="guardian"
              screen={guardianScreen}
              setScreen={setGuardianScreen}
              store={store}
              settings={settings}
              patchSettings={patchSettings}
            />
          </>
        ) : (
          <PhoneColumn
            label={singleRole === 'caregiver' ? '부모님' : '보호자 (딸)'}
            role={singleRole}
            screen={singleScreen}
            setScreen={setSingleScreen}
            store={store}
          />
        )}
      </div>

      {/* Tweaks */}
      {tweaksOpen && (
        <TweaksPanel
          settings={settings}
          patch={patchSettings}
          onReset={() => store.reset()}
          onClose={() => setTweaksOpen(false)}
        />
      )}
    </div>
  );
}

function segButton() {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 13px', borderRadius: TOKENS.radius.pill,
    background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
    border: `1px solid ${TOKENS.color.border}`,
    fontSize: 12, fontWeight: 600, color: TOKENS.color.inkMuted,
    cursor: 'pointer', fontFamily: 'inherit',
  };
}

function PhoneColumn({ label, sublabel, role, screen, setScreen, store, settings, patchSettings }) {
  const screens = role === 'caregiver'
    ? [
        { key: 'caregiverHome', name: '홈' },
        { key: 'caregiverLog', name: '기록' },
        { key: 'caregiverEmergency', name: '응급' },
        { key: 'caregiverEmergencySent', name: '전송됨' },
        { key: 'caregiverCompanion', name: '말벗' },
        { key: 'caregiverSettings', name: '설정' },
      ]
    : [
        { key: 'guardianHome', name: '홈' },
        { key: 'guardianTimeline', name: '타임라인' },
        { key: 'guardianAlert', name: '알림' },
        { key: 'guardianCall', name: '통화' },
        { key: 'guardianSettings', name: '설정' },
      ];
  // Ensure screen belongs to role
  const validScreen = screens.find(s => s.key === screen) ? screen : screens[0].key;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ textAlign: 'center', marginBottom: 2 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
          color: TOKENS.color.inkSubtle, textTransform: 'uppercase',
        }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: 12, color: TOKENS.color.inkMuted, marginTop: 3, maxWidth: 280 }}>
            {sublabel}
          </div>
        )}
      </div>
      <CareLogPhone role={role} screen={validScreen} setScreen={setScreen} store={store}
        settings={settings} patchSettings={patchSettings}/>
      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 380 }}>
        {screens.map(s => (
          <button key={s.key} onClick={() => setScreen(s.key)} style={{
            padding: '5px 11px', borderRadius: TOKENS.radius.pill,
            border: `1px solid ${validScreen === s.key ? TOKENS.color.ink : 'transparent'}`,
            background: validScreen === s.key ? TOKENS.color.ink : 'rgba(255,255,255,0.6)',
            color: validScreen === s.key ? '#fff' : TOKENS.color.inkMuted,
            fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>{s.name}</button>
        ))}
      </div>
    </div>
  );
}

function TweaksPanel({ settings, patch, onReset, onClose }) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, width: 300,
      background: '#fff',
      borderRadius: TOKENS.radius.lg,
      border: `1px solid ${TOKENS.color.border}`,
      boxShadow: '0 16px 48px rgba(15,27,42,0.18)',
      zIndex: 50, fontFamily: TOKENS.font.family,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${TOKENS.color.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="settings" size={16} color={TOKENS.color.inkMuted}/>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Tweaks</span>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 4, color: TOKENS.color.inkSubtle,
        }}><Icon name="close" size={16}/></button>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <TweakSection label="테마 컬러">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ACCENT_PRESETS.map(p => (
              <button key={p.name}
                onClick={() => patch({ accent: p.accent, accentDeep: p.accentDeep, accentSoft: p.accentSoft })}
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: p.accent,
                  border: settings.accent === p.accent ? `3px solid ${TOKENS.color.ink}` : `1px solid ${TOKENS.color.border}`,
                  cursor: 'pointer', padding: 0,
                }} title={p.name}/>
            ))}
          </div>
        </TweakSection>

        <TweakSection label="폰트 크기">
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'normal', label: '보통' },
              { key: 'large', label: '크게 (접근성)' },
            ].map(o => (
              <button key={o.key} onClick={() => patch({ fontSize: o.key })} style={{
                flex: 1, padding: '9px 10px',
                borderRadius: TOKENS.radius.md,
                border: `1.5px solid ${settings.fontSize === o.key ? TOKENS.color.accent : TOKENS.color.border}`,
                background: settings.fontSize === o.key ? TOKENS.color.accentSoft : '#fff',
                color: settings.fontSize === o.key ? TOKENS.color.accentDeep : TOKENS.color.inkMuted,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>{o.label}</button>
            ))}
          </div>
        </TweakSection>

        <TweakSection label="역할 보기">
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'both', label: '둘 다' },
              { key: 'caregiver', label: '부모님' },
              { key: 'guardian', label: '보호자' },
            ].map(o => (
              <button key={o.key} onClick={() => patch({ role: o.key })} style={{
                flex: 1, padding: '8px 8px',
                borderRadius: TOKENS.radius.md,
                border: `1.5px solid ${settings.role === o.key ? TOKENS.color.accent : TOKENS.color.border}`,
                background: settings.role === o.key ? TOKENS.color.accentSoft : '#fff',
                color: settings.role === o.key ? TOKENS.color.accentDeep : TOKENS.color.inkMuted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>{o.label}</button>
            ))}
          </div>
        </TweakSection>

        <TweakSection label="데이터">
          <button onClick={onReset} style={{
            width: '100%', padding: '9px 12px',
            borderRadius: TOKENS.radius.md,
            border: `1.5px solid ${TOKENS.color.border}`,
            background: '#fff', color: TOKENS.color.inkMuted,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icon name="refresh" size={14}/> 가짜 데이터 리셋
          </button>
        </TweakSection>
      </div>
    </div>
  );
}

function TweakSection({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 600, color: TOKENS.color.inkSubtle,
        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
      }}>{label}</div>
      {children}
    </div>
  );
}

Object.assign(window, { App });
