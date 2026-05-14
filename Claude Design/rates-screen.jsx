// LightFlow — Rates (Расценки сдельной оплаты · технолог)

const RT = {
  brand: '#214A8C', brandDark: '#163566', pale: '#E8EFF8', mist: '#F4F7FC',
  amber: '#F59E0B', amberBg: '#FEF3C7', amberDark: '#92400E',
  success: '#10B981', successDark: '#065F46', successBg: '#D1FAE5',
  danger: '#EF4444', dangerBg: '#FEE2E2',
  ink: '#0F1B2D', ink2: '#344563', dim: '#6B7C93', soft: '#9AABBF',
  border: '#D9E2EE', borderSoft: '#E6ECF4',
  mono: "'JetBrains Mono', monospace",
  num: { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' },
};

const RI = (p, s = 18) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>
);
const RTIcons = {
  chevD: RI(<polyline points="6 9 12 15 18 9"/>, 16),
  chevR: RI(<polyline points="9 18 15 12 9 6"/>, 16),
  plus:  RI(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, 16),
  edit:  RI(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>, 13),
  hist:  RI(<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></>, 13),
  off:   RI(<><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>, 13),
  check: RI(<polyline points="20 6 9 17 4 12"/>, 12),
  info:  RI(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>, 16),
  bulb:  RI(<><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></>, 16),
  calc:  RI(<><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="12" y1="10" x2="14" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="12" y1="14" x2="14" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="12" y1="18" x2="14" y2="18"/></>, 16),
  search:RI(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>, 14),
  ruble: RI(<><path d="M6 4h7a4 4 0 0 1 0 8H6"/><line x1="3" y1="12" x2="13" y2="12"/><line x1="6" y1="4" x2="6" y2="20"/><line x1="3" y1="16" x2="11" y2="16"/></>, 14),
  flame: RI(<path d="M12 2c1 5 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4-1 3 2 4 2 4s-2-3 1-7c1-1.5 0-4 0-4z"/>, 16),
  box:   RI(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></>, 16),
  tag:   RI(<><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>, 16),
  drop:  RI(<path d="M12 2.5C7 10 5 12 5 15.5a7 7 0 0 0 14 0c0-3.5-2-5.5-7-13z"/>, 16),
  scis:  RI(<><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></>, 16),
  needle:RI(<><path d="M3 21l4-4"/><path d="M21 3 7 17"/><circle cx="6" cy="18" r="2"/></>, 16),
  thread:RI(<><path d="M4 4c8 0 8 16 16 16"/><circle cx="20" cy="20" r="1.5"/></>, 16),
  shield:RI(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>, 16),
  wh:    RI(<><path d="M3 21V9l9-5 9 5v12"/><rect x="9" y="13" width="6" height="8"/></>, 16),
  arrow: RI(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>, 12),
  layers:RI(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>, 16),
  user:  RI(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>, 16),
};

const RT_WORKSHOPS = [
  {
    id: 'mold', name: 'Литейка', hue: '#EF4444', icon: 'flame',
    rates: [
      { sku: '022',     name: 'Сабо',    op: 'Литьё',  rate: 4,    unit: 'пара', from: '01.01.2026' },
      { sku: '905',     name: 'Галоши',  op: 'Литьё',  rate: 4,    unit: 'пара', from: '01.01.2026' },
      { sku: '112/н',   name: 'Сапоги',  op: 'Литьё',  rate: 15,   unit: 'пара', from: '01.01.2026' },
      { sku: '113/м',   name: 'Манжет',  op: 'Литьё',  rate: 20,   unit: 'пара', from: '01.01.2026' },
      { sku: 'АВ-300н', name: 'Аляска',  op: 'Литьё',  rate: 25,   unit: 'пара', from: '01.03.2026', fresh: true },
      { sku: null,      name: 'Общая ставка', op: 'Наладка', rate: 2200, unit: 'смена', from: '01.01.2026', flat: true },
    ],
  },
  {
    id: 'pack', name: 'Упаковка', hue: '#214A8C', icon: 'box', dispatcher: true,
    rates: [
      { sku: '022',   name: 'Сабо',   op: 'Упаковка', rate: 2,  unit: 'пара', from: '01.01.2026' },
      { sku: '905',   name: 'Галоши', op: 'Упаковка', rate: 2,  unit: 'пара', from: '01.01.2026' },
      { sku: '112/н', name: 'Сапоги', op: 'Упаковка', rate: 2,  unit: 'пара', from: '01.01.2026' },
      { sku: '113/м', name: 'Манжет', op: 'Упаковка', rate: 3,  unit: 'пара', from: '01.01.2026' },
      { sku: null,    name: 'Все артикулы', op: 'Передача в цех', rate: 0.5, unit: 'пара', from: '01.01.2026', flat: true },
    ],
  },
  {
    id: 'glue', name: 'Клеевой', hue: '#F59E0B', icon: 'drop',
    rates: [
      { sku: null,      name: 'Сапоги (все)', op: 'Вклейка',     rate: 5, unit: 'пара', from: '01.01.2026', flat: true },
      { sku: 'АВ-300н', name: 'Аляска',       op: 'Вклейка',     rate: 8, unit: 'пара', from: '01.01.2026' },
      { sku: '113/м',   name: 'Манжет',       op: 'Вклейка вставки', rate: 6, unit: 'пара', from: '01.02.2026' },
    ],
  },
  {
    id: 'mark', name: 'Маркировка', hue: '#06B6D4', icon: 'tag',
    rates: [
      { sku: null,    name: 'Все артикулы', op: 'Маркировка',    rate: 1, unit: 'пара', from: '01.01.2026', flat: true },
      { sku: null,    name: 'Премиум',      op: 'Маркировка + гравировка', rate: 3, unit: 'пара', from: '01.01.2026', flat: true },
    ],
  },
  {
    id: 'cut', name: 'Крой', hue: '#EC4899', icon: 'scis',
    rates: [
      { sku: '441',     name: 'Ботинки',    op: 'Раскрой текстиля',  rate: 12, unit: 'пара', from: '01.01.2026' },
      { sku: 'АВ-300н', name: 'Аляска',     op: 'Раскрой меха',      rate: 18, unit: 'пара', from: '01.01.2026' },
      { sku: '113/м',   name: 'Манжет',     op: 'Раскрой',           rate: 8,  unit: 'пара', from: '01.01.2026' },
    ],
  },
  {
    id: 'sew', name: 'Швейка', hue: '#8B5CF6', icon: 'needle',
    rates: [
      { sku: '441',     name: 'Ботинки', op: 'Пошив верха',  rate: 22, unit: 'пара', from: '01.01.2026' },
      { sku: 'АВ-300н', name: 'Аляска',  op: 'Пошив верха',  rate: 35, unit: 'пара', from: '01.01.2026' },
      { sku: '113/м',   name: 'Манжет',  op: 'Пристрочка',   rate: 9,  unit: 'пара', from: '01.01.2026' },
    ],
  },
  {
    id: 'hem', name: 'Обшив', hue: '#10B981', icon: 'thread',
    rates: [
      { sku: null,      name: 'Сапоги (все)', op: 'Обшив верха', rate: 4, unit: 'пара', from: '01.01.2026', flat: true },
      { sku: 'АВ-300н', name: 'Аляска',       op: 'Обшив + утеплитель', rate: 7, unit: 'пара', from: '01.01.2026' },
    ],
  },
  {
    id: 'qa', name: 'ОТК', hue: '#6366F1', icon: 'shield',
    rates: [
      { sku: null, name: 'Все артикулы', op: 'Контроль качества', rate: 1500, unit: 'смена', from: '01.01.2026', flat: true },
      { sku: null, name: 'Отбор брака',  op: 'Сверхурочно',       rate: 250,  unit: 'час',   from: '01.01.2026', flat: true },
    ],
  },
  {
    id: 'wh', name: 'Склад', hue: '#3B82F6', icon: 'wh',
    rates: [
      { sku: null, name: 'Все артикулы', op: 'Приёмка партии', rate: 50,   unit: 'партия', from: '01.01.2026', flat: true },
      { sku: null, name: 'Кладовщик',    op: 'Дежурство',      rate: 1800, unit: 'смена',  from: '01.01.2026', flat: true },
    ],
  },
];

// === Top bar ===
function RTTopBar() {
  return (
    <header style={{
      padding: '14px 28px', borderBottom: `1px solid ${RT.border}`, background: 'white',
      display: 'flex', alignItems: 'center', gap: 20,
    }}>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
        <span style={{ color: RT.ink }}>Light</span><span style={{ color: RT.brand }}>Flow</span>
      </div>
      <div style={{ height: 22, width: 1, background: RT.border }}></div>
      <nav style={{ display: 'flex', gap: 4 }}>
        {[
          'Производство', 'Партии', 'Справочники', 'Расценки', 'Отчёты', 'Настройки',
        ].map((t, i) => {
          const active = t === 'Расценки';
          return (
            <button key={i} style={{
              padding: '8px 14px',
              background: active ? RT.pale : 'transparent',
              color: active ? RT.brand : RT.ink2, border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
            }}>{t}</button>
          );
        })}
      </nav>
      <div style={{ flex: 1 }}></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: RT.ink }}>Корнеев Д.Б.</div>
          <div style={{ fontSize: 11, color: RT.dim }}>Технолог</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: RT.pale, color: RT.brand,
          fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${RT.brand}`,
        }}>КД</div>
      </div>
    </header>
  );
}

// === Header section ===
function TitleRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 18 }}>
      <div>
        <div style={{ ...RT.num, fontSize: 11, color: RT.dim, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          Технология
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: RT.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Расценки сдельной оплаты
        </h1>
        <div style={{ fontSize: 14, color: RT.dim, marginTop: 8 }}>
          Текущий период действия. Изменения сохраняются с историей.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{
          padding: '10px 14px', background: 'white', color: RT.ink2,
          border: `1px solid ${RT.border}`, borderRadius: 10,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {RTIcons.hist} Журнал изменений
        </button>
        <button style={{
          padding: '11px 16px', background: RT.brand, color: 'white',
          border: 'none', borderRadius: 10,
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          boxShadow: '0 4px 12px rgba(33,74,140,0.25)',
        }}>
          {RTIcons.plus} Новая расценка
        </button>
      </div>
    </div>
  );
}

// === Info banner ===
function InfoBanner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      background: '#FFFBEB', border: `1px solid #FDE68A`, borderRadius: 10,
      padding: '12px 14px', marginBottom: 18,
    }}>
      <span style={{ color: RT.amber, flexShrink: 0, marginTop: 1 }}>{RTIcons.bulb}</span>
      <div style={{ fontSize: 13, color: RT.ink2, lineHeight: 1.5 }}>
        Изменения ставок не влияют на уже закрытые смены. Применяются с указанной даты ко всем новым операциям.
        Закрытые ведомости пересчёту не подлежат.
      </div>
      <button style={{
        background: 'transparent', border: 'none', color: RT.amberDark,
        fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
        padding: '2px 8px', borderRadius: 4,
      }}>Понятно</button>
    </div>
  );
}

// === Tabs ===
function Tabs({ active, setActive }) {
  const tabs = [
    { id: 'ws',  label: 'По цехам',     count: 9 },
    { id: 'sku', label: 'По артикулам', count: 12 },
    { id: 'arc', label: 'Архив',        count: 47, mono: true },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 4,
      borderBottom: `1px solid ${RT.border}`, marginBottom: 16,
    }}>
      {tabs.map(t => (
        <button
          key={t.id} onClick={() => setActive(t.id)}
          style={{
            padding: '12px 16px', background: 'transparent', border: 'none',
            borderBottom: t.id === active ? `2px solid ${RT.brand}` : '2px solid transparent',
            color: t.id === active ? RT.brand : RT.ink2,
            fontSize: 14, fontWeight: t.id === active ? 700 : 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: -1,
          }}>
          {t.label}
          <span style={{
            ...RT.num, fontSize: 11, fontWeight: 700,
            color: t.id === active ? RT.brand : RT.dim,
            background: t.id === active ? RT.pale : RT.mist,
            padding: '1px 7px', borderRadius: 100,
          }}>{t.count}</span>
        </button>
      ))}
      <div style={{ flex: 1 }}></div>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: RT.soft }}>{RTIcons.search}</span>
        <input placeholder="Артикул, операция…" style={{
          padding: '7px 10px 7px 32px', border: `1px solid ${RT.border}`, borderRadius: 8,
          fontSize: 13, color: RT.ink, outline: 'none', background: RT.mist, width: 220,
        }}/>
      </div>
    </div>
  );
}

// === Accordion ===
function Accordion({ ws, open, onToggle, totalActive }) {
  return (
    <div style={{
      background: 'white', border: `1px solid ${RT.border}`, borderRadius: 12,
      overflow: 'hidden', marginBottom: 10,
      boxShadow: open ? '0 6px 18px rgba(15,27,45,0.06)' : 'none',
      transition: 'box-shadow .15s',
    }}>
      {/* Color strip + header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px 14px 6px',
          cursor: 'pointer',
          background: open ? RT.mist : 'white',
          transition: 'background .15s',
        }}>
        <div style={{ width: 4, alignSelf: 'stretch', background: ws.hue, borderRadius: 2, flexShrink: 0 }}></div>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${ws.hue}1f`, color: ws.hue,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{RTIcons[ws.icon]}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: RT.ink, letterSpacing: '-0.01em' }}>
              {ws.name}
            </h3>
            {ws.dispatcher && (
              <span style={{ ...RT.num, fontSize: 9, fontWeight: 800, color: RT.brand, letterSpacing: '0.14em' }}>
                ★ DISPATCHER
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: RT.dim, marginTop: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span><span style={{ ...RT.num, fontWeight: 700, color: RT.ink2 }}>{ws.rates.length}</span> ставок</span>
            <span style={{ width: 2, height: 2, background: RT.soft, borderRadius: '50%' }}></span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: RT.success }}></span>
              {ws.rates.length} действует
            </span>
            <span style={{ width: 2, height: 2, background: RT.soft, borderRadius: '50%' }}></span>
            <span>средняя: <span style={{ ...RT.num, fontWeight: 700, color: RT.ink2 }}>{
              Math.round(ws.rates.filter(r => r.unit === 'пара').reduce((a, r) => a + r.rate, 0) / Math.max(1, ws.rates.filter(r => r.unit === 'пара').length))
            }&nbsp;₽/пара</span></span>
          </div>
        </div>

        <button style={{
          padding: '7px 12px', background: 'transparent', color: RT.ink2,
          border: `1px solid ${RT.border}`, borderRadius: 8,
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}
        onClick={(e) => { e.stopPropagation(); }}>
          {RTIcons.plus} Ставка
        </button>

        <span style={{
          color: RT.dim, transition: 'transform .2s',
          transform: open ? 'rotate(0)' : 'rotate(-90deg)',
          display: 'inline-flex',
        }}>{RTIcons.chevD}</span>
      </div>

      {open && <RatesTable ws={ws}/>}
    </div>
  );
}

// === Rates table ===
function RatesTable({ ws }) {
  const th = (label, align = 'left') => (
    <th style={{
      padding: '10px 14px', textAlign: align,
      fontSize: 10, fontWeight: 700, color: RT.dim, fontFamily: RT.mono,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      background: 'white', borderBottom: `1px solid ${RT.borderSoft}`,
    }}>{label}</th>
  );
  const td = (extra = {}) => ({
    padding: '11px 14px', borderTop: `1px solid ${RT.borderSoft}`,
    fontSize: 13, color: RT.ink, verticalAlign: 'middle', ...extra,
  });
  return (
    <div style={{ background: 'white', borderTop: `1px solid ${RT.borderSoft}` }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {th('Артикул')}
            {th('Операция')}
            {th('Ставка', 'right')}
            {th('Единица')}
            {th('Действует с')}
            {th('До')}
            {th('Статус')}
            {th('', 'right')}
          </tr>
        </thead>
        <tbody>
          {ws.rates.map((r, i) => (
            <tr key={i} className="rt-row">
              <td style={td()}>
                {r.flat ? (
                  <span style={{
                    ...RT.num, fontSize: 11, fontWeight: 700, color: RT.ink2,
                    padding: '3px 9px', background: RT.mist, borderRadius: 5,
                    border: `1px dashed ${RT.border}`,
                  }}>{r.sku || 'ВСЕ'}</span>
                ) : (
                  <span style={{
                    ...RT.num, fontSize: 12, fontWeight: 700, color: RT.brand,
                    padding: '3px 9px', background: RT.pale, borderRadius: 5,
                  }}>{r.sku}</span>
                )}
                <span style={{ marginLeft: 10, fontSize: 13, color: RT.ink2, fontWeight: 500 }}>{r.name}</span>
              </td>
              <td style={td()}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, color: RT.ink, fontWeight: 500,
                }}>
                  <span style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: r.unit === 'смена' || r.unit === 'час' ? RT.amber : ws.hue,
                  }}></span>
                  {r.op}
                </span>
              </td>
              <td style={td({ textAlign: 'right' })}>
                <span style={{ ...RT.num, fontSize: 15, fontWeight: 800, color: RT.ink, letterSpacing: '-0.01em' }}>
                  {r.rate.toLocaleString('ru-RU')}
                </span>
                <span style={{ marginLeft: 3, color: RT.dim, fontWeight: 500 }}>₽</span>
              </td>
              <td style={td({ color: RT.ink2, fontSize: 12 })}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: RT.soft }}>/</span> {r.unit}
                </span>
              </td>
              <td style={td({ ...RT.num, color: RT.ink2 })}>
                {r.from}
                {r.fresh && (
                  <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '2px 5px', background: RT.successBg, color: RT.successDark, borderRadius: 3, letterSpacing: '0.06em' }}>
                    NEW
                  </span>
                )}
              </td>
              <td style={td({ ...RT.num, color: RT.dim })}>—</td>
              <td style={td()}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 9px', background: RT.successBg, color: RT.successDark,
                  borderRadius: 100, fontSize: 11, fontWeight: 700,
                }}>
                  {RTIcons.check} Действует
                </span>
              </td>
              <td style={td({ textAlign: 'right', whiteSpace: 'nowrap' })}>
                <div style={{ display: 'inline-flex', gap: 4 }}>
                  <button style={actBtn(RT.brand)} title="Изменить ставку">{RTIcons.edit}</button>
                  <button style={actBtn(RT.ink2)}  title="История">{RTIcons.hist}</button>
                  <button style={actBtn(RT.danger)} title="Деактивировать">{RTIcons.off}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const actBtn = (color) => ({
  width: 28, height: 28, borderRadius: 7, border: `1px solid ${RT.border}`,
  background: 'white', color: color,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  transition: 'all .12s',
});

// === Right panel: calculator ===
function CalcPanel() {
  const [sku, setSku] = React.useState('112/н');
  const [qty, setQty] = React.useState(100);

  // Match rates by SKU
  const COMPONENTS_BY_SKU = {
    '112/н': [
      { ws: 'Литьё',      hue: '#EF4444', rate: 15 },
      { ws: 'Упаковка',   hue: '#214A8C', rate: 2  },
      { ws: 'Клеевой',    hue: '#F59E0B', rate: 5  },
      { ws: 'Обшив',      hue: '#10B981', rate: 4  },
      { ws: 'Маркировка', hue: '#06B6D4', rate: 1  },
    ],
    '022': [
      { ws: 'Литьё',      hue: '#EF4444', rate: 4 },
      { ws: 'Упаковка',   hue: '#214A8C', rate: 2 },
      { ws: 'Маркировка', hue: '#06B6D4', rate: 1 },
    ],
    '905': [
      { ws: 'Литьё',      hue: '#EF4444', rate: 4 },
      { ws: 'Упаковка',   hue: '#214A8C', rate: 2 },
      { ws: 'Маркировка', hue: '#06B6D4', rate: 1 },
    ],
    'АВ-300н': [
      { ws: 'Литьё',      hue: '#EF4444', rate: 25 },
      { ws: 'Крой',       hue: '#EC4899', rate: 18 },
      { ws: 'Швейка',     hue: '#8B5CF6', rate: 35 },
      { ws: 'Клеевой',    hue: '#F59E0B', rate: 8  },
      { ws: 'Обшив',      hue: '#10B981', rate: 7  },
      { ws: 'Упаковка',   hue: '#214A8C', rate: 2  },
      { ws: 'Маркировка', hue: '#06B6D4', rate: 1  },
    ],
    '113/м': [
      { ws: 'Литьё',      hue: '#EF4444', rate: 20 },
      { ws: 'Крой',       hue: '#EC4899', rate: 8  },
      { ws: 'Швейка',     hue: '#8B5CF6', rate: 9  },
      { ws: 'Клеевой',    hue: '#F59E0B', rate: 6  },
      { ws: 'Упаковка',   hue: '#214A8C', rate: 3  },
      { ws: 'Маркировка', hue: '#06B6D4', rate: 1  },
    ],
  };
  const comps = COMPONENTS_BY_SKU[sku] || [];
  const total = comps.reduce((a, c) => a + c.rate * qty, 0);
  const perPair = comps.reduce((a, c) => a + c.rate, 0);

  return (
    <aside style={{
      width: 320, flexShrink: 0,
      position: 'sticky', top: 16, alignSelf: 'flex-start',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        background: 'white', border: `1px solid ${RT.border}`, borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 16px', background: RT.ink, color: 'white',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: '#7AB6FF' }}>{RTIcons.calc}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>Расчётный пример</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>ФОТ по артикулу × количество</div>
          </div>
        </div>

        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${RT.borderSoft}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={lblStyle}>Артикул</label>
            <select value={sku} onChange={(e) => setSku(e.target.value)} style={selStyle}>
              <option value="112/н">Сапоги ЭВА 112/н</option>
              <option value="022">Сабо 022</option>
              <option value="905">Галоши 905</option>
              <option value="113/м">Манжет 113/м</option>
              <option value="АВ-300н">Аляска АВ-300н</option>
            </select>
          </div>
          <div>
            <label style={lblStyle}>Количество</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} style={{
                flex: 1, ...selStyle, fontFamily: RT.mono, fontWeight: 700,
                backgroundImage: 'none', paddingRight: 12,
              }}/>
              <div style={{
                padding: '8px 12px', background: RT.mist, color: RT.dim,
                border: `1px solid ${RT.border}`, borderRadius: 8,
                fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center',
              }}>пар</div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              {[50, 100, 200, 500].map(n => (
                <button key={n} onClick={() => setQty(n)} style={{
                  flex: 1, padding: '5px 6px', background: qty === n ? RT.pale : 'white',
                  color: qty === n ? RT.brand : RT.dim,
                  border: `1px solid ${qty === n ? RT.brand : RT.border}`,
                  borderRadius: 6, fontFamily: RT.mono, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>{n}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculation rows */}
        <div style={{ padding: '10px 16px' }}>
          {comps.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: RT.dim, fontSize: 12 }}>
              Нет данных для расчёта
            </div>
          )}
          {comps.map((c, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto auto',
              alignItems: 'baseline', gap: 8, padding: '7px 0',
              fontSize: 12,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: RT.ink2, fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.hue, flexShrink: 0 }}></span>
                {c.ws}
              </span>
              <span style={{ ...RT.num, color: RT.dim, fontSize: 11 }}>{qty} × {c.rate}</span>
              <span style={{ color: RT.soft }}>=</span>
              <span style={{ ...RT.num, fontWeight: 700, color: RT.ink, minWidth: 70, textAlign: 'right' }}>
                {(c.rate * qty).toLocaleString('ru-RU')} <span style={{ color: RT.dim, fontWeight: 500 }}>₽</span>
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{
          padding: '14px 16px',
          background: RT.mist,
          borderTop: `1px dashed ${RT.border}`,
        }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: RT.dim, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: RT.mono }}>
              Итого ФОТ
            </span>
            <span style={{ ...RT.num, fontSize: 22, fontWeight: 800, color: RT.brand, letterSpacing: '-0.02em' }}>
              {total.toLocaleString('ru-RU')} <span style={{ color: RT.dim, fontWeight: 600, fontSize: 14 }}>₽</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: RT.dim }}>на пару</span>
            <span style={{ ...RT.num, fontSize: 14, fontWeight: 700, color: RT.ink }}>
              {perPair.toLocaleString('ru-RU')} <span style={{ color: RT.dim, fontWeight: 500 }}>₽</span>
            </span>
          </div>
        </div>
      </div>

      {/* Helpful tip */}
      <div style={{
        padding: 14, background: RT.pale, border: `1px solid ${RT.brand}22`, borderRadius: 10,
        display: 'flex', gap: 10,
      }}>
        <span style={{ color: RT.brand, flexShrink: 0, marginTop: 2 }}>{RTIcons.info}</span>
        <div style={{ fontSize: 12, color: RT.ink2, lineHeight: 1.5 }}>
          Себестоимость пары по ФОТ помогает оценить эффект изменения ставки на маржу.
          <a href="#" style={{ color: RT.brand, fontWeight: 600, textDecoration: 'none', marginLeft: 4 }}>Подробнее →</a>
        </div>
      </div>

      {/* Last edit */}
      <div style={{
        padding: '12px 14px', background: 'white', border: `1px solid ${RT.border}`, borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: RT.pale, color: RT.brand,
          fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>КД</div>
        <div style={{ flex: 1, fontSize: 11, color: RT.dim, lineHeight: 1.4 }}>
          Последнее изменение: <strong style={{ color: RT.ink2 }}>Литейка / Аляска</strong>
          <div style={{ ...RT.num, marginTop: 1 }}>01.03.2026 · Корнеев Д.Б.</div>
        </div>
      </div>
    </aside>
  );
}
const lblStyle = {
  display: 'block', fontSize: 11, color: RT.dim, fontWeight: 600,
  marginBottom: 4, letterSpacing: '0.02em',
};
const selStyle = {
  width: '100%', padding: '8px 10px',
  background: 'white', color: RT.ink,
  border: `1px solid ${RT.border}`, borderRadius: 8,
  fontSize: 13, fontWeight: 500, outline: 'none', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7C93' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 28,
};

// === Main ===
function RatesScreen() {
  const [tab, setTab] = React.useState('ws');
  const [openSet, setOpenSet] = React.useState(new Set(['mold', 'glue']));

  const toggle = (id) => {
    setOpenSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div style={{
      minHeight: '100%', background: RT.mist,
      fontFamily: "'Inter', system-ui, sans-serif", color: RT.ink,
    }}>
      <RTTopBar />
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 28px 40px' }}>
        <TitleRow />
        <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <InfoBanner />
            <Tabs active={tab} setActive={setTab}/>

            {tab === 'ws' && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                  fontFamily: RT.mono, fontSize: 11, color: RT.dim,
                }}>
                  <button onClick={() => setOpenSet(new Set(RT_WORKSHOPS.map(w => w.id)))} style={chipBtn}>Развернуть все</button>
                  <button onClick={() => setOpenSet(new Set())} style={chipBtn}>Свернуть все</button>
                  <span style={{ marginLeft: 'auto' }}>9 цехов · 36 ставок · 0 изменений в очереди</span>
                </div>

                {RT_WORKSHOPS.map(ws => (
                  <Accordion
                    key={ws.id} ws={ws}
                    open={openSet.has(ws.id)}
                    onToggle={() => toggle(ws.id)}
                  />
                ))}
              </div>
            )}

            {tab === 'sku' && (
              <div style={{ padding: 60, textAlign: 'center', background: 'white', border: `1px dashed ${RT.border}`, borderRadius: 12 }}>
                <div style={{ color: RT.dim, marginBottom: 8 }}>{RTIcons.tag}</div>
                <div style={{ fontWeight: 700, color: RT.ink, marginBottom: 4 }}>Свод по артикулам</div>
                <div style={{ fontSize: 13, color: RT.dim }}>Те же ставки, сгруппированные по SKU — кросс-цеховая разбивка</div>
              </div>
            )}
            {tab === 'arc' && (
              <div style={{ padding: 60, textAlign: 'center', background: 'white', border: `1px dashed ${RT.border}`, borderRadius: 12 }}>
                <div style={{ color: RT.dim, marginBottom: 8 }}>{RTIcons.hist}</div>
                <div style={{ fontWeight: 700, color: RT.ink, marginBottom: 4 }}>Архив расценок</div>
                <div style={{ fontSize: 13, color: RT.dim }}>Завершённые и заменённые ставки с историей действия</div>
              </div>
            )}
          </div>
          <CalcPanel />
        </div>
      </main>
    </div>
  );
}
const chipBtn = {
  padding: '5px 10px', background: 'white', color: RT.ink2,
  border: `1px solid ${RT.border}`, borderRadius: 6,
  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: RT.mono,
};

window.RatesScreen = RatesScreen;
