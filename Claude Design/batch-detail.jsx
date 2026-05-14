// LightFlow — Batch detail screen

const bdIcon = (paths, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);

const BD = {
  brand: '#214A8C', brandDark: '#163566', pale: '#E8EFF8', mist: '#F4F7FC',
  accent: '#F59E0B', success: '#10B981', danger: '#EF4444',
  ink: '#0F1B2D', ink2: '#344563', dim: '#6B7C93', soft: '#9AABBF',
  border: '#D9E2EE',
  mold: '#EF4444', pack: '#214A8C', glue: '#F59E0B',
  sew: '#8B5CF6', mark: '#06B6D4', store: '#10B981',
  mono: "'JetBrains Mono', monospace",
  num: { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' },
};

const BDIcons = {
  chev:   bdIcon(<polyline points="9 18 15 12 9 6"/>, 14),
  home:   bdIcon(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>, 14),
  print:  bdIcon(<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 0 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>, 16),
  copy:   bdIcon(<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>, 16),
  check:  bdIcon(<polyline points="20 6 9 17 4 12"/>, 14),
  pkg:    bdIcon(<><path d="M16.5 9.4L7.5 4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>, 56),
  clock:  bdIcon(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, 14),
  arrow:  bdIcon(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>, 14),
  logout: bdIcon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>),
  trend:  bdIcon(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>, 16),
};

// --- Mini header (compact, no nav) ---
function BDHeader() {
  return (
    <header style={{ background: 'white', borderBottom: `1px solid ${BD.border}`, padding: '12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: BD.ink }}>Light</span><span style={{ color: BD.brand }}>Flow</span>
          </div>
          <div style={{ height: 24, width: 1, background: BD.border }}></div>
          {/* breadcrumbs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <a style={{ color: BD.dim, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{BDIcons.home} Главная</a>
            <span style={{ color: BD.soft }}>{BDIcons.chev}</span>
            <a style={{ color: BD.dim, textDecoration: 'none' }}>Партии</a>
            <span style={{ color: BD.soft }}>{BDIcons.chev}</span>
            <span style={{ ...BD.num, color: BD.ink, fontWeight: 600 }}>ЛИТ-120526-01</span>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: BD.ink }}>Смирнова О.В.</div>
            <div style={{ fontSize: 11, color: BD.dim }}>Бригадир упаковки</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: BD.pale, color: BD.brand,
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${BD.brand}`,
          }}>СО</div>
        </div>
      </div>
    </header>
  );
}

// --- Title row ---
function TitleRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...BD.num, color: BD.dim, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            Партия
          </div>
          <h1 style={{ ...BD.num, margin: 0, fontSize: 40, fontWeight: 800, color: BD.ink, letterSpacing: '0.01em', lineHeight: 1 }}>
            ЛИТ-120526-01
          </h1>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', background: '#FEF3C7', border: `1px solid #FCD34D`,
          borderRadius: 100, color: '#92400E',
        }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: BD.accent, animation: 'lf-pulse 2s infinite' }}></span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>В работе</span>
          <span style={{ width: 1, height: 16, background: '#FCD34D' }}></span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Клеевой цех</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={btnSecondary}>{BDIcons.print} Печать ярлыка</button>
        <button style={btnSecondary}>{BDIcons.copy} Скопировать данные</button>
      </div>
    </div>
  );
}
const btnSecondary = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '11px 18px', background: 'white', color: BD.ink2,
  border: `1px solid ${BD.border}`, borderRadius: 10,
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

// --- Article info card ---
function ArticleCard() {
  return (
    <div style={{
      background: 'white', border: `1px solid ${BD.border}`, borderRadius: 14,
      padding: 24, display: 'flex', gap: 24, alignItems: 'stretch',
    }}>
      <div style={{
        width: 120, height: 120, flexShrink: 0,
        background: `linear-gradient(135deg, ${BD.pale}, ${BD.mist})`,
        border: `1px dashed ${BD.brand}55`, borderRadius: 12,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: BD.brand, gap: 4,
      }}>
        {BDIcons.pkg}
        <div style={{ ...BD.num, fontSize: 9, fontWeight: 700, color: BD.brand, letterSpacing: '0.1em' }}>ФОТО</div>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px', alignContent: 'center' }}>
        <Field label="Код артикула" mono><span style={{ fontSize: 22, fontWeight: 800, color: BD.brand }}>112/н</span></Field>
        <Field label="Название">Сапоги ЭВА мужские, утеплённые</Field>
        <Field label="Материал">
          <span style={{
            display: 'inline-flex', padding: '4px 10px', background: '#D1FAE5',
            color: '#065F46', borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
          }}>ЭВА</span>
        </Field>
        <Field label="Размерный ряд" mono>42 – 46</Field>
        <Field label="Количество" mono>
          <span style={{ fontSize: 18, fontWeight: 700 }}>96</span>
          <span style={{ fontSize: 13, color: BD.dim, fontWeight: 500, marginLeft: 6 }}>пар · 12 коробок × 8</span>
        </Field>
        <Field label="Вес" mono>
          <span style={{ fontSize: 18, fontWeight: 700 }}>68</span>
          <span style={{ fontSize: 13, color: BD.dim, fontWeight: 500, marginLeft: 6 }}>кг</span>
        </Field>
      </div>
    </div>
  );
}
function Field({ label, mono, children }) {
  return (
    <div>
      <div style={{ ...BD.num, color: BD.dim, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ ...(mono ? BD.num : {}), fontSize: 15, color: BD.ink, fontWeight: 500 }}>
        {children}
      </div>
    </div>
  );
}

// --- ROUTE TIMELINE ---
function RouteTimeline() {
  const steps = [
    { label: 'Литьё',      color: BD.mold,  status: 'done',    time: '12.05 · 09:00', dur: '5ч 30м' },
    { label: 'Упаковка',   color: BD.pack,  status: 'done',    time: '12.05 · 14:30', dur: '15 мин' },
    { label: 'Клеевой',    color: BD.glue,  status: 'current', time: '12.05 · 15:10', dur: 'идёт 45м' },
    { label: 'Обшив',      color: BD.sew,   status: 'pending', time: '~ 16:00',        dur: '40 мин' },
    { label: 'Маркировка', color: BD.mark,  status: 'pending', time: '~ 16:40',        dur: '20 мин' },
    { label: 'Склад',      color: BD.store, status: 'pending', time: '~ 17:00',        dur: '—' },
  ];

  return (
    <div style={{
      background: 'white', border: `1px solid ${BD.border}`, borderRadius: 14,
      padding: '28px 32px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: BD.ink }}>Маршрут партии</div>
          <div style={{ fontSize: 13, color: BD.dim, marginTop: 2 }}>6 операций · пройдено 2 из 6</div>
        </div>
        <div style={{ ...BD.num, fontSize: 12, color: BD.dim }}>
          Старт: <span style={{ color: BD.ink, fontWeight: 600 }}>12.05 · 09:00</span>
          <span style={{ margin: '0 12px', color: BD.soft }}>/</span>
          Прогноз: <span style={{ color: BD.brand, fontWeight: 700 }}>12.05 · 17:00</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, position: 'relative' }}>
        {steps.map((s, i) => {
          const done = s.status === 'done';
          const current = s.status === 'current';
          const pending = s.status === 'pending';
          const prev = steps[i - 1];
          const lineFilled = done || current;
          const lineColor = done ? s.color : (current ? prev?.color : BD.border);

          return (
            <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 8px' }}>
              {/* connector line to previous */}
              {i > 0 && (
                <div style={{
                  position: 'absolute', top: 22, right: '50%', width: '100%', height: 4,
                  background: lineFilled ? lineColor : 'transparent',
                  borderTop: !lineFilled ? `3px dashed ${BD.border}` : 'none',
                  zIndex: 0,
                }}></div>
              )}

              {/* circle */}
              <div style={{
                position: 'relative', zIndex: 1,
                width: 48, height: 48, borderRadius: '50%',
                background: done ? s.color : (current ? 'white' : BD.mist),
                border: current ? `3px solid ${s.color}` : (pending ? `2px solid ${BD.border}` : 'none'),
                color: done ? 'white' : (current ? s.color : BD.soft),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, fontFamily: BD.mono,
                boxShadow: current ? `0 0 0 6px ${s.color}22` : 'none',
                animation: current ? 'lf-ring 2s infinite' : 'none',
              }}>
                {done ? BDIcons.check : (i + 1)}
              </div>

              {/* label */}
              <div style={{
                marginTop: 12, fontSize: 14,
                fontWeight: current ? 800 : (done ? 700 : 500),
                color: current ? s.color : (done ? BD.ink : BD.dim),
              }}>
                {s.label}
              </div>
              <div style={{ ...BD.num, fontSize: 11, color: BD.dim, marginTop: 2 }}>{s.time}</div>
              <div style={{
                ...BD.num, fontSize: 10, color: current ? s.color : BD.soft,
                fontWeight: current ? 700 : 500, marginTop: 2,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{s.dur}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- HISTORY TABLE ---
function HistoryTable() {
  const rows = [
    { time: '12.05 · 09:00', ws: 'Литейка',  wsTone: 'mold', action: 'Создана',    qty: '96 / —',  defect: '—', who: 'Иванов А.С.',   note: 'ИЛМ-3 · литьё' },
    { time: '12.05 · 14:30', ws: 'Упаковка', wsTone: 'pack', action: 'Принята',    qty: '96 / 96', defect: '0', who: 'Смирнова О.В.', note: '—' },
    { time: '12.05 · 14:45', ws: 'Упаковка', wsTone: 'pack', action: 'Передана',   qty: '— / 96',  defect: '—', who: 'Смирнова О.В.', note: '→ Клеевой' },
    { time: '12.05 · 15:10', ws: 'Клеевой',  wsTone: 'glue', action: 'Принята',    qty: '96 / 96', defect: '0', who: 'Сидоров К.А.',  note: 'в работе', current: true },
  ];
  const tones = {
    mold: { bg: '#FEE2E2', c: '#991B1B', dot: BD.mold },
    pack: { bg: BD.pale,   c: BD.brandDark, dot: BD.pack },
    glue: { bg: '#FEF3C7', c: '#92400E', dot: BD.glue },
  };
  const th = {
    textAlign: 'left', padding: '14px 16px', background: BD.mist, color: BD.brand,
    fontSize: 11, fontWeight: 700, fontFamily: BD.mono, letterSpacing: '0.08em', textTransform: 'uppercase',
    borderBottom: `1px solid ${BD.border}`,
  };
  const td = { padding: '14px 16px', borderBottom: `1px solid ${BD.border}`, fontSize: 14, color: BD.ink };

  return (
    <div style={{ background: 'white', border: `1px solid ${BD.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${BD.border}` }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: BD.ink }}>История движения</div>
          <div style={{ fontSize: 13, color: BD.dim, marginTop: 2 }}>4 события · обновлено 15:55</div>
        </div>
        <div style={{ ...BD.num, fontSize: 11, color: BD.dim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Realtime
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              <th style={th}>Время</th>
              <th style={th}>Цех</th>
              <th style={th}>Действие</th>
              <th style={{ ...th, textAlign: 'right' }}>Принято / Передано</th>
              <th style={{ ...th, textAlign: 'right' }}>Брак</th>
              <th style={th}>Кто</th>
              <th style={th}>Заметки</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const t = tones[r.wsTone];
              return (
                <tr key={i} style={{
                  background: r.current ? '#FEF3C7' : (i % 2 ? BD.mist : 'white'),
                  borderLeft: r.current ? `4px solid ${BD.accent}` : '4px solid transparent',
                }}>
                  <td style={{ ...td, ...BD.num, color: BD.ink2 }}>{r.time}</td>
                  <td style={td}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '3px 10px', background: t.bg, color: t.c,
                      borderRadius: 100, fontSize: 12, fontWeight: 700,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot }}></span>
                      {r.ws}
                    </span>
                  </td>
                  <td style={{ ...td, fontWeight: r.current ? 700 : 500 }}>
                    {r.current && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: BD.accent, marginRight: 8, animation: 'lf-pulse 1.5s infinite' }}></span>}
                    {r.action}
                  </td>
                  <td style={{ ...td, ...BD.num, textAlign: 'right', fontWeight: 600 }}>{r.qty}</td>
                  <td style={{ ...td, ...BD.num, textAlign: 'right', color: r.defect === '0' ? BD.dim : BD.ink }}>{r.defect}</td>
                  <td style={td}>{r.who}</td>
                  <td style={{ ...td, color: BD.dim, fontSize: 13 }}>{r.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Financial summary ---
function FinSummary() {
  return (
    <div style={{
      background: 'white', border: `1px solid ${BD.border}`, borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${BD.border}` }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: BD.ink }}>Финансы и прогноз</div>
        <div style={{ fontSize: 12, color: BD.dim, marginTop: 2 }}>Расчёт по операциям маршрута</div>
      </div>

      {/* Items */}
      <div style={{ padding: '6px 22px' }}>
        <FinRow label="Себестоимость" sub="по операциям" value="42 ₽" valueSub="/ пара" muted />
        <FinRow label="Розничная цена" sub="закупка от 5 пар" value="828 ₽" valueSub="/ пара" muted />
        <div style={{ height: 1, background: BD.border, margin: '4px 0' }}></div>
        <FinRow label="Сумма партии" sub="96 пар × 828 ₽" value="79 488 ₽" big highlight />
      </div>

      {/* Forecast */}
      <div style={{
        margin: '8px 22px 22px', padding: '14px 16px',
        background: '#FEF3C7', border: `1px solid #FCD34D`, borderRadius: 12,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <div style={{ color: '#92400E', flexShrink: 0, marginTop: 1 }}>{BDIcons.clock}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Прогноз готовности
          </div>
          <div style={{ ...BD.num, fontSize: 22, fontWeight: 800, color: '#78350F', letterSpacing: '-0.01em' }}>
            ~ 17:00
          </div>
          <div style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>
            расчёт по средней скорости клеевого цеха · 1ч 50м
          </div>
        </div>
      </div>

      {/* Speed indicator */}
      <div style={{ padding: '0 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: BD.success, fontSize: 12, fontWeight: 600 }}>
          {BDIcons.trend}
          <span>Идёт на 12 минут быстрее среднего</span>
        </div>
      </div>
    </div>
  );
}

function FinRow({ label, sub, value, valueSub, big, highlight, muted }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: muted ? BD.ink2 : BD.ink }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: BD.dim, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          ...BD.num,
          fontSize: big ? 22 : 15,
          fontWeight: big ? 800 : 700,
          color: highlight ? BD.brand : (muted ? BD.ink2 : BD.ink),
          letterSpacing: big ? '-0.01em' : 0,
        }}>{value}</span>
        {valueSub && <span style={{ ...BD.num, fontSize: 11, color: BD.dim, marginLeft: 4 }}>{valueSub}</span>}
      </div>
    </div>
  );
}

// --- Main ---
function BatchDetailScreen() {
  return (
    <div style={{ minHeight: '100%', background: BD.mist, fontFamily: "'Inter', system-ui, sans-serif", color: BD.ink }}>
      <BDHeader />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 40px' }}>
        <TitleRow />

        {/* Layout: main column + side column */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ArticleCard />
            <RouteTimeline />
            <HistoryTable />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FinSummary />
          </div>
        </div>
      </main>
    </div>
  );
}

window.BatchDetailScreen = BatchDetailScreen;
