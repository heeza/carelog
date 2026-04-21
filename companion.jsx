// Caregiver Companion — on-device LLM chat with voice + typing.
// Single screen. Kakao-style bubbles, large mic, streaming assistant replies.

const COMPANION_SAMPLES = [
  '오늘은 뭐 드셨어요?',
  '옛날 얘기 좀 들려주세요.',
  '요즘 잠은 잘 주무세요?',
  '오늘 기분이 어떠세요?',
];

const SEED_MESSAGES = [
  { id: 's1', role: 'assistant', text: '안녕하세요, 영숙 님. 오늘은 기분이 좀 어떠세요?', time: '오전 10:12' },
  { id: 's2', role: 'user',      text: '그냥 그래요. 아침에 다리가 좀 쑤시네.', time: '오전 10:13' },
  { id: 's3', role: 'assistant', text: '어제보다 많이 쑤시세요? 따뜻한 물로 좀 풀어주시면 한결 나으실 거예요. 지수 님한테도 살짝 말씀드릴까요?', time: '오전 10:13' },
];

function CaregiverCompanion({ store, onNav }) {
  const [messages, setMessages] = React.useState(SEED_MESSAGES);
  const [input, setInput] = React.useState('');
  const [listening, setListening] = React.useState(false);
  const [streaming, setStreaming] = React.useState(false);
  const [streamText, setStreamText] = React.useState('');
  const scrollRef = React.useRef(null);

  // auto-scroll to latest
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamText]);

  const nowLabel = () => {
    const d = new Date();
    const h = d.getHours(); const m = d.getMinutes().toString().padStart(2, '0');
    const ap = h >= 12 ? '오후' : '오전'; const hh = ((h + 11) % 12) + 1;
    return `${ap} ${hh}:${m}`;
  };

  const appendUser = (text) => {
    const id = 'u' + Date.now();
    setMessages(m => [...m, { id, role: 'user', text, time: nowLabel() }]);
    respond(text);
  };

  const respond = async (userText) => {
    setStreaming(true);
    setStreamText('');
    let reply = '';
    try {
      reply = await window.claude.complete({
        messages: [
          { role: 'user', content:
            `너는 한국 노인의 말벗 "도우미"야. 따뜻하고 짧게 2-3문장으로 존댓말로 대답해. 의학적 조언은 하지 말고 공감 위주로. 사용자 메시지: "${userText}"` }
        ],
      });
    } catch (e) {
      reply = '그러셨구나. 오늘도 고생 많으셨어요. 조금 쉬시는 건 어때요?';
    }
    // Stream word by word
    const words = (reply || '').split(/(\s+)/);
    for (let i = 0; i < words.length; i++) {
      setStreamText(words.slice(0, i + 1).join(''));
      await new Promise(r => setTimeout(r, 40 + Math.random() * 35));
    }
    // commit
    const id = 'a' + Date.now();
    setMessages(m => [...m, { id, role: 'assistant', text: reply, time: nowLabel() }]);
    setStreamText('');
    setStreaming(false);
  };

  const sendTyped = () => {
    if (!input.trim() || streaming) return;
    appendUser(input.trim());
    setInput('');
  };

  const toggleMic = () => {
    if (streaming) return;
    if (listening) {
      setListening(false);
      // mock pick a sample
      const sample = COMPANION_SAMPLES[Math.floor(Math.random() * COMPANION_SAMPLES.length)];
      // answer as if user said something like "요즘 무릎이 좀 아프네요"
      const userSays = ['요즘 무릎이 좀 아프네요.', '어제 손주가 다녀갔어요.', '밥맛이 없어서 조금만 먹었어요.', '뉴스 보는 게 재미가 없네요.'][Math.floor(Math.random()*4)];
      appendUser(userSays);
    } else {
      setListening(true);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: TOKENS.color.bg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px 10px', display: 'flex', alignItems: 'center', gap: 10,
        background: TOKENS.color.surface,
        borderBottom: `1px solid ${TOKENS.color.border}`,
      }}>
        <button onClick={() => onNav('caregiverHome')} style={{
          width: 40, height: 40, borderRadius: 20, border: 'none',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="back" size={22} color={TOKENS.color.ink}/>
        </button>
        <div style={{
          width: 40, height: 40, borderRadius: 20,
          background: TOKENS.color.accentSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <Icon name="sparkle" size={20} color={TOKENS.color.accentDeep}/>
          <span style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: 5,
            background: TOKENS.color.good,
            border: `2px solid ${TOKENS.color.surface}`,
          }}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 600 }}>도우미</div>
          <div style={{ fontSize: 11, color: TOKENS.color.good, fontWeight: 500 }}>
            이 기기에서만 대화해요
          </div>
        </div>
        <button style={{
          width: 40, height: 40, borderRadius: 20, border: 'none',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="more" size={20} color={TOKENS.color.inkMuted}/>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '16px 16px 20px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <DateSeparator label="오늘 · 4월 21일"/>
        {messages.map((m, i) => {
          const prev = messages[i-1];
          const stack = prev && prev.role === m.role;
          return <Bubble key={m.id} role={m.role} text={m.text} time={m.time} stackWithPrev={stack}/>;
        })}
        {streaming && streamText && (
          <Bubble role="assistant" text={streamText} time="" streaming/>
        )}
        {streaming && !streamText && <TypingDots/>}
      </div>

      {/* Quick suggestions — shown when conversation is idle */}
      {!streaming && !listening && messages.length < 8 && (
        <div style={{
          padding: '0 12px 8px', display: 'flex', gap: 6, overflowX: 'auto',
        }}>
          {['오늘 기분은요?', '옛날 얘기 들어줘', '손주 얘기', '자장가 불러줘'].map(q => (
            <button key={q} onClick={() => appendUser(q)} style={{
              flexShrink: 0,
              padding: '8px 14px', borderRadius: TOKENS.radius.pill,
              border: `1px solid ${TOKENS.color.border}`,
              background: TOKENS.color.surface,
              fontSize: 12, color: TOKENS.color.inkMuted,
              fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}>{q}</button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        padding: '10px 12px 14px',
        background: TOKENS.color.surface,
        borderTop: `1px solid ${TOKENS.color.border}`,
        display: 'flex', alignItems: 'flex-end', gap: 10,
      }}>
        <div style={{
          flex: 1,
          background: TOKENS.color.surfaceAlt,
          borderRadius: 22, minHeight: 44,
          display: 'flex', alignItems: 'center',
          padding: '4px 6px 4px 16px',
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendTyped(); }}
            placeholder={listening ? '듣고 있어요…' : '말씀해주세요, 편하게요'}
            disabled={listening}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 'var(--fs-body)', fontFamily: 'inherit',
              color: TOKENS.color.ink,
              padding: '8px 0',
            }}/>
          {input.trim() && !listening && (
            <button onClick={sendTyped} disabled={streaming} style={{
              width: 34, height: 34, borderRadius: 17, border: 'none',
              background: TOKENS.color.accent, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: streaming ? 'not-allowed' : 'pointer', opacity: streaming ? 0.5 : 1,
            }}>
              <Icon name="arrow" size={18} strokeWidth={2.3}/>
            </button>
          )}
        </div>
        <MicButton listening={listening} onClick={toggleMic} disabled={streaming}/>
      </div>
    </div>
  );
}

// ─── Bubble ──────────────────────────────────────────────────
function Bubble({ role, text, time, stackWithPrev, streaming }) {
  const isUser = role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end', gap: 8,
      marginTop: stackWithPrev ? 2 : 10,
    }}>
      {!isUser && !stackWithPrev && (
        <div style={{
          width: 32, height: 32, borderRadius: 16,
          background: TOKENS.color.accentSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name="sparkle" size={16} color={TOKENS.color.accentDeep}/>
        </div>
      )}
      {!isUser && stackWithPrev && <div style={{ width: 32, flexShrink: 0 }}/>}
      <div style={{
        display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end', gap: 6, maxWidth: '78%',
      }}>
        <div style={{
          padding: '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
          background: isUser ? TOKENS.color.accent : TOKENS.color.surface,
          color: isUser ? '#fff' : TOKENS.color.ink,
          fontSize: 'var(--fs-body)', lineHeight: 1.5,
          boxShadow: isUser ? 'none' : '0 1px 2px rgba(15,27,42,0.05)',
          border: isUser ? 'none' : `1px solid ${TOKENS.color.border}`,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {text}
          {streaming && (
            <span style={{
              display: 'inline-block', width: 2, height: '1em', verticalAlign: '-2px',
              marginLeft: 2, background: TOKENS.color.inkMuted,
              animation: 'blink 1s steps(2) infinite',
            }}/>
          )}
        </div>
        {time && (
          <div style={{
            fontSize: 10, color: TOKENS.color.inkSubtle,
            whiteSpace: 'nowrap', paddingBottom: 3,
          }}>{time}</div>
        )}
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}

// ─── Typing dots (before first streamed word) ───────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 16,
        background: TOKENS.color.accentSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="sparkle" size={16} color={TOKENS.color.accentDeep}/>
      </div>
      <div style={{
        padding: '12px 16px', borderRadius: '4px 18px 18px 18px',
        background: TOKENS.color.surface, border: `1px solid ${TOKENS.color.border}`,
        display: 'flex', gap: 4,
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: 3,
            background: TOKENS.color.inkSubtle,
            animation: `bounce 1.2s ${i*0.15}s infinite ease-in-out`,
          }}/>
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Date separator ─────────────────────────────────────────
function DateSeparator({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '4px 0 12px',
    }}>
      <div style={{
        padding: '4px 12px', borderRadius: TOKENS.radius.pill,
        background: 'rgba(15,27,42,0.05)',
        fontSize: 11, color: TOKENS.color.inkSubtle, fontWeight: 500,
      }}>{label}</div>
    </div>
  );
}

// ─── Mic button with listening animation ────────────────────
function MicButton({ listening, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 54, height: 54, borderRadius: 27,
      border: 'none',
      background: listening ? TOKENS.color.danger : TOKENS.color.accent,
      color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, position: 'relative',
      boxShadow: listening
        ? `0 0 0 8px rgba(194,69,58,0.15), 0 0 0 16px rgba(194,69,58,0.08)`
        : `0 4px 12px rgba(59,122,158,0.35)`,
      transition: 'all 0.15s',
      opacity: disabled ? 0.5 : 1,
      fontFamily: 'inherit',
    }}>
      {listening ? (
        <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 20 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 3, borderRadius: 2, background: '#fff',
              animation: `wave 0.9s ${i*0.12}s infinite ease-in-out`,
            }}/>
          ))}
        </div>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="3" width="6" height="12" rx="3"/>
          <path d="M5 11a7 7 0 0014 0"/>
          <path d="M12 18v3"/>
        </svg>
      )}
      <style>{`
        @keyframes wave {
          0%, 100% { height: 6px; }
          50% { height: 18px; }
        }
      `}</style>
    </button>
  );
}

Object.assign(window, { CaregiverCompanion });
