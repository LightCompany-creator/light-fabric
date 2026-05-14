// LightFlow — Packing foreman · Inbox (Входящие партии)

const inIcon = (paths, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);

const InboxIcons = {
  logout: inIcon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>),
  layers: inIcon(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>, 16),
  inbox:  inIcon(<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>, 16),
  archive:inIcon(<><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>, 16),
  book:   inIcon(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>, 16),
  check:  inIcon(<polyline points="20 6 9 17 4 12"/>, 20),
  arrow:  inIcon(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>, 16),
  box:    inIcon(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>, 14),
  scale:  inIcon(<><path d="M12 3v18"/><path d="M5 8h14l-2 8a3 3 0 0 1-3 2h-4a3 3 0 0 1-3-2L5 8z"/></>, 14),
  ruler:  inIcon(<><path d="M21 3 3 21"/><path d="M7 7l2 2M11 3l2 2M15 7l2 2M3 11l2 2M7 15l2 2M11 19l2 2"/></>, 14),
  clock:  inIcon(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, 13),
  star:   inIcon(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>, 14),
  filter: inIcon(<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>, 14),
};

const IC = {
  brand: '#214A8C', brandDark: '#163566', pale: '#E8EFF8', mist: '#F4F7FC',
  accent: '#F59E0B', success: '#10B981', danger: '#EF4444',
  ink: '#0F1B2D', ink2: '#344563', dim: '#6B7C93', soft: '#9AABBF',
  border: '#D9E2EE',
  // workshops
  wsMold: '#EF4444', wsMoldBg: '#FEE2E2', wsMoldBd: '#FCA5A5', wsMoldDk: '#991B1B',
  wsPack: '#214A8C',
  wsGlue: '#F59E0B', wsGlueBg: '#FEF3C7', wsGlueDk: '#92400E',
  wsMark: '#06B6D4', wsMarkBg: '#CFFAFE', wsMarkDk: '#155E75',
  wsCut:  '#8B5CF6', wsCutBg:  '#EDE9FE', wsCutDk:  '#5B21B6',
  wsRework: '#F97316', wsReworkBg: '#FFEDD5', wsReworkDk: '#9A3412',
  mono: "'JetBrains Mono', monospace",
  num: { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' },
};

// --- HEADER (Packing) ---
function InHeader() {
  return (
    <header style={{
      background: 'white', borderBottom: `1px solid ${IC.border}`,
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: '14px 24px', gap: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: IC.ink }}>Light</span>
            <span style={{ color: IC.brand }}>Flow</span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '7px 14px', background: IC.pale, border: `1px solid ${IC.brand}33`,
            borderRadius: 100,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: IC.brand, boxShadow: `0 0 0 4px rgba(33,74,140,0.18)` }}></span>
            <span style={{ fontSize: 14, fontWeight: 700, color: IC.brandDark }}>Упаковка</span>
            <span style={{ fontFamily: IC.mono, fontSize: 10, color: IC.brand, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, padding: '2px 6px', background: 'white', borderRadius: 4 }}>Диспетчер</span>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: IC.ink }}>вторник, 12 мая 2026</div>
          <div style={{ ...IC.num, fontSize: 11, color: IC.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
            Смена день · 14:38
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: IC.ink }}>Смирнова О.В.</div>
            <div style={{ fontSize: 11, color: IC.dim }}>Бригадир упаковки · таб. 000456</div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: IC.pale, color: IC.brand,
            fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${IC.brand}`,
          }}>СО</div>
          <button style={{
            width: 40, height: 40, borderRadius: 10, border: `1px solid ${IC.border}`,
            background: 'white', color: IC.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>{InboxIcons.logout}</button>
        </div>
      </div>

      <nav style={{ display: 'flex', gap: 4, padding: '0 24px', borderTop: `1px solid ${IC.border}` }}>
        {[
          { icon: InboxIcons.layers, label: 'Моя смена' },
          { icon: InboxIcons.inbox, label: 'Входящие', badge: 4, active: true },
          { icon: InboxIcons.archive, label: 'Архив' },
          { icon: InboxIcons.book, label: 'Справочники' },
        ].map((tab, i) => (
          <button key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 18px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: tab.active ? `2px solid ${IC.brand}` : '2px solid transparent',
            color: tab.active ? IC.brand : IC.ink2,
            fontSize: 14, fontWeight: tab.active ? 700 : 500,
          }}>
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && <span style={{
              padding: '2px 7px', background: IC.accent, color: 'white',
              borderRadius: 100, fontSize: 11, fontWeight: 700, fontFamily: IC.mono,
            }}>{tab.badge}</span>}
          </button>
        ))}
      </nav>
    </header>
  );
}

// --- Workshop pill ---
function WSPill({ tone, label, code, dot = true }) {
  const tones = {
    mold: { bg: IC.wsMoldBg, bd: IC.wsMoldBd, ink: IC.wsMoldDk, dot: IC.wsMold, code: '#B91C1C' },
    pack: { bg: IC.pale,     bd: `${IC.brand}33`, ink: IC.brandDark, dot: IC.brand, code: IC.brand },
    glue: { bg: IC.wsGlueBg, bd: '#FCD34D',  ink: IC.wsGlueDk, dot: IC.wsGlue, code: IC.wsGlueDk },
    mark: { bg: IC.wsMarkBg, bd: '#67E8F9',  ink: IC.wsMarkDk, dot: IC.wsMark, code: IC.wsMarkDk },
    cut:  { bg: IC.wsCutBg,  bd: '#C4B5FD',  ink: IC.wsCutDk,  dot: IC.wsCut,  code: IC.wsCutDk },
  };
  const t = tones[tone] || tones.mold;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '5px 11px', background: t.bg, border: `1px solid ${t.bd}`,
      borderRadius: 100, fontSize: 13, fontWeight: 700, color: t.ink,
    }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.dot }}></span>}
      {label}
      {code && <span style={{ fontFamily: IC.mono, fontSize: 10, fontWeight: 700, color: t.code, letterSpacing: '0.1em' }}>{code}</span>}
    </span>
  );
}

// --- Batch card ---
function BatchCard({ batch }) {
  const isPriority = batch.priority;
  return (
    <article style={{
      background: 'white',
      border: isPriority ? `2px solid ${IC.brand}` : `1px solid ${IC.border}`,
      borderRadius: 14, overflow: 'hidden',
      boxShadow: isPriority ? '0 4px 18px rgba(33,74,140,0.12)' : '0 1px 2px rgba(15,27,45,0.04)',
      position: 'relative',
    }}>
      {isPriority && (
        <div style={{
          position: 'absolute', top: 10, right: 12,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 9px', background: IC.brand, color: 'white',
          borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {InboxIcons.star} Приоритетная
        </div>
      )}

      {/* Top strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: IC.mist, borderBottom: `1px solid ${IC.border}`,
        gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ ...IC.num, fontSize: 22, fontWeight: 700, color: IC.ink, letterSpacing: '0.02em' }}>
          {batch.id}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <WSPill tone="mold" label="Литейка" code="02" />
          <span style={{ ...IC.num, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: IC.dim }}>
            {InboxIcons.clock} пришла {batch.arrived}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 280px', gap: 24,
        padding: '20px 22px', alignItems: 'stretch',
      }}>
        {/* Col 1: article */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...IC.num, color: IC.dim, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Артикул</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ ...IC.num, fontSize: 32, fontWeight: 800, color: IC.brand, letterSpacing: '-0.01em', lineHeight: 1 }}>{batch.code}</span>
          </div>
          <div style={{ fontSize: 14, color: IC.ink2, lineHeight: 1.4 }}>{batch.name}</div>
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', background: '#D1FAE5', color: '#065F46',
              borderRadius: 100, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
            }}>{batch.material}</span>
          </div>
        </div>

        {/* Col 2: params */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...IC.num, color: IC.dim, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Параметры</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...IC.num, fontSize: 32, fontWeight: 800, color: IC.ink, letterSpacing: '-0.01em', lineHeight: 1 }}>{batch.pairs}</span>
            <span style={{ fontSize: 14, color: IC.dim, fontWeight: 600 }}>пар</span>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '4px 16px',
            fontSize: 13, color: IC.ink2,
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: IC.dim }}>{InboxIcons.box}<span style={{ ...IC.num }}>{batch.boxes}</span></div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: IC.dim }}>{InboxIcons.scale}<span style={{ ...IC.num }}>{batch.weight} кг</span></div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: IC.dim }}>{InboxIcons.ruler}<span style={{ ...IC.num }}>{batch.sizes}</span></div>
          </div>
        </div>

        {/* Col 3: actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button style={{
            padding: '14px 16px', background: IC.success, color: 'white', border: 'none',
            borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(16,185,129,0.28)',
          }}>{InboxIcons.check} Принять</button>

          <div style={{ marginTop: 4 }}>
            <div style={{ ...IC.num, color: IC.dim, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Маршрут</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {batch.routes.map((r, i) => {
                const variants = {
                  primary:   { bg: IC.wsGlue, color: 'white', bd: 'none', shadow: '0 2px 8px rgba(245,158,11,0.3)', fw: 700 },
                  secondary: { bg: 'white', color: IC.wsMarkDk, bd: `1px solid ${IC.wsMarkDk}66`, shadow: 'none', fw: 600 },
                  cut:       { bg: IC.wsCut, color: 'white', bd: 'none', shadow: '0 2px 8px rgba(139,92,246,0.3)', fw: 700 },
                  thin:      { bg: 'white', color: IC.wsReworkDk, bd: `1px dashed ${IC.wsRework}aa`, shadow: 'none', fw: 500 },
                };
                const v = variants[r.variant] || variants.primary;
                return (
                  <button key={i} style={{
                    padding: '10px 14px', background: v.bg, color: v.color,
                    border: v.bd === 'none' ? 'none' : v.bd, outline: 'none',
                    borderRadius: 8, fontSize: 13, fontWeight: v.fw, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    boxShadow: v.shadow,
                  }}>
                    <span>{r.label}</span>
                    {InboxIcons.arrow}
                  </button>
                );
              })}
            </div>
          </div>

          <button style={{
            marginTop: 2, padding: '6px 0', background: 'transparent', color: IC.brand,
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            textAlign: 'center', textDecoration: 'underline', textUnderlineOffset: 3,
          }}>Подробнее →</button>
        </div>
      </div>
    </article>
  );
}

// --- Filter chips ---
function FilterBar() {
  const filters = [
    { label: 'Все', count: 4, active: true },
    { label: 'Литейка', count: 4, dot: IC.wsMold },
    { label: 'Срочные', count: 1, dot: IC.brand },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '20px 24px 12px', flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: IC.ink, letterSpacing: '-0.01em' }}>
          Входящие партии
        </div>
        <div style={{ ...IC.num, fontSize: 13, color: IC.dim, marginTop: 4 }}>
          <span style={{ color: IC.brand, fontWeight: 700 }}>4 входящих</span> · 12 в работе · 38 закрыто сегодня
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: IC.dim, marginRight: 4 }}>{InboxIcons.filter}</span>
        {filters.map((f, i) => (
          <button key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 14px',
            background: f.active ? IC.brand : 'white',
            color: f.active ? 'white' : IC.ink2,
            border: f.active ? 'none' : `1px solid ${IC.border}`,
            borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            {f.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: f.dot }}></span>}
            <span>{f.label}</span>
            <span style={{
              ...IC.num, padding: '1px 7px',
              background: f.active ? 'rgba(255,255,255,0.22)' : IC.mist,
              color: f.active ? 'white' : IC.dim,
              borderRadius: 100, fontSize: 11, fontWeight: 700,
            }}>{f.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Screen ---
function InboxScreen() {
  const batches = [
    {
      id: 'ЛИТ-120526-01', arrived: '14:30', priority: true,
      code: '112/н', name: 'Сапоги ЭВА мужские, утеплённые', material: 'ЭВА',
      pairs: 96, boxes: '12 кор × 8', weight: 68, sizes: '42–46',
      routes: [
        { label: 'В клеевой', variant: 'primary' },
        { label: 'На маркировку', variant: 'secondary' },
        { label: 'На доработку', variant: 'thin' },
      ],
    },
    {
      id: 'ЛИТ-120526-02', arrived: '14:18',
      code: '905', name: 'Галоши ЭВА мужские', material: 'ЭВА',
      pairs: 144, boxes: '18 кор × 8', weight: 42, sizes: '40–45',
      routes: [
        { label: 'На маркировку', variant: 'primary' },
        { label: 'В клеевой', variant: 'secondary' },
        { label: 'На доработку', variant: 'thin' },
      ],
    },
    {
      id: 'ЛИТ-120526-03', arrived: '13:55',
      code: '022', name: 'Сабо ЭВА мужские', material: 'ЭВА',
      pairs: 72, boxes: '9 кор × 8', weight: 18, sizes: '41–46',
      routes: [
        { label: 'На маркировку', variant: 'primary' },
        { label: 'В клеевой', variant: 'secondary' },
        { label: 'На доработку', variant: 'thin' },
      ],
    },
    {
      id: 'ЛИТ-120526-04', arrived: '13:42',
      code: 'АВ-300н', name: 'Сапоги Аляска · с утеплителем + текстильный верх', material: 'ЭВА',
      pairs: 32, boxes: '4 кор × 8', weight: 24, sizes: '41–46',
      routes: [
        { label: 'В крой (верх)', variant: 'cut' },
        { label: 'В клеевой', variant: 'secondary' },
        { label: 'На доработку', variant: 'thin' },
      ],
    },
  ];

  // make second route be primary for #2 (override): actually already set above

  return (
    <div style={{ minHeight: '100%', background: IC.mist, fontFamily: "'Inter', system-ui, sans-serif", color: IC.ink }}>
      <InHeader />
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '8px 16px 32px' }}>
        <FilterBar />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 8px' }}>
          {batches.map(b => <BatchCard key={b.id} batch={b} />)}
        </div>
      </main>
    </div>
  );
}

window.InboxScreen = InboxScreen;
