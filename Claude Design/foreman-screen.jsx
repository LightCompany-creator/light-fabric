// LightFlow — Foreman main screen (Литейка)
const { useState: useStateFM } = React;

const fmIcon = (paths, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

const FmIcons = {
  logout: fmIcon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>),
  edit: fmIcon(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>, 16),
  trash: fmIcon(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></>, 16),
  box:    fmIcon(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>, 22),
  scale:  fmIcon(<><path d="M12 3v18"/><path d="M5 8h14l-2 8a3 3 0 0 1-3 2h-4a3 3 0 0 1-3-2L5 8z"/><path d="M8 8a4 4 0 0 1 8 0"/></>, 22),
  money:  fmIcon(<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/></>, 22),
  plus:   fmIcon(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, 22),
  clock:  fmIcon(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, 14),
  alert:  fmIcon(<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, 16),
  layers: fmIcon(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>, 16),
  inbox:  fmIcon(<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>, 16),
  archive:fmIcon(<><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>, 16),
  book:   fmIcon(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>, 16),
};

const C = {
  brand: '#214A8C', brandDark: '#163566', brandLight: '#3D6FB8', brandPale: '#E8EFF8', mist: '#F4F7FC',
  accent: '#F59E0B', success: '#10B981', danger: '#EF4444',
  ink: '#0F1B2D', ink2: '#344563', dim: '#6B7C93', soft: '#9AABBF',
  border: '#D9E2EE', wsMold: '#EF4444',
  mono: "'JetBrains Mono', monospace",
  num: { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' },
};

// --- HEADER ---
function FMHeader() {
  return (
    <header style={{
      background: 'white', borderBottom: `1px solid ${C.border}`,
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: '14px 24px', gap: '24px',
      }}>
        {/* left: logo + workshop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: C.ink }}>Light</span>
            <span style={{ color: C.brand }}>Flow</span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '7px 14px', background: '#FEE2E2', border: `1px solid #FCA5A5`,
            borderRadius: 100,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.wsMold, boxShadow: `0 0 0 4px rgba(239,68,68,0.18)` }}></span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#991B1B' }}>Литейка</span>
            <span style={{ fontFamily: C.mono, fontSize: 10, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>02</span>
          </div>
        </div>

        {/* center: date */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>вторник, 12 мая 2026</div>
          <div style={{ ...C.num, fontSize: 11, color: C.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
            Смена день · 12:12
          </div>
        </div>

        {/* right: user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Иванов А.С.</div>
            <div style={{ fontSize: 11, color: C.dim }}>Бригадир · таб. 000123</div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: C.brandPale, color: C.brand,
            fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${C.brand}`,
          }}>ИА</div>
          <button style={{
            width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`,
            background: 'white', color: C.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>{FmIcons.logout}</button>
        </div>
      </div>

      {/* nav */}
      <nav style={{ display: 'flex', gap: 4, padding: '0 24px', borderTop: `1px solid ${C.border}` }}>
        {[
          { icon: FmIcons.layers, label: 'Моя смена', active: true },
          { icon: FmIcons.inbox, label: 'Входящие', badge: 4 },
          { icon: FmIcons.archive, label: 'Архив' },
          { icon: FmIcons.book, label: 'Справочники' },
        ].map((tab, i) => (
          <button key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 18px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: tab.active ? `2px solid ${C.brand}` : '2px solid transparent',
            color: tab.active ? C.brand : C.ink2,
            fontSize: 14, fontWeight: tab.active ? 700 : 500,
          }}>
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && <span style={{
              padding: '2px 7px', background: C.accent, color: 'white',
              borderRadius: 100, fontSize: 11, fontWeight: 700, fontFamily: C.mono,
            }}>{tab.badge}</span>}
          </button>
        ))}
      </nav>
    </header>
  );
}

// --- SHIFT CARD HEADER ---
function FMShiftHead() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '24px 28px', borderBottom: `1px solid ${C.border}`, gap: 24, flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.01em', marginBottom: 6 }}>
          Смена · сегодня, 12 мая 2026 · <span style={{ color: C.brand }}>день</span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', background: '#D1FAE5', border: `1px solid #A7F3D0`,
          borderRadius: 100, color: '#065F46', fontSize: 13, fontWeight: 600,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.success, animation: 'lf-pulse 2s infinite' }}></span>
          Открыта в 08:00, идёт 4ч 12мин
        </div>
      </div>

      <button style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '14px 24px', background: C.accent, color: 'white', border: 'none',
        borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
      }}>
        {fmIcon(<><path d="M5 13l4 4L19 7"/></>, 18)}
        Закрыть смену
      </button>
    </div>
  );
}

// --- OUTPUT TABLE ---
function FMOutputTable() {
  const rows = [
    { code: '112/н', name: 'Сапоги ЭВА',  sizes: '42-46', pairs: 96,  weight: 68, defect: 2, machine: 'ИЛМ-3', down: '15 мин', pay: '1 440' },
    { code: '905',   name: 'Галоши ЭВА',  sizes: '40-45', pairs: 144, weight: 42, defect: 0, machine: 'ИЛМ-1', down: '—',      pay: '576' },
    { code: '022',   name: 'Сабо ЭВА',    sizes: '41-46', pairs: 72,  weight: 18, defect: 1, machine: 'ИЛМ-2', down: '30 мин', pay: '288' },
  ];

  const th = {
    textAlign: 'left', padding: '12px 16px', background: C.mist, color: C.brand,
    fontSize: 11, fontWeight: 700, fontFamily: C.mono, letterSpacing: '0.08em', textTransform: 'uppercase',
    borderBottom: `1px solid ${C.border}`,
  };
  const td = { padding: '16px', borderBottom: `1px solid ${C.border}`, fontSize: 15, color: C.ink, verticalAlign: 'middle' };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
        <thead>
          <tr>
            <th style={th}>Артикул</th>
            <th style={th}>Размеры</th>
            <th style={{ ...th, textAlign: 'right' }}>Пар</th>
            <th style={{ ...th, textAlign: 'right' }}>Вес кг</th>
            <th style={{ ...th, textAlign: 'right' }}>Брак</th>
            <th style={th}>Машина</th>
            <th style={th}>Простой</th>
            <th style={{ ...th, textAlign: 'right' }}>ЗП ₽</th>
            <th style={{ ...th, textAlign: 'right' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 ? C.mist : 'white' }}>
              <td style={td}>
                <div style={{ ...C.num, color: C.brand, fontWeight: 700, fontSize: 16 }}>{r.code}</div>
                <div style={{ fontSize: 13, color: C.dim, marginTop: 2 }}>{r.name}</div>
              </td>
              <td style={{ ...td, ...C.num, color: C.ink2 }}>{r.sizes}</td>
              <td style={{ ...td, ...C.num, textAlign: 'right', fontWeight: 700 }}>{r.pairs}</td>
              <td style={{ ...td, ...C.num, textAlign: 'right' }}>{r.weight}</td>
              <td style={{ ...td, textAlign: 'right' }}>
                {r.defect === 0 ? (
                  <span style={{ ...C.num, color: C.dim }}>0</span>
                ) : (
                  <span style={{
                    ...C.num, display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', background: '#FEE2E2', color: '#B91C1C',
                    borderRadius: 100, fontWeight: 700, fontSize: 13,
                  }}>{FmIcons.alert} {r.defect}</span>
                )}
              </td>
              <td style={{ ...td, ...C.num, color: C.ink2 }}>{r.machine}</td>
              <td style={{ ...td }}>
                {r.down === '—'
                  ? <span style={{ ...C.num, color: C.dim }}>—</span>
                  : <span style={{ ...C.num, display: 'inline-flex', alignItems: 'center', gap: 4, color: C.accent, fontWeight: 600 }}>{FmIcons.clock}{r.down}</span>
                }
              </td>
              <td style={{ ...td, ...C.num, textAlign: 'right', fontWeight: 700, color: C.brand }}>{r.pay} ₽</td>
              <td style={{ ...td, textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: 6 }}>
                  <button style={iconBtn}>{FmIcons.edit}</button>
                  <button style={{ ...iconBtn, color: C.danger }}>{FmIcons.trash}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const iconBtn = {
  width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`,
  background: 'white', color: C.ink2, display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

// --- TOTALS ROW ---
function FMTotals() {
  const items = [
    { icon: FmIcons.box,   label: 'Всего пар',  value: '312',     unit: '',  tone: 'plain' },
    { icon: FmIcons.scale, label: 'Общий вес',  value: '128',     unit: 'кг', tone: 'plain' },
    { icon: FmIcons.money, label: 'ЗП по смене',value: '2 304',   unit: '₽', tone: 'brand' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '20px 28px 28px' }}>
      {items.map((it, i) => {
        const isBrand = it.tone === 'brand';
        return (
          <div key={i} style={{
            background: isBrand ? C.brand : 'white',
            border: isBrand ? 'none' : `1px solid ${C.border}`,
            color: isBrand ? 'white' : C.ink,
            borderRadius: 12, padding: '18px 22px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10,
              background: isBrand ? 'rgba(255,255,255,0.15)' : C.brandPale,
              color: isBrand ? 'white' : C.brand,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{it.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, opacity: isBrand ? 0.8 : 1, color: isBrand ? 'white' : C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {it.label}
              </div>
              <div style={{ ...C.num, fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {it.value} <span style={{ fontSize: 16, fontWeight: 600, opacity: 0.7 }}>{it.unit}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- SIDEBAR ---
function FMSidebar() {
  const workers = [
    { name: 'Иванов А.С.',  role: 'Литьё',     out: '112/н × 96',  pay: '1 440' },
    { name: 'Петров В.И.',  role: 'Литьё',     out: '905 × 144',   pay: '576' },
    { name: 'Сидоров К.А.', role: 'Наладка',   out: '2 машины',    pay: '2 200' },
    { name: 'Кузнецов М.П.',role: 'Литьё',     out: '022 × 72',    pay: '288' },
  ];
  const materials = [
    { name: 'ЭВА гранулы',     used: 124.8, unit: 'кг', stock: 4875, pct: 88 },
    { name: 'Краситель чёрный', used: 0.8,  unit: 'кг', stock: 18,   pct: 64 },
    { name: 'Краситель синий',  used: 0.4,  unit: 'кг', stock: 12,   pct: 45 },
  ];

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Workers */}
      <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Работники в смене</div>
          <div style={{ ...C.num, fontSize: 11, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>4 чел.</div>
        </div>
        {workers.map((w, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12,
            padding: '12px 18px', alignItems: 'center',
            borderBottom: i < workers.length - 1 ? `1px solid ${C.border}` : 'none',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: C.brandPale, color: C.brand,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>{w.name.split(' ').map(s => s[0]).slice(0,2).join('')}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{w.name}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{w.role} · {w.out}</div>
            </div>
            <div style={{ ...C.num, fontSize: 14, fontWeight: 700, color: C.brand }}>{w.pay} ₽</div>
          </div>
        ))}
      </div>

      {/* Materials */}
      <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Расход ЭВА · по нормативу</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Списание при закрытии смены</div>
        </div>
        {materials.map((m, i) => (
          <div key={i} style={{
            padding: '12px 18px',
            borderBottom: i < materials.length - 1 ? `1px solid ${C.border}` : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{m.name}</div>
              <div style={{ ...C.num, fontSize: 13, fontWeight: 700, color: C.ink }}>
                {m.used} <span style={{ color: C.dim, fontWeight: 500 }}>{m.unit}</span>
              </div>
            </div>
            <div style={{ height: 6, background: C.mist, borderRadius: 100, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${m.pct}%`, background: m.pct < 50 ? C.accent : C.brand, borderRadius: 100 }}></div>
            </div>
            <div style={{ ...C.num, fontSize: 10, color: C.dim, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              остаток на складе: {m.stock} {m.unit}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// --- MAIN ---
function FMScreen() {
  return (
    <div style={{ minHeight: '100%', background: C.mist, fontFamily: "'Inter', system-ui, sans-serif", color: C.ink }}>
      <FMHeader />

      <main style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 20, alignItems: 'start' }}>
        <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <FMShiftHead />
          <FMOutputTable />

          <div style={{ padding: '16px 28px' }}>
            <button style={{
              width: '100%', padding: '18px 24px', background: C.brand, color: 'white',
              border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(33,74,140,0.2)',
            }}>
              {FmIcons.plus}
              Добавить выработку
            </button>
          </div>

          <FMTotals />
        </div>

        <FMSidebar />
      </main>
    </div>
  );
}

window.FMScreen = FMScreen;
