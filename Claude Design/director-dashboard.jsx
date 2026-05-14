// LightFlow — Director dashboard

const dIcon = (paths, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);

const DD = {
  brand: '#214A8C', brandDark: '#163566', pale: '#E8EFF8', mist: '#F4F7FC',
  accent: '#F59E0B', success: '#10B981', danger: '#EF4444',
  violet: '#8B5CF6', cyan: '#06B6D4', rose: '#EC4899',
  ink: '#0F1B2D', ink2: '#344563', dim: '#6B7C93', soft: '#9AABBF',
  border: '#D9E2EE',
  mono: "'JetBrains Mono', monospace",
  num: { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' },
};

const DIcons = {
  pkg:    dIcon(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>, 22),
  ruble:  dIcon(<><path d="M6 4h7a4 4 0 0 1 0 8H6"/><line x1="3" y1="12" x2="13" y2="12"/><line x1="6" y1="4" x2="6" y2="20"/><line x1="3" y1="16" x2="11" y2="16"/></>, 22),
  layers: dIcon(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>, 22),
  shield: dIcon(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>, 22),
  users:  dIcon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>, 22),
  flask:  dIcon(<><path d="M9 2v7.31"/><path d="M15 2v7.31"/><path d="M5 22h14a2 2 0 0 0 1.84-2.75L17 13H7L3.16 19.25A2 2 0 0 0 5 22z"/><line x1="9" y1="2" x2="15" y2="2"/></>, 22),
  alert:  dIcon(<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, 18),
  up:     dIcon(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>, 14),
  down:   dIcon(<><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>, 14),
  cal:    dIcon(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, 14),
  arrow:  dIcon(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>, 14),
};

// --- Header ---
function DDHeader() {
  const periods = ['Сегодня', 'Неделя', 'Месяц', 'Произвольный'];
  return (
    <header style={{ background: 'white', borderBottom: `1px solid ${DD.border}`, padding: '20px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: DD.ink }}>Light</span><span style={{ color: DD.brand }}>Flow</span>
          </div>
          <div style={{ height: 28, width: 1, background: DD.border }}></div>
          <div>
            <div style={{ ...DD.num, fontSize: 11, color: DD.dim, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
              Дашборд директора
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: DD.ink, letterSpacing: '-0.01em' }}>
              Производство · сегодня, 12 мая 2026
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '10px 18px', background: '#D1FAE5', border: `1px solid #A7F3D0`,
            borderRadius: 100, color: '#065F46',
          }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: DD.success, boxShadow: '0 0 0 4px rgba(16,185,129,0.25)', animation: 'lf-pulse 2s infinite' }}></span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Все 9 цехов в работе</span>
            <span style={{ ...DD.num, fontSize: 11, color: '#047857', fontWeight: 600 }}>42 чел.</span>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: DD.pale, color: DD.brand,
            fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${DD.brand}`,
          }}>ВД</div>
        </div>
      </div>

      {/* period selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: DD.dim, marginRight: 4 }}>{DIcons.cal}</span>
        {periods.map((p, i) => (
          <button key={i} style={{
            padding: '8px 16px',
            background: i === 0 ? DD.brand : 'white',
            color: i === 0 ? 'white' : DD.ink2,
            border: i === 0 ? 'none' : `1px solid ${DD.border}`,
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{p}</button>
        ))}
        <div style={{ flex: 1 }}></div>
        <div style={{ ...DD.num, fontSize: 11, color: DD.dim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Обновлено: 15:55 · realtime
        </div>
      </div>
    </header>
  );
}

// --- KPI card ---
function KPI({ icon, label, value, unit, sub, subTone, color }) {
  const subColors = {
    up:    { c: DD.success, bg: '#D1FAE5' },
    down:  { c: DD.success, bg: '#D1FAE5' }, // "↓ норма" still positive
    plain: { c: DD.dim,     bg: 'transparent' },
    warn:  { c: DD.accent,  bg: '#FEF3C7' },
  };
  const st = subColors[subTone] || subColors.plain;
  return (
    <div style={{
      background: 'white', border: `1px solid ${DD.border}`, borderRadius: 12,
      padding: '18px 18px 16px 22px', position: 'relative', overflow: 'hidden',
      cursor: 'pointer',
    }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 5, background: color }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: `${color}15`,
          color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        <span style={{ color: DD.soft }}>{DIcons.arrow}</span>
      </div>
      <div style={{ ...DD.num, fontSize: 26, fontWeight: 800, color: DD.ink, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8, whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span>{value}</span>
        {unit && <span style={{ fontSize: 13, fontWeight: 600, color: DD.dim }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: DD.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: subTone === 'plain' ? 0 : '3px 9px',
        background: st.bg, borderRadius: 100, color: st.c,
        fontSize: 12, fontWeight: 700,
      }}>
        {subTone === 'up' && DIcons.up}
        {subTone === 'down' && DIcons.down}
        <span>{sub}</span>
      </div>
    </div>
  );
}

function KPIRow() {
  const kpis = [
    { icon: DIcons.pkg,    label: 'Выпуск пар',     value: '1\u202F248',   unit: 'пар', sub: '+12% к плану', subTone: 'up',    color: DD.success },
    { icon: DIcons.ruble,  label: 'Сумма выпуска',  value: '847\u202F600', unit: '₽',   sub: 'по опт. ценам',  subTone: 'plain', color: DD.brand },
    { icon: DIcons.layers, label: 'Партий в работе',value: '14',           unit: '',    sub: '7 готово · 7 в цехах', subTone: 'warn', color: DD.accent },
    { icon: DIcons.shield, label: 'Брак',           value: '0,9',          unit: '%',   sub: 'норма 1,5%',     subTone: 'down',  color: DD.success },
    { icon: DIcons.users,  label: 'ФОТ за день',    value: '68\u202F400',  unit: '₽',   sub: '42 работника',   subTone: 'plain', color: DD.brand },
    { icon: DIcons.flask,  label: 'Расход ЭВА',     value: '412',          unit: 'кг',  sub: 'по нормативу',   subTone: 'plain', color: DD.violet },
  ];
  return (
    <div className="dd-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 14 }}>
      {kpis.map((k, i) => <KPI key={i} {...k} />)}
    </div>
  );
}

// --- LINE CHART ---
function OutputChart() {
  // 30 days, simulated daily output around 1100-1300
  const data = [
    980, 1020, 1080, 950,  990,  1100, 1140,
    1050, 880,  1060, 1120, 1150, 1180, 1090,
    920,  1040, 1110, 1170, 1200, 1090, 1010,
    1080, 1140, 1190, 1210, 1160, 1080, 1140, 1220, 1248,
  ];
  const W = 600, H = 220, P = { t: 20, r: 20, b: 28, l: 40 };
  const innerW = W - P.l - P.r, innerH = H - P.t - P.b;
  const max = 1300, min = 800;
  const x = i => P.l + (i / (data.length - 1)) * innerW;
  const y = v => P.t + (1 - (v - min) / (max - min)) * innerH;

  // line path
  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${x(data.length - 1)} ${P.t + innerH} L ${x(0)} ${P.t + innerH} Z`;

  const yTicks = [800, 1000, 1200];
  const xLabels = ['13.04', '20.04', '27.04', '04.05', '12.05'];

  return (
    <div style={{ background: 'white', border: `1px solid ${DD.border}`, borderRadius: 14, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: DD.ink }}>Динамика выпуска</div>
          <div style={{ fontSize: 12, color: DD.dim, marginTop: 2 }}>Последние 30 дней · пары / день</div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
          <Metric label="Среднее" value="1 086" />
          <Metric label="Сегодня" value="1 248" highlight />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', marginTop: 12 }}>
        <defs>
          <linearGradient id="ddArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={DD.brand} stopOpacity="0.28"/>
            <stop offset="100%" stopColor={DD.brand} stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* gridlines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke={DD.border} strokeDasharray="2 4"/>
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill={DD.dim} fontFamily={DD.mono}>{t}</text>
          </g>
        ))}

        {/* x labels */}
        {xLabels.map((lbl, i) => {
          const ix = Math.round((i / (xLabels.length - 1)) * (data.length - 1));
          return <text key={i} x={x(ix)} y={H - 8} textAnchor="middle" fontSize="10" fill={DD.dim} fontFamily={DD.mono}>{lbl}</text>;
        })}

        {/* area */}
        <path d={areaPath} fill="url(#ddArea)"/>
        {/* line */}
        <path d={linePath} fill="none" stroke={DD.brand} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>

        {/* last point + tooltip */}
        <g>
          <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="10" fill={DD.brand} fillOpacity="0.18"/>
          <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="5" fill="white" stroke={DD.brand} strokeWidth="2.5"/>

          {/* tooltip box */}
          <g transform={`translate(${x(data.length - 1) - 90}, ${y(data[data.length - 1]) - 50})`}>
            <rect width="78" height="36" rx="8" fill={DD.ink} />
            <text x="10" y="14" fontSize="9" fill={DD.soft} fontFamily="'Inter', sans-serif" fontWeight="600" letterSpacing="0.08em">12.05 · СЕГ.</text>
            <text x="10" y="29" fontSize="14" fill="white" fontFamily={DD.mono} fontWeight="700">1 248 пар</text>
            {/* arrow */}
            <polygon points="78,18 84,22 78,26" fill={DD.ink}/>
          </g>
        </g>
      </svg>
    </div>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ ...DD.num, fontSize: 10, color: DD.dim, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ ...DD.num, fontSize: 20, fontWeight: 800, color: highlight ? DD.brand : DD.ink, letterSpacing: '-0.01em', marginTop: 2 }}>{value}</div>
    </div>
  );
}

// --- WORKSHOP LOAD ---
function WorkshopLoad() {
  const ws = [
    { name: 'Литейка',     color: '#EF4444', pct: 92, batches: 6 },
    { name: 'Упаковка',    color: '#214A8C', pct: 78, batches: 8 },
    { name: 'Клеевой',     color: '#F59E0B', pct: 85, batches: 4 },
    { name: 'Обшив',       color: '#8B5CF6', pct: 64, batches: 3 },
    { name: 'Маркировка',  color: '#06B6D4', pct: 71, batches: 5 },
    { name: 'Крой',        color: '#EC4899', pct: 48, batches: 2 },
    { name: 'Швейный',     color: '#10B981', pct: 56, batches: 3 },
    { name: 'Контроль ОТК',color: '#6366F1', pct: 38, batches: 2 },
    { name: 'Склад готовой',color:'#64748B', pct: 22, batches: 1 },
  ];

  return (
    <div style={{ background: 'white', border: `1px solid ${DD.border}`, borderRadius: 14, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: DD.ink }}>Загрузка цехов</div>
          <div style={{ fontSize: 12, color: DD.dim, marginTop: 2 }}>Сегодня · % от пропускной способности</div>
        </div>
        <Metric label="Средняя" value="62%" highlight />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {ws.map((w, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '170px 1fr 100px', gap: 14, alignItems: 'center', cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: w.color, flexShrink: 0 }}></span>
              <span style={{ fontSize: 13, fontWeight: 600, color: DD.ink }}>{w.name}</span>
            </div>
            <div style={{ position: 'relative', height: 18, background: DD.mist, borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: `${w.pct}%`,
                background: `linear-gradient(90deg, ${w.color}cc, ${w.color})`,
                borderRadius: 6,
              }}></div>
              {/* 80% marker */}
              <div style={{
                position: 'absolute', top: -2, bottom: -2, left: '80%', width: 1,
                background: DD.dim, opacity: 0.4,
              }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ ...DD.num, fontSize: 14, fontWeight: 700, color: w.pct >= 80 ? w.color : DD.ink }}>{w.pct}%</span>
              <span style={{ ...DD.num, fontSize: 11, color: DD.dim }}>{w.batches} парт.</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...DD.num, fontSize: 10, color: DD.dim, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${DD.border}`, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Вертикальная линия = целевая загрузка 80%
      </div>
    </div>
  );
}

// --- TOP ARTICLES ---
function TopArticles() {
  const items = [
    { rank: 1, code: '905',   name: 'Галоши ЭВА мужские',         pairs: 288, pct: 100 },
    { rank: 2, code: '907',   name: 'Галоши ЭВА мужские',         pairs: 216, pct: 75 },
    { rank: 3, code: '112/н', name: 'Сапоги ЭВА мужские',         pairs: 144, pct: 50 },
    { rank: 4, code: '022',   name: 'Сабо ЭВА мужские',           pairs: 120, pct: 42 },
    { rank: 5, code: '184/м', name: 'Сапоги ЭВА мужские (манжет)',pairs: 96,  pct: 33 },
  ];
  return (
    <div style={{ background: 'white', border: `1px solid ${DD.border}`, borderRadius: 14, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: DD.ink }}>Топ артикулов</div>
          <div style={{ fontSize: 12, color: DD.dim, marginTop: 2 }}>Сегодня · по количеству пар</div>
        </div>
        <button style={{ background: 'none', border: 'none', color: DD.brand, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Все →</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 88px', gap: 12, alignItems: 'center', cursor: 'pointer',
          }}>
            <span style={{
              ...DD.num, fontSize: 13, fontWeight: 800, color: i === 0 ? DD.brand : DD.soft,
              padding: '6px 0', textAlign: 'center',
              background: i === 0 ? DD.pale : DD.mist, borderRadius: 8,
            }}>#{it.rank}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ ...DD.num, fontSize: 14, fontWeight: 700, color: DD.brand }}>{it.code}</span>
                <span style={{ fontSize: 12, color: DD.dim }}>{it.name}</span>
              </div>
              <div style={{ height: 6, background: DD.mist, borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${it.pct}%`, background: DD.brand, borderRadius: 100 }}></div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ ...DD.num, fontSize: 16, fontWeight: 800, color: DD.ink }}>{it.pairs}</span>
              <span style={{ ...DD.num, fontSize: 11, color: DD.dim, marginLeft: 4 }}>пар</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- ALERT BLOCK ---
function AlertBlock() {
  return (
    <div style={{
      background: 'white', border: `1px solid ${DD.border}`, borderRadius: 14,
      padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 5, background: DD.danger }}></div>
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: '#FEE2E2', color: DD.danger,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 6,
        animation: 'lf-pulse 2s infinite',
      }}>{DIcons.alert}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ ...DD.num, fontSize: 10, fontWeight: 700, color: DD.danger, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 8px', background: '#FEE2E2', borderRadius: 4 }}>
            Требует внимания
          </span>
          <span style={{ ...DD.num, fontSize: 11, color: DD.dim }}>1 партия</span>
        </div>
        <div style={{ fontSize: 15, color: DD.ink, fontWeight: 500 }}>
          Партия <span style={{ ...DD.num, fontWeight: 700, color: DD.brand }}>УПК-110526-03</span>
          <span style={{ color: DD.dim }}> · 220/н Полусапожки, 80 пар · </span>
          <span style={{ color: DD.danger, fontWeight: 700 }}>застряла в клеевом цехе &gt; 24 часов</span>
        </div>
      </div>
      <button style={{
        padding: '11px 18px', background: DD.danger, color: 'white', border: 'none',
        borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        boxShadow: '0 4px 12px rgba(239,68,68,0.28)', flexShrink: 0,
      }}>
        Открыть карточку {DIcons.arrow}
      </button>
    </div>
  );
}

// --- Main ---
function DirectorDashboard() {
  return (
    <div style={{ minHeight: '100%', background: DD.mist, fontFamily: "'Inter', system-ui, sans-serif", color: DD.ink }}>
      <DDHeader />
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '20px 24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AlertBlock />
        <KPIRow />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)', gap: 16 }}>
          <OutputChart />
          <WorkshopLoad />
        </div>
        <TopArticles />
      </main>
    </div>
  );
}

window.DirectorDashboard = DirectorDashboard;
