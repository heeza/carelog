// Caregiver screens: Home, Quick Log, Emergency (slide-to-confirm), Emergency Sent
// Uses global TOKENS, Icon, store, frame primitives.

// ─── Caregiver Home ────────────────────────────────────────
function CaregiverHome({ store, onNav }) {
  const todayLogs = store.logs.filter(l => {
    const d = new Date(l.timestamp);
    return d.toDateString() === MOCK_NOW.toDateString();
  });
  const lastLog = todayLogs[0];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: TOKENS.color.bg, overflow: 'auto' }}>
      {/* Top bar */}
      <div style={{ padding: '14px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: TOKENS.color.inkSubtle, fontWeight: 500 }}>부모님</div>
          <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 600, color: TOKENS.color.ink }}>김영숙</div>
        </div>
        <button onClick={() => onNav('caregiverSettings')} style={{
          width: 40, height: 40, borderRadius: 20, border: 'none',
          background: TOKENS.color.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 1px 2px rgba(15,27,42,0.06)',
        }}>
          <Icon name="settings" size={20} color={TOKENS.color.inkMuted}/>
        </button>
      </div>

      {/* Patient */}
      <div style={{ padding: '8px 20px 0' }}>
        <Card pad={18} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 26,
            background: `repeating-linear-gradient(45deg, ${TOKENS.color.surfaceAlt}, ${TOKENS.color.surfaceAlt} 4px, ${TOKENS.color.border} 4px, ${TOKENS.color.border} 8px)`,
            border: `1px solid ${TOKENS.color.border}`,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 600 }}>딸 지수에게 공유</div>
            <div style={{ fontSize: 'var(--fs-body-sm)', color: TOKENS.color.inkSubtle }}>오늘 기록은 저녁에 전송돼요</div>
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
            padding: '4px 10px', borderRadius: TOKENS.radius.pill,
            background: TOKENS.color.goodSoft, color: '#2D5538',
          }}>연결됨</div>
        </Card>
      </div>

      {/* Today's progress */}
      <div style={{ padding: '20px 20px 8px' }}>
        <SectionLabel>오늘 · 4월 21일</SectionLabel>
        <Card pad={0}>
          <div style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 'var(--fs-title)', fontWeight: 600, lineHeight: 1.1 }}>
                {todayLogs.length}<span style={{ fontSize: 'var(--fs-body)', color: TOKENS.color.inkSubtle, fontWeight: 400 }}>회 기록</span>
              </div>
              {lastLog && (
                <div style={{ fontSize: 'var(--fs-body-sm)', color: TOKENS.color.inkMuted, marginTop: 4 }}>
                  마지막: {fmtTime(new Date(lastLog.timestamp))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1,2,3].map(n => (
                <div key={n} style={{
                  width: 8, height: 28, borderRadius: 4,
                  background: n <= todayLogs.length ? TOKENS.color.accent : TOKENS.color.surfaceAlt,
                }} />
              ))}
            </div>
          </div>
          <Divider />
          <button onClick={() => onNav('caregiverLog')} style={{
            display: 'flex', width: '100%', alignItems: 'center', gap: 12,
            padding: '16px 18px', border: 'none', background: 'transparent',
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: TOKENS.color.accent, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="plus" size={22} strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600, color: TOKENS.color.ink }}>기록 입력</div>
              <div style={{ fontSize: 'var(--fs-body-sm)', color: TOKENS.color.inkSubtle }}>식사, 약, 컨디션 · 10초</div>
            </div>
            <Icon name="chevron" size={18} color={TOKENS.color.inkSubtle} />
          </button>
        </Card>
      </div>

      {/* Recent entries */}
      <div style={{ padding: '16px 20px 8px' }}>
        <SectionLabel>최근 기록</SectionLabel>
        <Card pad={0}>
          {store.logs.slice(0, 3).map((l, i) => (
            <React.Fragment key={l.id}>
              {i > 0 && <Divider style={{ marginLeft: 18 }} />}
              <LogRow log={l} />
            </React.Fragment>
          ))}
        </Card>
      </div>

      {/* Spacer for floating buttons */}
      <div style={{ height: 180 }} />

      {/* Floating actions */}
      <div style={{
        position: 'absolute', bottom: 36, left: 20, right: 20, zIndex: 5,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <button onClick={() => onNav('caregiverCompanion')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px',
          borderRadius: TOKENS.radius.pill,
          background: TOKENS.color.surface,
          border: `1.5px solid ${TOKENS.color.border}`,
          boxShadow: TOKENS.shadow.lift,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 18,
            background: TOKENS.color.accentSoft, color: TOKENS.color.accentDeep,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="sparkle" size={20} strokeWidth={2}/>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600, color: TOKENS.color.ink }}>도우미와 이야기하기</div>
            <div style={{ fontSize: 12, color: TOKENS.color.inkMuted }}>말씨 고 타이핑 모두 · 온디바이스</div>
          </div>
          <Icon name="chevron" size={18} color={TOKENS.color.inkSubtle} />
        </button>

        <button onClick={() => onNav('caregiverEmergency')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px',
          borderRadius: TOKENS.radius.pill,
          background: TOKENS.color.surface,
          border: `2px solid ${TOKENS.color.danger}`,
          boxShadow: TOKENS.shadow.lift,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 18,
            background: TOKENS.color.danger, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="alert" size={20} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 'var(--fs-body)', fontWeight: 700, color: TOKENS.color.dangerDeep }}>도움이 필요해요</div>
            <div style={{ fontSize: 12, color: TOKENS.color.inkMuted }}>딸에게 즉시 알림</div>
          </div>
          <Icon name="chevron" size={18} color={TOKENS.color.inkSubtle} />
        </button>
      </div>
    </div>
  );
}

function LogRow({ log }) {
  const condTone = log.condition === 'good' ? { bg: TOKENS.color.goodSoft, c: '#2D5538' }
    : log.condition === 'bad' ? { bg: TOKENS.color.dangerSoft, c: TOKENS.color.dangerDeep }
    : { bg: TOKENS.color.surfaceAlt, c: TOKENS.color.inkMuted };
  return (
    <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: TOKENS.color.inkSubtle,
        fontVariantNumeric: 'tabular-nums', width: 44,
      }}>{fmtTimeShort(new Date(log.timestamp))}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-body-sm)', color: TOKENS.color.ink, fontWeight: 500 }}>
          {log.note || `${log.meal === 'completed' ? '식사 완료' : log.meal === 'partial' ? '식사 일부' : '식사 미완료'} · ${log.medication === 'completed' ? '약 복용' : '약 미복용'}`}
        </div>
        <div style={{ fontSize: 12, color: TOKENS.color.inkSubtle, marginTop: 2 }}>
          {new Date(log.timestamp).toDateString() === MOCK_NOW.toDateString() ? '오늘' : '어제'}
        </div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 600,
        padding: '3px 9px', borderRadius: TOKENS.radius.pill,
        background: condTone.bg, color: condTone.c, textTransform: 'capitalize',
      }}>{log.condition === 'good' ? '좋음' : log.condition === 'bad' ? '나쁨' : '보통'}</div>
    </div>
  );
}

// ─── Caregiver Log (Quick entry) ────────────────────────────
function CaregiverLog({ store, onNav }) {
  const [meal, setMeal] = React.useState('completed');
  const [med, setMed] = React.useState('completed');
  const [cond, setCond] = React.useState('good');
  const [issue, setIssue] = React.useState('none');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const submit = () => {
    setSaving(true);
    setTimeout(() => {
      store.addLog({ meal, medication: med, condition: cond, issue, note });
      setSaved(true);
      setTimeout(() => onNav('caregiverHome'), 900);
    }, 400);
  };

  if (saved) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: TOKENS.color.bg,
        alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 40,
          background: TOKENS.color.goodSoft, color: TOKENS.color.good,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pop 0.3s',
        }}>
          <Icon name="check" size={44} strokeWidth={2.8} />
        </div>
        <div style={{ fontSize: 'var(--fs-title)', fontWeight: 600, marginTop: 20 }}>저장되었습니다</div>
        <div style={{ fontSize: 'var(--fs-body-sm)', color: TOKENS.color.inkSubtle, marginTop: 4 }}>
          {fmtTime(new Date())} · 딸에게 공유됩니다
        </div>
        <style>{`@keyframes pop { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: TOKENS.color.bg, overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ padding: '12px 8px 8px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => onNav('caregiverHome')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 10, borderRadius: 20, color: TOKENS.color.ink,
        }}>
          <Icon name="back" size={22} />
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 'var(--fs-body-lg)', fontWeight: 600, marginRight: 42 }}>
          기록 입력
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 120px' }}>
        {/* Time */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 'var(--fs-body-sm)', color: TOKENS.color.inkSubtle,
          marginBottom: 18,
        }}>
          <Icon name="clock" size={14} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>지금 · 오후 3:42</span>
        </div>

        {/* Meal */}
        <FormBlock icon="meal" title="식사">
          <ChipGroup options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
        </FormBlock>

        {/* Medication */}
        <FormBlock icon="pill" title="약 복용">
          <ChipGroup options={MED_OPTIONS} value={med} onChange={setMed} />
        </FormBlock>

        {/* Condition */}
        <FormBlock icon="smile" title="컨디션">
          <ChipGroup options={CONDITION_OPTIONS} value={cond} onChange={setCond} toneMap={{
            good: 'good', normal: 'neutral', bad: 'danger',
          }} />
        </FormBlock>

        {/* Issue */}
        <FormBlock icon="alert" title="특이사항">
          <ChipGroup options={ISSUE_OPTIONS} value={issue} onChange={setIssue} toneMap={{
            none: 'neutral', dizziness: 'warn', pain: 'warn',
            low_appetite: 'warn', other: 'neutral',
          }} />
        </FormBlock>

        {/* Note */}
        <FormBlock icon="note" title="메모" optional>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="짧은 메모를 남겨보세요…"
            lang="ko"
            style={{
              width: '100%', minHeight: 60, resize: 'none',
              border: `1px solid ${TOKENS.color.border}`,
              borderRadius: TOKENS.radius.md,
              padding: 12, fontSize: 'var(--fs-body-sm)',
              fontFamily: 'inherit', color: TOKENS.color.ink,
              background: TOKENS.color.surface,
              outline: 'none', boxSizing: 'border-box',
            }} />
        </FormBlock>
      </div>

      {/* Submit */}
      <div style={{
        position: 'absolute', bottom: 28, left: 20, right: 20,
        display: 'flex', gap: 10,
      }}>
        <BigButton onClick={submit} disabled={saving} icon={saving ? null : 'check'}>
          {saving ? '저장 중…' : '기록 저장'}
        </BigButton>
      </div>
    </div>
  );
}

function FormBlock({ icon, title, optional, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon name={icon} size={18} color={TOKENS.color.inkMuted} />
        <span style={{ fontSize: 'var(--fs-body)', fontWeight: 600, color: TOKENS.color.ink }}>{title}</span>
        {optional && <span style={{ fontSize: 12, color: TOKENS.color.inkSubtle }}>optional</span>}
      </div>
      {children}
    </div>
  );
}

function ChipGroup({ options, value, onChange, toneMap }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => (
        <Chip key={o.key} active={value === o.key} onClick={() => onChange(o.key)}
          tone={toneMap ? toneMap[o.key] : 'accent'}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

// ─── Caregiver Emergency (slide-to-confirm) ─────────────────
function CaregiverEmergency({ store, onNav }) {
  const [type, setType] = React.useState(null);
  const [note, setNote] = React.useState('');
  const [step, setStep] = React.useState('choose'); // choose | slide | sending
  const [slideX, setSlideX] = React.useState(0);

  const canProceed = type !== null;

  const handleSlideConfirm = () => {
    setStep('sending');
    setTimeout(() => {
      store.triggerEmergency(type, note);
      onNav('caregiverEmergencySent');
    }, 1000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
      background: step === 'slide' ? '#1A1A1E' : TOKENS.color.bg, overflow: 'hidden',
      transition: 'background 0.3s',
    }}>
      <div style={{ padding: '12px 8px 8px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => step === 'slide' ? setStep('choose') : onNav('caregiverHome')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 10, borderRadius: 20, color: step === 'slide' ? '#fff' : TOKENS.color.ink,
        }}>
          <Icon name="back" size={22} />
        </button>
        <div style={{ flex: 1, textAlign: 'center',
          fontSize: 'var(--fs-body-lg)', fontWeight: 600, marginRight: 42,
          color: step === 'slide' ? '#fff' : TOKENS.color.ink,
        }}>
          응급 호출
        </div>
      </div>

      {step === 'choose' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 120px' }}>
          <div style={{
            background: TOKENS.color.dangerSoft, border: `1px solid ${TOKENS.color.danger}`,
            padding: 14, borderRadius: TOKENS.radius.md, marginBottom: 20,
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <Icon name="alert" size={20} color={TOKENS.color.danger} style={{ marginTop: 2 }}/>
            <div>
              <div style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 600, color: TOKENS.color.dangerDeep }}>
                딸에게 즉시 알림이 전송됩니다
              </div>
              <div style={{ fontSize: 12, color: TOKENS.color.dangerDeep, marginTop: 3, opacity: 0.85 }}>
                위급한 경우 119에도 꼭 전화하세요.
              </div>
            </div>
          </div>

          <SectionLabel>무슨 상황인가요?</SectionLabel>
          <Card pad={0}>
            {EMERGENCY_TYPES.map((et, i) => (
              <React.Fragment key={et.key}>
                {i > 0 && <Divider style={{ marginLeft: 54 }} />}
                <button onClick={() => setType(et.key)} style={{
                  display: 'flex', width: '100%', alignItems: 'center', gap: 14,
                  padding: '14px 18px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 12,
                    border: `2px solid ${type === et.key ? TOKENS.color.danger : TOKENS.color.borderStrong}`,
                    background: type === et.key ? TOKENS.color.danger : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.15s',
                  }}>
                    {type === et.key && <Icon name="check" size={12} color="#fff" strokeWidth={3}/>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600, color: TOKENS.color.ink }}>{et.label}</div>
                    <div style={{ fontSize: 12, color: TOKENS.color.inkSubtle, marginTop: 2 }}>{et.hint}</div>
                  </div>
                </button>
              </React.Fragment>
            ))}
          </Card>

          <div style={{ marginTop: 22 }}>
            <SectionLabel>메모 <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(선택)</span></SectionLabel>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="보호자에게 전할 상세 정보…"
              lang="ko"
              style={{
                width: '100%', minHeight: 72, resize: 'none',
                border: `1px solid ${TOKENS.color.border}`,
                borderRadius: TOKENS.radius.md,
                padding: 12, fontSize: 'var(--fs-body-sm)',
                fontFamily: 'inherit', color: TOKENS.color.ink,
                background: TOKENS.color.surface,
                outline: 'none', boxSizing: 'border-box',
              }} />
          </div>
        </div>
      )}

      {step === 'slide' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '20px 20px 40px', color: '#fff' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1,
              color: TOKENS.color.danger, marginBottom: 8, textTransform: 'uppercase' }}>확인</div>
            <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.15, marginBottom: 6 }}>
              {EMERGENCY_TYPES.find(t => t.key === type)?.label}
            </div>
            <div style={{ fontSize: 'var(--fs-body-sm)', color: 'rgba(255,255,255,0.6)' }}>
              김영숙 · 딸 지수에게 전송
            </div>

            {note && (
              <div style={{
                marginTop: 22, padding: 14,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: TOKENS.radius.md,
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 'var(--fs-body-sm)', lineHeight: 1.45,
              }}>{note}</div>
            )}

            <div style={{ marginTop: 40,
              fontSize: 'var(--fs-body-sm)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
              아래 버튼을 밀어 보호자에게 즉시 알림을 보냅니다.
              보호자는 푸시 알림을 받게 됩니다.
            </div>
          </div>

          <SlideToConfirm onConfirm={handleSlideConfirm} />
        </div>
      )}

      {step === 'sending' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, color: '#fff' }}>
          <div className="pulse-ring" style={{
            width: 80, height: 80, borderRadius: 40,
            background: TOKENS.color.danger,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="alert" size={40} color="#fff" strokeWidth={2.2}/>
          </div>
          <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 600 }}>알림 전송 중…</div>
          <style>{`
            .pulse-ring { animation: pulse 0.9s ease-out infinite; }
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(194,69,58,0.6); }
              100% { box-shadow: 0 0 0 40px rgba(194,69,58,0); }
            }
          `}</style>
        </div>
      )}

      {step === 'choose' && (
        <div style={{ position: 'absolute', bottom: 28, left: 20, right: 20 }}>
          <BigButton variant="danger" onClick={() => setStep('slide')} disabled={!canProceed}>
            계속
          </BigButton>
        </div>
      )}
    </div>
  );
}

function SlideToConfirm({ onConfirm }) {
  const trackRef = React.useRef(null);
  const [dragX, setDragX] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const drag = React.useRef({ start: 0, max: 0, on: false });

  const onDown = (e) => {
    const t = trackRef.current;
    if (!t) return;
    drag.current = {
      start: (e.touches ? e.touches[0].clientX : e.clientX),
      max: t.offsetWidth - 64,
      on: true,
    };
  };
  const onMove = (e) => {
    if (!drag.current.on) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = Math.max(0, Math.min(drag.current.max, x - drag.current.start));
    setDragX(dx);
  };
  const onUp = () => {
    if (!drag.current.on) return;
    drag.current.on = false;
    if (dragX > drag.current.max * 0.85) {
      setDragX(drag.current.max);
      setDone(true);
      setTimeout(() => onConfirm(), 250);
    } else {
      setDragX(0);
    }
  };
  React.useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  });

  return (
    <div ref={trackRef} style={{
      position: 'relative', height: 64, borderRadius: 32,
      background: 'rgba(255,255,255,0.08)',
      overflow: 'hidden', userSelect: 'none',
      border: '1px solid rgba(255,255,255,0.12)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.75)', fontSize: 'var(--fs-body)', fontWeight: 600,
        opacity: 1 - (dragX / 200),
      }}>
        밀어서 응급 알림 보내기
      </div>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: dragX + 64,
        background: TOKENS.color.danger,
        borderRadius: 32,
        transition: drag.current.on ? 'none' : 'width 0.2s',
      }} />
      <div onMouseDown={onDown} onTouchStart={onDown}
        style={{
          position: 'absolute', top: 4, left: 4,
          width: 56, height: 56, borderRadius: 28,
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: done ? 'default' : 'grab',
          transform: `translateX(${dragX}px)`,
          transition: drag.current.on ? 'none' : 'transform 0.2s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
        <Icon name={done ? 'check' : 'arrow'} size={22}
          color={done ? TOKENS.color.danger : TOKENS.color.dangerDeep} strokeWidth={2.4}/>
      </div>
    </div>
  );
}

// ─── Caregiver Emergency Sent ───────────────────────────────
function CaregiverEmergencySent({ store, onNav }) {
  const latest = store.emergencies[0];
  const type = latest ? EMERGENCY_TYPES.find(t => t.key === latest.type) : null;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: TOKENS.color.bg, padding: 20 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 40,
          background: TOKENS.color.goodSoft, color: TOKENS.color.good,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="check" size={44} strokeWidth={2.8} />
        </div>
        <div style={{ fontSize: 'var(--fs-title)', fontWeight: 600, marginTop: 24 }}>딸에게 전송됨</div>
        <div style={{ fontSize: 'var(--fs-body-sm)', color: TOKENS.color.inkSubtle, marginTop: 6, maxWidth: 260 }}>
          박지수 님에게 알림을 보냈어요. 확인하면 알려드릴게요.
        </div>

        {type && (
          <Card style={{ marginTop: 28, width: '100%', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: TOKENS.color.inkSubtle, fontWeight: 500 }}>
                전송됨 · {fmtTime(latest.timestamp)}
              </div>
              <div className="live-dot" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 600, color: TOKENS.color.danger,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: TOKENS.color.danger }}/>
                활성
              </div>
            </div>
            <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 600, marginTop: 8 }}>{type.label}</div>
            {latest.note && (
              <div style={{ fontSize: 'var(--fs-body-sm)', color: TOKENS.color.inkMuted, marginTop: 6, lineHeight: 1.5 }}>
                "{latest.note}"
              </div>
            )}
          </Card>
        )}
      </div>

      <BigButton onClick={() => onNav('caregiverHome')}>홈으로 돌아가기</BigButton>
      <div style={{ height: 8 }} />
      <BigButton variant="secondary" icon="phone">딸에게 전화하기</BigButton>
    </div>
  );
}

Object.assign(window, {
  CaregiverHome, CaregiverLog, CaregiverEmergency, CaregiverEmergencySent,
});
