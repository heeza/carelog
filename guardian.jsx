// Guardian screens: Home, Timeline Detail, Alert (push), Call Action

// ─── Guardian Home (big status card) ────────────────────────
function GuardianHome({ store, onNav }) {
  const todayLogs = store.logs.filter(l =>
    new Date(l.timestamp).toDateString() === MOCK_NOW.toDateString()
  );
  const last = todayLogs[0];
  const active = store.emergencies.find(e => !e.handled);

  // Overall status
  const worstCond = todayLogs.find(l => l.condition === 'bad')
    || todayLogs.find(l => l.condition === 'normal') || last;
  const overallTone = active ? 'danger'
    : worstCond?.condition === 'bad' ? 'danger'
    : worstCond?.condition === 'normal' ? 'warn'
    : 'good';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
      background: TOKENS.color.bg, overflow: 'auto' }}>
      {/* Top bar */}
      <div style={{ padding: '14px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: TOKENS.color.inkSubtle, fontWeight: 500 }}>보호자 · 딸</div>
          <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 600 }}>박지수</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onNav('guardianSettings')} style={{
            width: 40, height: 40, borderRadius: 20,
            background: TOKENS.color.surface,
            border: `1px solid ${TOKENS.color.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Icon name="settings" size={18} color={TOKENS.color.inkMuted}/>
          </button>
          <button style={{
            width: 40, height: 40, borderRadius: 20,
            background: TOKENS.color.surface,
            border: `1px solid ${TOKENS.color.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
          }}>
            <Icon name="bell" size={18} color={TOKENS.color.inkMuted}/>
            {active && (
              <span style={{
                position: 'absolute', top: 8, right: 10,
                width: 8, height: 8, borderRadius: 4,
                background: TOKENS.color.danger,
                boxShadow: '0 0 0 2px ' + TOKENS.color.surface,
              }}/>
            )}
          </button>
        </div>
      </div>

      {/* Emergency banner */}
      {active && (
        <div style={{ padding: '8px 20px 0' }}>
          <button onClick={() => onNav('guardianAlert')} style={{
            width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
            background: TOKENS.color.danger, color: '#fff',
            borderRadius: TOKENS.radius.lg,
            padding: 16, display: 'flex', gap: 12, alignItems: 'center',
            fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(194,69,58,0.3)',
          }}>
            <div className="bell-shake">
              <Icon name="alert" size={24} strokeWidth={2.2}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, opacity: 0.85 }}>응급 · 활성</div>
              <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600, marginTop: 2 }}>
                {EMERGENCY_TYPES.find(t => t.key === active.type)?.label}
              </div>
            </div>
            <Icon name="chevron" size={18}/>
            <style>{`
              .bell-shake { animation: shake 0.6s ease-in-out infinite; }
              @keyframes shake {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-10deg); }
                75% { transform: rotate(10deg); }
              }
            `}</style>
          </button>
        </div>
      )}

      {/* Big status card */}
      <div style={{ padding: '14px 20px 0' }}>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '20px 20px 18px',
            background: overallTone === 'good' ? TOKENS.color.goodSoft
              : overallTone === 'warn' ? TOKENS.color.warnSoft
              : TOKENS.color.dangerSoft,
            borderBottom: `1px solid ${TOKENS.color.border}`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 11, fontWeight: 700, letterSpacing: 0.7,
              color: overallTone === 'good' ? '#2D5538'
                : overallTone === 'warn' ? '#6F4612'
                : TOKENS.color.dangerDeep,
              marginBottom: 10,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: 4,
                background: overallTone === 'good' ? TOKENS.color.good
                  : overallTone === 'warn' ? TOKENS.color.warn
                  : TOKENS.color.danger,
              }}/>
              {overallTone === 'good' ? '양호' : overallTone === 'warn' ? '주의 필요' : '알림'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.4, lineHeight: 1.15, color: TOKENS.color.ink }}>
              어머니는 오늘 편안하세요.
            </div>
            <div style={{ fontSize: 'var(--fs-body-sm)', color: TOKENS.color.inkMuted, marginTop: 8 }}>
              어머니가 {last ? fmtRelative(new Date(last.timestamp)) : '—'} 직접 기록하셨어요
            </div>
          </div>

          {/* Stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <StatCell icon="meal" label="식사" value={`${todayLogs.filter(l => l.meal === 'completed').length}/${todayLogs.length}`} />
            <StatCell icon="pill" label="약" value={todayLogs.filter(l => l.medication === 'completed').length === todayLogs.length ? '모두' : '일부'} borderL />
            <StatCell icon="heart" label="컨디션" value={(worstCond?.condition === 'good' ? '좋음' : worstCond?.condition === 'bad' ? '나쁨' : worstCond?.condition === 'normal' ? '보통' : '—')} borderL />
          </div>
        </Card>
      </div>

      {/* Today's activity */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <SectionLabel style={{ margin: 0 }}>오늘의 기록</SectionLabel>
        <button onClick={() => onNav('guardianTimeline')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: TOKENS.color.accent, fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          padding: 0,
        }}>전체 보기 →</button>
      </div>

      <div style={{ padding: '0 20px' }}>
        <Card pad={0}>
          {todayLogs.slice(0, 3).map((l, i) => (
            <React.Fragment key={l.id}>
              {i > 0 && <Divider style={{ marginLeft: 60 }} />}
              <TimelineRow log={l} compact />
            </React.Fragment>
          ))}
          {todayLogs.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center', color: TOKENS.color.inkSubtle, fontSize: 14 }}>
              오늘은 아직 기록이 없습니다
            </div>
          )}
        </Card>
      </div>

      <div style={{ height: 30 }}/>
    </div>
  );
}

function StatCell({ icon, label, value, borderL, capitalize }) {
  return (
    <div style={{
      padding: '14px 12px',
      borderLeft: borderL ? `1px solid ${TOKENS.color.border}` : 'none',
      display: 'flex', flexDirection: 'column', gap: 6,
      alignItems: 'center',
    }}>
      <Icon name={icon} size={18} color={TOKENS.color.inkSubtle}/>
      <div style={{ fontSize: 11, color: TOKENS.color.inkSubtle, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 600, color: TOKENS.color.ink,
        textTransform: capitalize ? 'capitalize' : 'none' }}>{value}</div>
    </div>
  );
}

// ─── Guardian Timeline ──────────────────────────────────────
function GuardianTimeline({ store, onNav }) {
  const [filter, setFilter] = React.useState('today'); // today | week
  const now = MOCK_NOW;
  const logs = store.logs.filter(l => {
    const d = new Date(l.timestamp);
    if (filter === 'today') return d.toDateString() === now.toDateString();
    return (now - d) < 7 * 24 * 60 * 60 * 1000;
  });

  // Group by day
  const byDay = {};
  logs.forEach(l => {
    const d = new Date(l.timestamp).toDateString();
    (byDay[d] = byDay[d] || []).push(l);
  });
  const days = Object.keys(byDay);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: TOKENS.color.bg, overflow: 'hidden' }}>
      <div style={{ padding: '12px 8px 8px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => onNav('guardianHome')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 10, borderRadius: 20, color: TOKENS.color.ink,
        }}>
          <Icon name="back" size={22}/>
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 'var(--fs-body-lg)', fontWeight: 600, marginRight: 42 }}>
          타임라인
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '4px 20px 12px', display: 'flex', gap: 8 }}>
        {['today', 'week'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 14px',
            borderRadius: TOKENS.radius.pill,
            border: `1px solid ${filter === f ? TOKENS.color.ink : TOKENS.color.border}`,
            background: filter === f ? TOKENS.color.ink : TOKENS.color.surface,
            color: filter === f ? '#fff' : TOKENS.color.inkMuted,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            textTransform: 'capitalize',
          }}>{f === 'today' ? '오늘' : '최근 7일'}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {days.map((d, di) => (
          <div key={d} style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: TOKENS.color.inkSubtle,
              textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, padding: '0 4px',
            }}>
              {d === MOCK_NOW.toDateString() ? '오늘 · ' : ''}
              {new Date(d).toLocaleDateString('ko-KR', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <Card pad={0}>
              {byDay[d].map((l, i) => (
                <React.Fragment key={l.id}>
                  {i > 0 && <Divider style={{ marginLeft: 60 }} />}
                  <TimelineRow log={l}/>
                </React.Fragment>
              ))}
            </Card>
          </div>
        ))}
        {days.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: TOKENS.color.inkSubtle, fontSize: 14 }}>
            기록 없음
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineRow({ log, compact }) {
  const condTone = log.condition === 'good'
    ? { bg: TOKENS.color.goodSoft, c: TOKENS.color.good, dot: TOKENS.color.good }
    : log.condition === 'bad'
    ? { bg: TOKENS.color.dangerSoft, c: TOKENS.color.dangerDeep, dot: TOKENS.color.danger }
    : { bg: TOKENS.color.warnSoft, c: TOKENS.color.warn, dot: TOKENS.color.warn };

  const summary = [
    log.meal === 'completed' ? '식사 완료' : log.meal === 'partial' ? '식사 일부' : '식사 미완료',
    log.medication === 'completed' ? '약 복용' : '약 미복용',
  ].join(' · ');

  return (
    <div style={{ padding: '14px 18px', display: 'flex', gap: 14 }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        width: 42, flexShrink: 0,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: TOKENS.color.inkMuted,
          fontVariantNumeric: 'tabular-nums',
        }}>{fmtTimeShort(new Date(log.timestamp))}</div>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: condTone.dot,
          boxShadow: `0 0 0 3px ${condTone.bg}` }}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontSize: 'var(--fs-body)', color: TOKENS.color.ink, fontWeight: 600 }}>
            {summary}
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: TOKENS.radius.pill,
            background: condTone.bg, color: condTone.c, textTransform: 'capitalize',
            flexShrink: 0,
          }}>{log.condition === 'good' ? '좋음' : log.condition === 'bad' ? '나쁨' : '보통'}</div>
        </div>
        {log.issue && log.issue !== 'none' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            marginTop: 6, fontSize: 12, fontWeight: 500,
            color: TOKENS.color.warn,
          }}>
            <Icon name="alert" size={12} color={TOKENS.color.warn}/>
            {ISSUE_OPTIONS.find(o => o.key === log.issue)?.label}
          </div>
        )}
        {log.note && !compact && (
          <div style={{ fontSize: 'var(--fs-body-sm)', color: TOKENS.color.inkMuted, marginTop: 6, lineHeight: 1.5 }}>
            "{log.note}"
          </div>
        )}
        {!compact && (
          <div style={{ fontSize: 11, color: TOKENS.color.inkSubtle, marginTop: 8 }}>
            {log.caregiver} 직접 기록
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Guardian Alert (push notification detail) ──────────────
function GuardianAlert({ store, onNav }) {
  const active = store.emergencies.find(e => !e.handled) || store.emergencies[0];

  if (!active) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: TOKENS.color.bg, flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 'var(--fs-body)', color: TOKENS.color.inkSubtle }}>활성 알림 없음</div>
        <Button variant="secondary" onClick={() => onNav('guardianHome')}>돌아가기</Button>
      </div>
    );
  }
  const type = EMERGENCY_TYPES.find(t => t.key === active.type);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
      background: '#0E1724', overflow: 'hidden', color: '#fff' }}>
      {/* Header bar */}
      <div style={{ padding: '12px 8px 8px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => onNav('guardianHome')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 10, borderRadius: 20, color: '#fff',
        }}>
          <Icon name="close" size={22}/>
        </button>
        <div style={{ flex: 1 }}/>
        <button style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 10, color: 'rgba(255,255,255,0.6)',
        }}>
          <Icon name="more" size={22}/>
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 24px 20px' }}>
        {/* Emergency icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
          <div className="pulse-red" style={{
            width: 72, height: 72, borderRadius: 36,
            background: TOKENS.color.danger,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="alert" size={36} color="#fff" strokeWidth={2.2}/>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1,
            color: '#F1847B', marginTop: 18 }}>응급 알림</div>
          <div style={{ fontSize: 30, fontWeight: 600, marginTop: 6, letterSpacing: -0.4, textAlign: 'center' }}>
            {type.label}
          </div>
          <div style={{ fontSize: 'var(--fs-body-sm)', color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
            {fmtTime(new Date(active.timestamp))} · {fmtRelative(new Date(active.timestamp))}
          </div>
        </div>

        {/* Meta card */}
        <div style={{
          marginTop: 28, padding: 18,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: TOKENS.radius.lg,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <MetaRow label="대상" value="어머니 (김영숙)"/>
          <MetaRow label="관계" value="딸"/>
          <MetaRow label="위치" value="자택 · 성동구" last/>
        </div>

        {active.note && (
          <div style={{ marginTop: 16, padding: 18,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: TOKENS.radius.lg,
            border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.7,
              color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>어머니가 남긴 메모</div>
            <div style={{ fontSize: 'var(--fs-body)', lineHeight: 1.5 }}>"{active.note}"</div>
          </div>
        )}

        <style>{`
          .pulse-red {
            box-shadow: 0 0 0 0 rgba(194,69,58,0.6);
            animation: pulseRed 1.2s ease-out infinite;
          }
          @keyframes pulseRed {
            0% { box-shadow: 0 0 0 0 rgba(194,69,58,0.5); }
            100% { box-shadow: 0 0 0 32px rgba(194,69,58,0); }
          }
        `}</style>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 20px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => onNav('guardianCall')} style={{
          width: '100%', padding: '16px 18px',
          borderRadius: TOKENS.radius.pill,
          border: 'none', cursor: 'pointer',
          background: '#fff', color: TOKENS.color.ink,
          fontSize: 'var(--fs-body-lg)', fontWeight: 700, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <Icon name="phone" size={20}/> 어머니에게 전화하기
        </button>
        <button onClick={() => { store.dismissEmergency(active.id); onNav('guardianHome'); }}
          style={{
            width: '100%', padding: '14px 18px',
            borderRadius: TOKENS.radius.pill,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent', color: 'rgba(255,255,255,0.85)',
            fontSize: 'var(--fs-body)', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          }}>
          확인 처리
        </button>
      </div>
    </div>
  );
}

function MetaRow({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ fontSize: 'var(--fs-body-sm)', color: 'rgba(255,255,255,0.55)' }}>{label}</span>
      <span style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ─── Guardian Call (in-progress call screen) ────────────────
function GuardianCall({ store, onNav }) {
  const [seconds, setSeconds] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #1A2B3B 0%, #0E1724 100%)',
      color: '#fff', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.6,
          color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>연결 중…</div>
        <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>어머니 김영숙</div>
        <div style={{ fontSize: 'var(--fs-body-sm)', color: 'rgba(255,255,255,0.5)', marginTop: 4,
          fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</div>

        <div style={{ marginTop: 56, position: 'relative' }}>
          <div className="ring-1" style={{ position: 'absolute', inset: -20, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)' }}/>
          <div className="ring-2" style={{ position: 'absolute', inset: -40, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)' }}/>
          <div style={{
            width: 140, height: 140, borderRadius: 70,
            background: `repeating-linear-gradient(45deg, ${TOKENS.color.accent}, ${TOKENS.color.accent} 4px, ${TOKENS.color.accentDeep} 4px, ${TOKENS.color.accentDeep} 8px)`,
            border: '3px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 42, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
          }}>숙</div>
          <style>{`
            .ring-1 { animation: ringPulse 2s ease-out infinite; }
            .ring-2 { animation: ringPulse 2s ease-out infinite 0.6s; }
            @keyframes ringPulse {
              0% { transform: scale(0.95); opacity: 0.9; }
              100% { transform: scale(1.3); opacity: 0; }
            }
          `}</style>
        </div>

        <div style={{ marginTop: 40, padding: '10px 16px',
          background: 'rgba(194,69,58,0.15)',
          border: '1px solid rgba(194,69,58,0.3)',
          borderRadius: TOKENS.radius.pill,
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: TOKENS.color.danger }}/>
          <span>응급 상황 공유됨</span>
        </div>
      </div>

      <div style={{ padding: '0 24px 40px', display: 'flex', gap: 14, justifyContent: 'center' }}>
        <button style={{
          width: 58, height: 58, borderRadius: 29,
          background: 'rgba(255,255,255,0.1)', border: 'none',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="9" y="3" width="6" height="12" rx="3"/>
            <path d="M5 11a7 7 0 0014 0M12 18v3"/>
          </svg>
        </button>
        <button onClick={() => onNav('guardianHome')} style={{
          width: 72, height: 72, borderRadius: 36,
          background: TOKENS.color.danger, border: 'none',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(194,69,58,0.4)',
        }}>
          <Icon name="phone" size={28} strokeWidth={2.2} style={{ transform: 'rotate(135deg)' }}/>
        </button>
        <button style={{
          width: 58, height: 58, borderRadius: 29,
          background: 'rgba(255,255,255,0.1)', border: 'none',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M11 5L6 9H2v6h4l5 4V5zM19 5l-4 14M15 9l4 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  GuardianHome, GuardianTimeline, GuardianAlert, GuardianCall,
});
