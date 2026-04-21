// Central app state — shared between caregiver and guardian views.
// Mutations propagate instantly so logging from caregiver updates guardian timeline.

const INITIAL_LOGS = [
  {
    id: 'l1',
    timestamp: new Date('2026-04-21T08:15:00'),
    meal: 'completed',
    medication: 'completed',
    condition: 'good',
    issue: 'none',
    note: '잘 잤고 아침 잘 먹었다.',
    caregiver: '어머니',
  },
  {
    id: 'l2',
    timestamp: new Date('2026-04-21T12:30:00'),
    meal: 'completed',
    medication: 'completed',
    condition: 'normal',
    issue: 'none',
    note: '',
    caregiver: '어머니',
  },
  {
    id: 'l3',
    timestamp: new Date('2026-04-20T19:50:00'),
    meal: 'partial',
    medication: 'completed',
    condition: 'normal',
    issue: 'low_appetite',
    note: '저녁 조금 남겼다. 산책 후 피곤함.',
    caregiver: '어머니',
  },
  {
    id: 'l4',
    timestamp: new Date('2026-04-20T08:00:00'),
    meal: 'completed',
    medication: 'completed',
    condition: 'good',
    issue: 'none',
    note: '',
    caregiver: '어머니',
  },
];

const INITIAL_EMERGENCY = []; // or [{id, timestamp, type, note, handled}]

function useCareLogStore() {
  const [logs, setLogs] = React.useState(INITIAL_LOGS);
  const [emergencies, setEmergencies] = React.useState(INITIAL_EMERGENCY);
  const [emergencyActive, setEmergencyActive] = React.useState(false);

  const addLog = (entry) => {
    const e = {
      id: 'l' + Date.now(),
      timestamp: new Date(),
      caregiver: '어머니',
      ...entry,
    };
    setLogs((l) => [e, ...l]);
    return e;
  };

  const triggerEmergency = (type, note) => {
    const e = {
      id: 'e' + Date.now(),
      timestamp: new Date(),
      type, note, handled: false,
    };
    setEmergencies((x) => [e, ...x]);
    setEmergencyActive(true);
    return e;
  };

  const dismissEmergency = (id) => {
    setEmergencies((x) => x.map((e) => e.id === id ? { ...e, handled: true } : e));
    setEmergencyActive(false);
  };

  const reset = () => {
    setLogs(INITIAL_LOGS);
    setEmergencies(INITIAL_EMERGENCY);
    setEmergencyActive(false);
  };

  return {
    logs, emergencies, emergencyActive,
    addLog, triggerEmergency, dismissEmergency, reset,
  };
}

// Option catalogs
const ISSUE_OPTIONS = [
  { key: 'none',         label: '없음' },
  { key: 'dizziness',    label: '어지러움' },
  { key: 'pain',         label: '통증' },
  { key: 'low_appetite', label: '식욕저하' },
  { key: 'other',        label: '기타' },
];

const CONDITION_OPTIONS = [
  { key: 'good',   label: '좋음',   tone: 'good' },
  { key: 'normal', label: '보통',   tone: 'neutral' },
  { key: 'bad',    label: '나쁨',   tone: 'danger' },
];

const MEAL_OPTIONS = [
  { key: 'completed', label: '완료' },
  { key: 'partial',   label: '일부' },
  { key: 'missed',    label: '미완료' },
];

const MED_OPTIONS = [
  { key: 'completed', label: '복용' },
  { key: 'missed',    label: '미복용' },
];

const EMERGENCY_TYPES = [
  { key: 'unconscious', label: '의식 이상',    hint: '무반응 / 실신' },
  { key: 'fall',        label: '낙상',         hint: '넘어짐 / 쓰러짐' },
  { key: 'breathing',   label: '호흡 문제',    hint: '호흡 곤란' },
  { key: 'pain',        label: '심한 통증',    hint: '흉부, 두부, 복부' },
  { key: 'other',       label: '기타',         hint: '메모로 설명' },
];

Object.assign(window, {
  useCareLogStore,
  ISSUE_OPTIONS, CONDITION_OPTIONS, MEAL_OPTIONS, MED_OPTIONS, EMERGENCY_TYPES,
});
