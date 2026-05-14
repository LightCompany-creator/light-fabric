// LightFlow — Mobile screens (4 designs)
// Render inside IOSDevice frames placed on a design canvas.

const M = {
  brand: '#214A8C', brandDark: '#163566', pale: '#E8EFF8', mist: '#F4F7FC',
  ink: '#0F1B2D', ink2: '#344563', dim: '#6B7C93', soft: '#9AABBF',
  border: '#D9E2EE', borderSoft: '#E6ECF4',
  amber: '#F59E0B', amberBg: '#FEF3C7', amberDark: '#92400E',
  success: '#10B981', successDark: '#065F46', successBg: '#D1FAE5',
  danger: '#EF4444', dangerBg: '#FEE2E2', dangerDark: '#991B1B',
  purple: '#7C3AED', purpleBg: '#EDE9FE', purpleDark: '#5B21B6',
  mono: "'JetBrains Mono', monospace",
  num: { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' },
};

const MI = (p, s = 22) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>
);
const MIcon = {
  home: MI(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-6h-2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>),
  shift: MI(<><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></>),
  batch: MI(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>),
  report: MI(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="14" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></>),
  profile: MI(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  back: MI(<polyline points="15 18 9 12 15 6"/>),
  more: MI(<><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></>),
  plus: MI(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
  check: MI(<polyline points="20 6 9 17 4 12"/>),
  scan: MI(<><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/></>),
  factory: MI(<><path d="M3 21h18M5 21V10l4 3V10l4 3V10l4 3v8M9 7l-1-3M15 7l-1-3"/></>),
  user: MI(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 20a6 6 0 0 1 11 0"/></>),
  lock: MI(<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>),
  fp:   MI(<><path d="M6 11c0-3 2.5-6 6-6s6 3 6 6v2"/><path d="M6 18v-7"/><path d="M18 16v3"/><path d="M10 21v-9a2 2 0 1 1 4 0v9"/></>),
  ok:   MI(<><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></>),
  warn: MI(<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>),
  arrow: MI(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>, 16),
  trendUp: MI(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>, 16),
  trendDn: MI(<><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>, 16),
  filter: MI(<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>),
  bell:  MI(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>),
  cal:   MI(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  chevR: MI(<polyline points="9 18 15 12 9 6"/>, 18),
  cam:   MI(<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>),
};

// ============= COMMON =============
function StatusBar({ time = '9:41', dark = false }) {
  const c = dark ? '#fff' : '#000';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px 6px', fontFamily: '-apple-system, "SF Pro", system-ui' }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: c }}>{time}</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="0.6" fill={c}/><rect x="4.5" y="4.5" width="3" height="6.5" rx="0.6" fill={c}/><rect x="9" y="2" width="3" height="9" rx="0.6" fill={c}/><rect x="13.5" y="0" width="3" height="11" rx="0.6" fill={c}/></svg>
        <svg width="24" height="11" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="22" height="11" rx="2.7" stroke={c} strokeOpacity="0.35" fill="none"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill={c}/><path d="M24 4v4c.7-.2 1.2-1.1 1.2-2s-.5-1.8-1.2-2z" fill={c} fillOpacity="0.4"/></svg>
      </div>
    </div>
  );
}

function TopBar({ title, sub, onBack, action, dark = false }) {
  const bg = dark ? M.brand : 'white';
  const fg = dark ? 'white' : M.ink;
  return (
    <div style={{ background: bg, padding: '6px 16px 14px', borderBottom: dark ? 'none' : `1px solid ${M.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 36 }}>
        {onBack && (
          <button style={{
            width: 36, height: 36, marginLeft: -6, background: 'transparent', border: 'none', color: fg,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>{MIcon.back}</button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: fg, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.7)' : M.dim, marginTop: 2 }}>{sub}</div>}
        </div>
        {action}
      </div>
    </div>
  );
}

function TabBar({ active = 'home' }) {
  const tabs = [
    { id: 'home',    label: 'Главная', icon: MIcon.home },
    { id: 'shift',   label: 'Смена',   icon: MIcon.shift },
    { id: 'batch',   label: 'Партии',  icon: MIcon.batch },
    { id: 'report',  label: 'Отчёты',  icon: MIcon.report },
    { id: 'profile', label: 'Я',       icon: MIcon.profile },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'white', borderTop: `1px solid ${M.border}`,
      padding: '8px 4px 22px',
      display: 'flex', alignItems: 'stretch',
    }}>
      {tabs.map(t => {
        const a = t.id === active;
        return (
          <button key={t.id} style={{
            flex: 1, background: 'transparent', border: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '6px 0', cursor: 'pointer',
            color: a ? M.brand : M.soft,
          }}>
            <span style={{ display: 'inline-flex' }}>{React.cloneElement(t.icon, { width: 24, height: 24, strokeWidth: a ? 2.2 : 1.8 })}</span>
            <span style={{ fontSize: 11, fontWeight: a ? 700 : 600 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function HomeIndicator({ dark = false }) {
  return (
    <div style={{
      position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
      width: 134, height: 5, borderRadius: 3, background: dark ? '#fff' : '#000',
      opacity: dark ? 0.9 : 1, zIndex: 10,
    }}></div>
  );
}

// ============= SCREEN 1 — LOGIN =============
function LoginScreen() {
  return (
    <div style={{ height: '100%', background: '#fff', position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui" }}>
      <StatusBar/>
      <div style={{ flex: 1, padding: '32px 20px 0', display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ marginTop: 28, marginBottom: 36, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: M.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(33,74,140,0.3)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V10l4 3V10l4 3V10l4 3v8"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: M.ink }}>
              Light<span style={{ color: M.brand }}>Flow</span>
            </div>
            <div style={{ fontSize: 11, color: M.dim, fontWeight: 600, letterSpacing: '0.04em' }}>обувной завод «Заря»</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: M.ink, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Здравствуйте
          </h1>
          <div style={{ fontSize: 15, color: M.dim, marginTop: 6 }}>Войдите по табельному номеру и PIN-коду</div>
        </div>

        {/* Tabel number */}
        <label style={fieldLabel}>Табельный номер</label>
        <div style={{
          height: 56, background: M.mist, border: `2px solid ${M.brand}`, borderRadius: 12,
          padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
        }}>
          <span style={{ color: M.brand, display: 'inline-flex' }}>{MIcon.user}</span>
          <span style={{ ...M.num, fontSize: 22, fontWeight: 700, color: M.ink, letterSpacing: '0.06em' }}>042</span>
          <span style={{ flex: 1 }}></span>
          <span style={{ fontSize: 13, color: M.dim }}>Морозова Н.В.</span>
        </div>

        {/* PIN */}
        <label style={fieldLabel}>PIN-код</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 26 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              flex: 1, height: 64, borderRadius: 12,
              background: i <= 3 ? M.brand : 'white',
              border: i <= 3 ? `2px solid ${M.brand}` : `2px solid ${M.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {i <= 3 && <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'white' }}></span>}
            </div>
          ))}
        </div>

        {/* Login button */}
        <button style={{
          height: 56, background: M.brand, color: 'white', border: 'none', borderRadius: 14,
          fontSize: 17, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 20px rgba(33,74,140,0.35)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          Войти {MIcon.arrow}
        </button>

        {/* Numpad-ish hint row */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <button style={{
            height: 48, padding: '0 18px', background: M.pale, color: M.brand,
            border: 'none', borderRadius: 100,
            fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>{MIcon.fp} Touch ID</button>
          <button style={{
            height: 48, padding: '0 18px', background: 'transparent', color: M.brand,
            border: 'none', fontSize: 14, fontWeight: 600,
          }}>Забыл PIN</button>
        </div>

        <div style={{ flex: 1 }}></div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ ...M.num, fontSize: 11, color: M.soft, fontWeight: 600 }}>v 1.4.2 · обновлено 12.05.2026</div>
          <div style={{ fontSize: 11, color: M.soft, marginTop: 4 }}>Связь с сервером: <span style={{ color: M.successDark, fontWeight: 700 }}>● онлайн</span></div>
        </div>
      </div>
      <HomeIndicator/>
    </div>
  );
}
const fieldLabel = { fontSize: 12, fontWeight: 700, color: M.dim, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'block', fontFamily: M.mono };

// ============= SCREEN 2 — FOREMAN HOME =============
function ForemanScreen() {
  return (
    <div style={{ height: '100%', background: M.mist, position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui" }}>
      <StatusBar dark={true}/>
      {/* Dark blue hero header */}
      <div style={{ background: M.brand, padding: '8px 16px 22px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', border: '2px solid rgba(255,255,255,0.35)', color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>МН</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, opacity: 0.8, fontFamily: M.mono, fontWeight: 600, letterSpacing: '0.08em' }}>БРИГАДИР · СМЕНА 1</div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Морозова Н.В.</div>
          </div>
          <button style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.16)', border: 'none', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {MIcon.bell}
            <span style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: '50%', background: M.amber, border: '2px solid ' + M.brand }}></span>
          </button>
        </div>

        {/* Big shift card */}
        <div style={{
          background: 'rgba(255,255,255,0.10)', borderRadius: 16, padding: '14px 16px',
          border: '1px solid rgba(255,255,255,0.18)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: M.success }}></span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', fontFamily: M.mono }}>СМЕНА АКТИВНА · ШВЕЙКА</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 8 }}>
            <div>
              <div style={{ ...M.num, fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>132</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>пары выпущено</div>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.25)' }}></div>
            <div>
              <div style={{ ...M.num, fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>5:42</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>прошло</div>
            </div>
            <div style={{ flex: 1 }}></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ ...M.num, fontSize: 14, fontWeight: 700 }}>76%</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>от плана</div>
            </div>
          </div>
          <div style={{ marginTop: 12, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
            <div style={{ width: '76%', height: '100%', background: 'white', borderRadius: 3 }}></div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 16px 100px' }}>
        {/* Big primary action */}
        <button style={{
          width: '100%', height: 64, background: 'white', color: M.brand,
          border: `2px solid ${M.brand}`, borderRadius: 16,
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px',
          marginBottom: 12,
          boxShadow: '0 4px 12px rgba(33,74,140,0.08)',
        }}>
          <span style={{
            width: 40, height: 40, borderRadius: 10, background: M.brand, color: 'white',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>{MIcon.scan}</span>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Сканировать партию</div>
            <div style={{ fontSize: 12, color: M.dim, fontWeight: 500, marginTop: 2 }}>QR-код или ввод вручную</div>
          </div>
          <span style={{ color: M.soft }}>{MIcon.chevR}</span>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
          <button style={quickAction(M.success)}>
            <span style={{ display: 'inline-flex', color: M.successDark }}>{MIcon.plus}</span>
            <span>Принять</span>
          </button>
          <button style={quickAction(M.amber)}>
            <span style={{ display: 'inline-flex', color: M.amberDark }}>{MIcon.warn}</span>
            <span>Брак</span>
          </button>
        </div>

        {/* In-shift batches */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: M.ink, letterSpacing: '-0.01em' }}>На смене · 3 партии</h3>
          <button style={{ background: 'transparent', border: 'none', color: M.brand, fontSize: 13, fontWeight: 700, padding: 0 }}>Все →</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BatchRow code="ШВ-120526-04" sku="022 Аляска" pairs="48" pct={60} stage="В работе" tone="active"/>
          <BatchRow code="ШВ-120526-03" sku="022 Аляска" pairs="60" pct={100} stage="Готова" tone="done"/>
          <BatchRow code="ШВ-120526-02" sku="905 Галоши" pairs="24" pct={92} stage="В работе" tone="active"/>
        </div>

        {/* Brigade */}
        <div style={{
          marginTop: 22, background: 'white', borderRadius: 14, border: `1px solid ${M.border}`, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: M.ink }}>Бригада · 6 чел</div>
            <span style={{ ...M.num, fontSize: 12, fontWeight: 700, color: M.successDark, background: M.successBg, padding: '3px 9px', borderRadius: 100 }}>5 на смене</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {['АС','МВ','ПЕ','КТ','ЯН','ОВ'].map((i, idx) => (
              <div key={idx} style={{
                width: 36, height: 36, borderRadius: '50%',
                background: idx === 5 ? '#F4F7FC' : M.pale,
                color: idx === 5 ? M.soft : M.brand,
                border: `2px solid ${idx === 5 ? M.border : 'white'}`,
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: idx === 5 ? 0.5 : 1,
              }}>{i}</div>
            ))}
          </div>
        </div>
      </div>

      <TabBar active="home"/>
      <HomeIndicator dark={false}/>
    </div>
  );
}

const quickAction = (accent) => ({
  height: 56, background: 'white', color: M.ink,
  border: `1px solid ${M.border}`, borderRadius: 14,
  fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
});

function BatchRow({ code, sku, pairs, pct, stage, tone }) {
  const toneMap = {
    active: { bg: M.pale, fg: M.brand, dot: M.brand },
    done:   { bg: M.successBg, fg: M.successDark, dot: M.success },
  };
  const t = toneMap[tone] || toneMap.active;
  return (
    <div style={{
      background: 'white', borderRadius: 14, border: `1px solid ${M.border}`,
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ ...M.num, fontSize: 13, fontWeight: 700, color: M.ink, letterSpacing: '0.02em' }}>{code}</div>
        <span style={{ flex: 1 }}></span>
        <span style={{
          ...M.num, fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 100,
          background: t.bg, color: t.fg,
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot }}></span>
          {stage}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: M.ink }}>{sku}</span>
        <span style={{ flex: 1 }}></span>
        <span style={{ ...M.num, fontSize: 15, fontWeight: 800, color: M.ink }}>{pairs}</span>
        <span style={{ fontSize: 12, color: M.dim }}>пар</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 5, background: M.mist, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: t.dot, borderRadius: 3 }}></div>
        </div>
        <span style={{ ...M.num, fontSize: 12, fontWeight: 700, color: M.dim, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
      </div>
    </div>
  );
}

// ============= SCREEN 3 — BATCH CARD =============
function BatchCard() {
  const route = [
    { name: 'Литейка',    state: 'done',    pct: 100, when: '11.05  09:14' },
    { name: 'Клеевой',    state: 'done',    pct: 100, when: '11.05  15:42' },
    { name: 'Швейка',     state: 'active',  pct: 60,  when: '12.05  08:00' },
    { name: 'ОТК',        state: 'pending', pct: 0,   when: '—' },
    { name: 'Упаковка',   state: 'pending', pct: 0,   when: '—' },
    { name: 'Склад',      state: 'pending', pct: 0,   when: '—' },
  ];
  return (
    <div style={{ height: '100%', background: M.mist, position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui" }}>
      <StatusBar/>
      <TopBar
        title="Партия ШВ-120526-04"
        sub="022 Аляска · размер 41 · 48 пар"
        onBack={true}
        action={
          <button style={{ width: 36, height: 36, background: 'transparent', border: 'none', color: M.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{MIcon.more}</button>
        }
      />

      {/* Tabs */}
      <div style={{ background: 'white', display: 'flex', gap: 8, padding: '0 16px', borderBottom: `1px solid ${M.border}` }}>
        {['Маршрут', 'Состав', 'История'].map((t, i) => {
          const a = i === 0;
          return (
            <button key={t} style={{
              padding: '12px 4px', background: 'transparent', border: 'none',
              color: a ? M.brand : M.dim, fontSize: 14, fontWeight: a ? 700 : 600,
              borderBottom: a ? `2px solid ${M.brand}` : '2px solid transparent',
              marginBottom: -1, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>{t}{i === 2 && <span style={{ ...M.num, fontSize: 11, padding: '1px 7px', borderRadius: 100, background: M.mist, color: M.dim, fontWeight: 700 }}>14</span>}</button>
          );
        })}
      </div>

      {/* Status hero */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: 'white', borderRadius: 14, border: `1px solid ${M.border}`, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12, background: M.pale, color: M.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ display: 'inline-flex' }}>{MIcon.factory}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: M.dim, fontFamily: M.mono, fontWeight: 700, letterSpacing: '0.08em' }}>СЕЙЧАС НА</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: M.ink, letterSpacing: '-0.01em' }}>Швейка</div>
            <div style={{ fontSize: 12, color: M.dim, marginTop: 2 }}>Морозова Н.В. · с 08:00</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ ...M.num, fontSize: 22, fontWeight: 800, color: M.brand }}>60%</div>
            <div style={{ ...M.num, fontSize: 11, color: M.dim, fontWeight: 600 }}>29 из 48 пар</div>
          </div>
        </div>
      </div>

      {/* Route — horizontal scroll */}
      <div style={{ padding: '20px 0 8px' }}>
        <div style={{ padding: '0 16px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: M.ink, letterSpacing: '-0.01em' }}>Технологический маршрут</h3>
          <span style={{ ...M.num, fontSize: 11, color: M.dim, fontWeight: 700 }}>3 / 6</span>
        </div>
        <div style={{ overflowX: 'auto', padding: '4px 16px 8px', display: 'flex', gap: 8 }}>
          {route.map((s, i) => {
            const a = s.state === 'active';
            const d = s.state === 'done';
            const styleByState = {
              active: { border: M.brand, bg: M.pale, fg: M.brand, dot: M.brand },
              done:   { border: M.success, bg: M.successBg, fg: M.successDark, dot: M.success },
              pending:{ border: M.border, bg: 'white', fg: M.soft, dot: M.soft },
            }[s.state];
            return (
              <React.Fragment key={i}>
                <div style={{
                  minWidth: 130, padding: '12px 12px', borderRadius: 12,
                  background: styleByState.bg, border: `1.5px solid ${styleByState.border}`,
                  flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: d ? styleByState.dot : 'white',
                      border: a ? `2px solid ${styleByState.dot}` : (d ? 'none' : `1.5px solid ${M.border}`),
                      color: d ? 'white' : styleByState.fg,
                      fontSize: 10, fontWeight: 800,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>{d ? <span style={{ display: 'inline-flex' }}>{React.cloneElement(MIcon.check, { width: 12, height: 12, strokeWidth: 3 })}</span> : (i + 1)}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: styleByState.fg }}>{s.name}</span>
                  </div>
                  <div style={{ ...M.num, fontSize: 11, color: M.dim, fontWeight: 600 }}>{s.when}</div>
                  {a && (
                    <div style={{ marginTop: 6, height: 4, background: 'white', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: s.pct + '%', height: '100%', background: styleByState.dot }}></div>
                    </div>
                  )}
                </div>
                {i < route.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: M.soft }}>
                    {React.cloneElement(MIcon.chevR, { width: 14, height: 14 })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: '14px 16px 100px', overflowY: 'auto', flex: 1 }}>
        <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${M.border}`, padding: '4px 16px', marginBottom: 12 }}>
          <DetailRow k="Заказ" v="ОО-1142 · ИП Логинов" />
          <DetailRow k="Срок" v="до 18.05.2026" warn={true}/>
          <DetailRow k="Открыта" v="11.05.2026, 09:14 · Корнеев Д.Б." />
          <DetailRow k="Брак на смене" v="0 пар" />
          <DetailRow k="Расход материала" v="64.8 кг ЭВА (план 65.0)" last={true}/>
        </div>

        {/* Action button — sticky-ish */}
        <button style={{
          width: '100%', height: 56, background: M.brand, color: 'white',
          border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(33,74,140,0.3)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {MIcon.check} Передать дальше
        </button>
        <button style={{
          width: '100%', height: 48, background: 'white', color: M.amberDark,
          border: `1px solid ${M.amberDark}33`, borderRadius: 14,
          fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 10,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {React.cloneElement(MIcon.warn, { width: 18, height: 18 })} Зафиксировать брак
        </button>
      </div>

      <HomeIndicator/>
    </div>
  );
}

function DetailRow({ k, v, last, warn }) {
  return (
    <div style={{
      padding: '12px 0',
      borderBottom: last ? 'none' : `1px solid ${M.borderSoft}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 13, color: M.dim, minWidth: 130 }}>{k}</span>
      <span style={{ flex: 1 }}></span>
      <span style={{ fontSize: 14, fontWeight: 600, color: warn ? M.amberDark : M.ink, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

// ============= SCREEN 4 — DIRECTOR DASHBOARD =============
function DirectorScreen() {
  return (
    <div style={{ height: '100%', background: M.mist, position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui" }}>
      <StatusBar/>
      <TopBar
        title="Дашборд"
        sub="12 мая, среда · 14:42"
        action={
          <button style={{ width: 36, height: 36, background: M.pale, color: M.brand, border: 'none', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.cloneElement(MIcon.cal, { width: 18, height: 18 })}
          </button>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px 100px' }}>
        {/* Period selector pill */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, padding: 4, background: 'white', borderRadius: 12, border: `1px solid ${M.border}` }}>
          {['Сегодня', 'Неделя', 'Месяц', 'Квартал'].map((p, i) => {
            const a = i === 1;
            return (
              <button key={p} style={{
                flex: 1, padding: '8px 0', background: a ? M.brand : 'transparent',
                color: a ? 'white' : M.ink2, border: 'none', borderRadius: 9,
                fontSize: 13, fontWeight: a ? 700 : 600, cursor: 'pointer',
              }}>{p}</button>
            );
          })}
        </div>

        {/* KPI grid 2x2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <KPI label="Выпуск, пар" value="28 750" delta="+8.4%" up={true}/>
          <KPI label="Выручка, ₽" value="24.4M" delta="+12%" up={true} accent={M.brand}/>
          <KPI label="Брак, %" value="0.8" delta="−0.3 п.п." up={true} accent={M.success}/>
          <KPI label="ФОТ, ₽" value="1.25M" delta="+3%" up={false}/>
        </div>

        {/* Big chart card */}
        <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${M.border}`, padding: '14px 16px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 11, color: M.dim, fontFamily: M.mono, fontWeight: 700, letterSpacing: '0.08em' }}>ВЫПУСК ПО ДНЯМ</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                <span style={{ ...M.num, fontSize: 26, fontWeight: 800, color: M.ink, letterSpacing: '-0.02em' }}>5 920</span>
                <span style={{ fontSize: 13, color: M.dim }}>пар сегодня</span>
              </div>
            </div>
            <span style={{
              ...M.num, fontSize: 12, fontWeight: 700, color: M.successDark,
              background: M.successBg, padding: '4px 10px', borderRadius: 100,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>{React.cloneElement(MIcon.trendUp, { width: 12, height: 12 })} +8.4%</span>
          </div>
          {/* SVG mini chart */}
          <Chart/>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: M.soft, fontFamily: M.mono, fontWeight: 600 }}>
            <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
          </div>
        </div>

        {/* By workshop */}
        <h3 style={{ margin: '0 0 10px 4px', fontSize: 14, fontWeight: 800, color: M.ink, letterSpacing: '-0.01em' }}>По цехам · 9</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          <ShopRow name="Литейка" pairs="1 240" pct={92} status="active"/>
          <ShopRow name="Клеевой" pairs="980" pct={78} status="active"/>
          <ShopRow name="Швейка" pairs="1 320" pct={88} status="active"/>
          <ShopRow name="ОТК" pairs="930" pct={64} status="warn"/>
          <ShopRow name="Упаковка" pairs="1 450" pct={96} status="active"/>
        </div>

        {/* Alerts */}
        <div style={{
          background: '#FFFBEB', border: `1px solid ${M.amber}55`, borderRadius: 14,
          padding: '14px 14px', display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: M.amber + '22', color: M.amberDark, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {MIcon.warn}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: M.amberDark }}>2 аномалии за смену</div>
            <div style={{ fontSize: 12, color: M.amberDark, opacity: 0.85, marginTop: 3 }}>ИЛМ-3 простой 30 мин · ОТК отстаёт от плана</div>
          </div>
          <button style={{ background: 'transparent', border: 'none', color: M.amberDark, padding: 0, marginTop: 2 }}>{MIcon.chevR}</button>
        </div>
      </div>

      <TabBar active="report"/>
      <HomeIndicator/>
    </div>
  );
}

function KPI({ label, value, delta, up, accent = M.ink }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${M.border}`, padding: '14px' }}>
      <div style={{ fontSize: 11, color: M.dim, fontFamily: M.mono, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ ...M.num, fontSize: 24, fontWeight: 800, color: accent, letterSpacing: '-0.02em', marginTop: 8, lineHeight: 1 }}>{value}</div>
      <div style={{
        marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 12, fontWeight: 700, color: up ? M.successDark : M.amberDark,
        fontFamily: M.mono,
      }}>
        {React.cloneElement(up ? MIcon.trendUp : MIcon.trendDn, { width: 12, height: 12 })}
        {delta}
      </div>
    </div>
  );
}

function ShopRow({ name, pairs, pct, status }) {
  const c = status === 'warn' ? M.amber : M.brand;
  return (
    <div style={{ background: 'white', borderRadius: 12, border: `1px solid ${M.border}`, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }}></span>
        <span style={{ fontSize: 14, fontWeight: 700, color: M.ink, flex: 1 }}>{name}</span>
        <span style={{ ...M.num, fontSize: 14, fontWeight: 800, color: M.ink }}>{pairs}</span>
        <span style={{ fontSize: 11, color: M.dim }}>пар</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 4, background: M.mist, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: c }}></div>
        </div>
        <span style={{ ...M.num, fontSize: 11, fontWeight: 700, color: c, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
      </div>
    </div>
  );
}

function Chart() {
  const pts = [44, 60, 52, 78, 86, 70, 92];
  const w = 320, h = 110, pad = 6;
  const max = 100;
  const xs = pts.map((_, i) => pad + (i * (w - pad * 2)) / (pts.length - 1));
  const ys = pts.map(p => h - pad - (p / max) * (h - pad * 2 - 8));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  const area = `${path} L ${xs[xs.length - 1]} ${h} L ${xs[0]} ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 110, marginTop: 10, display: 'block' }}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={M.brand} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={M.brand} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <line x1="0" y1={h - pad} x2={w} y2={h - pad} stroke={M.borderSoft}/>
      <path d={area} fill="url(#cg)"/>
      <path d={path} stroke={M.brand} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={i === pts.length - 1 ? 5 : 3} fill="white" stroke={M.brand} strokeWidth="2.5"/>
      ))}
    </svg>
  );
}

window.LoginScreen = LoginScreen;
window.ForemanScreen = ForemanScreen;
window.BatchCard = BatchCard;
window.DirectorScreen = DirectorScreen;
