// Settings screens for both roles.
// Shared layout primitives live here so caregiver / guardian screens stay consistent.

// ─── Shared primitives ────────────────────────────────────────
function SettingsHeader({ title, onBack }) {
  return (
    <div style={{ padding: '10px 8px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
      <button onClick={onBack} style={{
        width: 40, height: 40, borderRadius: 20, border: 'none',
        background: 'transparent', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="back" size={22} color={TOKENS.color.ink}/>
      </button>
      <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 600, marginLeft: 4 }}>{title}</div>
    </div>
  );
}

function SettingsGroup({ label, children, style }) {
  return (
    <div style={{ padding: '8px 20px 0', ...style }}>
      {label && <SectionLabel style={{ marginBottom: 10 }}>{label}</SectionLabel>}
      <Card pad={0}>{children}</Card>
    </div>
  );
}

function Row({ icon, iconBg, title, value, onClick, right, last, danger }) {
  return (
    <>
      <button onClick={onClick} disabled={!onClick} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', border: 'none', background: 'transparent',
        cursor: onClick ? 'pointer' : 'default', fontFamily: 'inherit', textAlign: 'left',
      }}>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: iconBg || TOKENS.color.surfaceAlt,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name={icon} size={18} color={danger ? TOKENS.color.danger : TOKENS.color.ink}/>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--fs-body)', fontWeight: 500,
            color: danger ? TOKENS.color.danger : TOKENS.color.ink,
          }}>{title}</div>
          {value && (
            <div style={{
              fontSize: 'var(--fs-body-sm)', color: TOKENS.color.inkSubtle, marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{value}</div>
          )}
        </div>
        {right !== undefined ? right : (onClick && <Icon name="chevron" size={18} color={TOKENS.color.inkSubtle}/>)}
      </button>
      {!last && <Divider style={{ marginLeft: 66 }}/>}
    </>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onChange(!on); }} style={{
      width: 44, height: 26, borderRadius: 13, position: 'relative',
      background: on ? TOKENS.color.accent : TOKENS.color.borderStrong,
      border: 'none', cursor: 'pointer', transition: 'background 0.15s',
      padding: 0, flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: 10, background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.15s',
      }}/>
    </button>
  );
}

function RoleCard({ active, icon, title, subtitle, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
      padding: 16, borderRadius: TOKENS.radius.lg,
      border: `2px solid ${active ? TOKENS.color.accent : TOKENS.color.border}`,
      background: active ? TOKENS.color.accentSoft : TOKENS.color.surface,
      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      transition: 'all 0.12s',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: active ? TOKENS.color.accent : TOKENS.color.surfaceAlt,
        color: active ? '#fff' : TOKENS.color.inkMuted,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={20}/>
      </div>
      <div>
        <div style={{
          fontSize: 'var(--fs-body)', fontWeight: 600,
          color: active ? TOKENS.color.accentDeep : TOKENS.color.ink,
        }}>{title}</div>
        <div style={{
          fontSize: 12, color: active ? TOKENS.color.accentDeep : TOKENS.color.inkSubtle,
          marginTop: 2, opacity: active ? 0.8 : 1,
        }}>{subtitle}</div>
      </div>
      {active && (
        <div style={{
          alignSelf: 'flex-end', marginTop: 'auto',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 600, color: TOKENS.color.accentDeep,
        }}>
          <Icon name="check" size={14} strokeWidth={2.5}/> 현재 역할
        </div>
      )}
    </button>
  );
}

// ─── Caregiver (Parent) Settings ─────────────────────────────
function CaregiverSettings({ store, onNav, settings, patch }) {
  const role = settings.role === 'guardian' ? 'guardian' : 'caregiver';
  const [notifSound, setNotifSound] = React.useState(true);
  const [autoShare, setAutoShare] = React.useState(true);
  const [reminder, setReminder] = React.useState(true);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
      background: TOKENS.color.bg, overflow: 'auto' }}>
      <SettingsHeader title="설정" onBack={() => onNav('caregiverHome')}/>

      {/* Profile card */}
      <div style={{ padding: '8px 20px 0' }}>
        <Card pad={18} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28,
            background: TOKENS.color.accentSoft, color: TOKENS.color.accentDeep,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 600,
          }}>김</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 600 }}>김영숙</div>
            <div style={{ fontSize: 'var(--fs-body-sm)', color: TOKENS.color.inkSubtle, marginTop: 2 }}>
              71세 · 성동구
            </div>
          </div>
          <button style={{
            padding: '6px 12px', borderRadius: TOKENS.radius.pill,
            border: `1px solid ${TOKENS.color.border}`, background: TOKENS.color.surface,
            fontSize: 12, fontWeight: 600, color: TOKENS.color.inkMuted,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>편집</button>
        </Card>
      </div>

      {/* Role picker */}
      <div style={{ padding: '20px 20px 0' }}>
        <SectionLabel>역할</SectionLabel>
        <div style={{ display: 'flex', gap: 10 }}>
          <RoleCard
            active={role === 'caregiver'}
            icon="user" title="부모님"
            subtitle="내 상태를 직접 기록"
            onClick={() => patch({ role: 'caregiver' })}
          />
          <RoleCard
            active={role === 'guardian'}
            icon="shield" title="보호자"
            subtitle="가족 상태를 확인"
            onClick={() => patch({ role: 'guardian' })}
          />
        </div>
        <div style={{
          fontSize: 12, color: TOKENS.color.inkSubtle,
          marginTop: 10, lineHeight: 1.5,
        }}>
          역할은 언제든 바꿀 수 있어요. 기록과 알림이 달라져요.
        </div>
      </div>

      {/* Family */}
      <div style={{ padding: '20px 0 0' }}>
        <SettingsGroup label="가족 연결">
          <Row
            icon="user" iconBg={TOKENS.color.accentSoft}
            title="박지수 (딸)"
            value="010-••••-3821 · 기본 보호자"
            onClick={() => {}}
          />
          <Row
            icon="user" iconBg={TOKENS.color.surfaceAlt}
            title="박민호 (아들)"
            value="010-••••-9112"
            onClick={() => {}}
          />
          <Row
            icon="plus" iconBg={TOKENS.color.surfaceAlt}
            title="가족 초대하기"
            value="QR 또는 전화번호로 연결"
            onClick={() => {}}
            last
          />
        </SettingsGroup>
      </div>

      {/* Notifications */}
      <div style={{ padding: '20px 0 0' }}>
        <SettingsGroup label="알림">
          <Row
            icon="bell" title="기록 리마인더"
            value="매일 오전 9시, 오후 6시"
            right={<Toggle on={reminder} onChange={setReminder}/>}
          />
          <Row
            icon="sparkle" title="가족이 확인했을 때"
            value="딸·아들이 기록을 보면 알림"
            right={<Toggle on={autoShare} onChange={setAutoShare}/>}
          />
          <Row
            icon="sun" title="알림 소리"
            right={<Toggle on={notifSound} onChange={setNotifSound}/>}
            last
          />
        </SettingsGroup>
      </div>

      {/* Emergency */}
      <div style={{ padding: '20px 0 0' }}>
        <SettingsGroup label="응급">
          <Row
            icon="phone" iconBg={TOKENS.color.dangerSoft}
            title="119 동시 발신"
            value="응급 호출 시 119에 자동 연결"
            right={<Toggle on={false} onChange={() => {}}/>}
          />
          <Row
            icon="heart" iconBg={TOKENS.color.dangerSoft}
            title="의료 정보"
            value="복용약 3건 · 알레르기 1건"
            onClick={() => {}}
            last
          />
        </SettingsGroup>
      </div>

      {/* App */}
      <div style={{ padding: '20px 0 0' }}>
        <SettingsGroup label="앱">
          <Row icon="sun" title="글자 크기"
            value={settings.fontSize === 'large' ? '크게 (접근성)' : '보통'}
            onClick={() => patch({ fontSize: settings.fontSize === 'large' ? 'normal' : 'large' })}
          />
          <Row icon="shield" title="개인정보 처리방침" onClick={() => {}}/>
          <Row icon="note" title="도움말 및 문의" value="카카오톡 고객센터" onClick={() => {}} last/>
        </SettingsGroup>
      </div>

      {/* Account */}
      <div style={{ padding: '20px 0 28px' }}>
        <SettingsGroup>
          <Row
            icon="refresh" iconBg={TOKENS.color.surfaceAlt}
            title="데이터 초기화"
            onClick={() => { store.reset(); onNav('caregiverHome'); }}
          />
          <Row
            icon="close" iconBg={TOKENS.color.dangerSoft}
            title="로그아웃" danger onClick={() => {}} last
          />
        </SettingsGroup>
        <div style={{
          textAlign: 'center', fontSize: 11, color: TOKENS.color.inkSubtle,
          marginTop: 16,
        }}>
          CareLog v0.1 · 마지막 동기화 방금
        </div>
      </div>
    </div>
  );
}

// ─── Guardian Settings ───────────────────────────────────────
function GuardianSettings({ store, onNav, settings, patch }) {
  const role = settings.role === 'guardian' ? 'guardian' : 'caregiver';
  const [pushEmergency, setPushEmergency] = React.useState(true);
  const [pushDaily, setPushDaily] = React.useState(true);
  const [pushIssue, setPushIssue] = React.useState(true);
  const [quiet, setQuiet] = React.useState(false);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
      background: TOKENS.color.bg, overflow: 'auto' }}>
      <SettingsHeader title="설정" onBack={() => onNav('guardianHome')}/>

      {/* Profile */}
      <div style={{ padding: '8px 20px 0' }}>
        <Card pad={18} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28,
            background: TOKENS.color.accent, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 600,
          }}>박</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 600 }}>박지수</div>
            <div style={{ fontSize: 'var(--fs-body-sm)', color: TOKENS.color.inkSubtle, marginTop: 2 }}>
              딸 · 기본 보호자
            </div>
          </div>
          <button style={{
            padding: '6px 12px', borderRadius: TOKENS.radius.pill,
            border: `1px solid ${TOKENS.color.border}`, background: TOKENS.color.surface,
            fontSize: 12, fontWeight: 600, color: TOKENS.color.inkMuted,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>편집</button>
        </Card>
      </div>

      {/* Role picker */}
      <div style={{ padding: '20px 20px 0' }}>
        <SectionLabel>역할</SectionLabel>
        <div style={{ display: 'flex', gap: 10 }}>
          <RoleCard
            active={role === 'caregiver'}
            icon="user" title="부모님"
            subtitle="내 상태를 직접 기록"
            onClick={() => patch({ role: 'caregiver' })}
          />
          <RoleCard
            active={role === 'guardian'}
            icon="shield" title="보호자"
            subtitle="가족 상태를 확인"
            onClick={() => patch({ role: 'guardian' })}
          />
        </div>
      </div>

      {/* Watching */}
      <div style={{ padding: '20px 0 0' }}>
        <SettingsGroup label="확인 중인 가족">
          <Row
            icon="user" iconBg={TOKENS.color.accentSoft}
            title="김영숙 (어머니)"
            value="71세 · 기록 13분 전"
            onClick={() => {}}
          />
          <Row
            icon="plus" iconBg={TOKENS.color.surfaceAlt}
            title="가족 추가 연결"
            value="초대 코드 또는 전화번호"
            onClick={() => {}}
            last
          />
        </SettingsGroup>
      </div>

      {/* Notifications — most important for guardian */}
      <div style={{ padding: '20px 0 0' }}>
        <SettingsGroup label="알림">
          <Row
            icon="alert" iconBg={TOKENS.color.dangerSoft}
            title="응급 호출"
            value="항상 켜짐 · 방해금지 무시"
            right={<Toggle on={pushEmergency} onChange={setPushEmergency}/>}
          />
          <Row
            icon="bell" title="이상 신호"
            value="통증·어지러움·식욕저하 감지 시"
            right={<Toggle on={pushIssue} onChange={setPushIssue}/>}
          />
          <Row
            icon="sun" title="하루 요약"
            value="매일 오후 9시"
            right={<Toggle on={pushDaily} onChange={setPushDaily}/>}
          />
          <Row
            icon="moon" title="방해 금지 시간"
            value={quiet ? '밤 11시 – 오전 7시' : '꺼짐 (응급은 항상 수신)'}
            right={<Toggle on={quiet} onChange={setQuiet}/>}
            last
          />
        </SettingsGroup>
      </div>

      {/* Quick contacts */}
      <div style={{ padding: '20px 0 0' }}>
        <SettingsGroup label="빠른 연락">
          <Row
            icon="phone" iconBg={TOKENS.color.accentSoft}
            title="어머니 직통 번호"
            value="010-••••-5047"
            onClick={() => onNav('guardianCall')}
          />
          <Row
            icon="phone" iconBg={TOKENS.color.dangerSoft}
            title="119 응급실"
            value="원터치 연결"
            onClick={() => {}}
          />
          <Row
            icon="user" title="주치의 연락처"
            value="성동의료원 내과 이선우"
            onClick={() => {}}
            last
          />
        </SettingsGroup>
      </div>

      {/* App */}
      <div style={{ padding: '20px 0 0' }}>
        <SettingsGroup label="앱">
          <Row icon="sun" title="글자 크기"
            value={settings.fontSize === 'large' ? '크게 (접근성)' : '보통'}
            onClick={() => patch({ fontSize: settings.fontSize === 'large' ? 'normal' : 'large' })}
          />
          <Row icon="shield" title="개인정보 처리방침" onClick={() => {}}/>
          <Row icon="note" title="도움말 및 문의" onClick={() => {}} last/>
        </SettingsGroup>
      </div>

      <div style={{ padding: '20px 0 28px' }}>
        <SettingsGroup>
          <Row
            icon="close" iconBg={TOKENS.color.dangerSoft}
            title="로그아웃" danger onClick={() => {}} last
          />
        </SettingsGroup>
        <div style={{
          textAlign: 'center', fontSize: 11, color: TOKENS.color.inkSubtle,
          marginTop: 16,
        }}>
          CareLog v0.1
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  CaregiverSettings, GuardianSettings,
  SettingsHeader, SettingsGroup, Row, Toggle, RoleCard,
});
