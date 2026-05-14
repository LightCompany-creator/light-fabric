// LightFabric — Production Map (Карта производства · диспетчерская)

const PM = {
  // dark theme (command center)
  dark: {
    bg: '#0A1322', bg2: '#0E1A2E', panel: '#131F36', panelHi: '#1A2742',
    border: '#1F2D48', borderSoft: '#172339',
    ink: '#E8EEF8', ink2: '#A6B4CC', dim: '#6E7E9B', soft: '#475467',
    grid: 'rgba(120,150,200,0.06)',
    accent: '#3D7EFF', accentSoft: '#1E3460',
    flowOk: '#10B981', flowWarn: '#F59E0B', flowJam: '#EF4444',
    pulse: '#7AB6FF',
  },
  light: {
    bg: '#F1F4FA', bg2: '#E7ECF5', panel: '#FFFFFF', panelHi: '#F4F7FC',
    border: '#D9E2EE', borderSoft: '#E6ECF4',
    ink: '#0F1B2D', ink2: '#344563', dim: '#6B7C93', soft: '#9AABBF',
    grid: 'rgba(33,74,140,0.06)',
    accent: '#214A8C', accentSoft: '#E8EFF8',
    flowOk: '#10B981', flowWarn: '#F59E0B', flowJam: '#EF4444',
    pulse: '#214A8C',
  },
  mono: "'JetBrains Mono', monospace",
};

// Реальные руководители цехов из employees-template.xlsx (Light Company).
// Поле foreman — это начальник цеха (или бригадир, если начальника нет).
const WS = [
  { id: 'raw',  name: 'Ангар',       hue: '#8B5CF6', icon: 'cube',    role: 'stock',
    foreman: 'Кодиров М.', people: 2 },
  { id: 'mold', name: 'Литейка',     hue: '#EF4444', icon: 'flame',   role: 'work',
    load: 92, batches: 6, queue: 4, foreman: 'Мангасарян Р.Ю.', people: 4,
    list: [
      { id: 'ЛИТ-140526-01', sku: '112/н Сапоги',  qty: 96,  status: 'work' },
      { id: 'ЛИТ-140526-02', sku: '905 Галоши',    qty: 144, status: 'work' },
      { id: 'ЛИТ-140526-03', sku: '022 Сабо',      qty: 72,  status: 'work' },
      { id: 'ЛИТ-140526-04', sku: '441 Ботинки',   qty: 60,  status: 'queue' },
    ] },
  { id: 'pack', name: 'Упаковка',    hue: '#214A8C', icon: 'box',     role: 'dispatcher',
    load: 78, batches: 9, queue: 7, foreman: 'Мангасарян Р.Ю.', people: 6,
    list: [
      { id: 'УПК-140526-01', sku: '112/н Сапоги',  qty: 96,  status: 'work', dest: 'Маркировка' },
      { id: 'УПК-140526-02', sku: '905 Галоши',    qty: 144, status: 'work', dest: 'Маркировка' },
      { id: 'УПК-140526-03', sku: '022 Сабо',      qty: 72,  status: 'work', dest: 'Клеевой' },
      { id: 'УПК-140526-04', sku: '441 Ботинки',   qty: 60,  status: 'work', dest: 'Крой' },
    ] },
  { id: 'mark', name: 'Маркировка',  hue: '#06B6D4', icon: 'tag',     role: 'work',
    load: 64, batches: 4, queue: 2, foreman: 'Оганджанян А.С.', people: 3 },
  { id: 'glue', name: 'Клеевой',     hue: '#F59E0B', icon: 'drop',    role: 'work',
    load: 88, batches: 5, queue: 5, foreman: 'Азамов К.', people: 5, warn: true },
  { id: 'cut',  name: 'Крой',        hue: '#EC4899', icon: 'scissors',role: 'work',
    load: 55, batches: 3, queue: 1, foreman: 'Ароян О.Н.', people: 4 },
  { id: 'sew',  name: 'Швейка',      hue: '#8B5CF6', icon: 'needle',  role: 'work',
    load: 71, batches: 4, queue: 3, foreman: 'Авагимян Н.М.', people: 6 },
  { id: 'hem',  name: 'Обшив',       hue: '#10B981', icon: 'thread',  role: 'work',
    load: 48, batches: 3, queue: 0, foreman: 'Ароян О.Н.', people: 3 },
  { id: 'wh',   name: 'Склад',       hue: '#3B82F6', icon: 'wh',      role: 'sink',
    load: 35, batches: 12, queue: 0, foreman: 'Хатаян Р.Ю.', people: 2 },
];
const wsById = id => WS.find(w => w.id === id);

// Flow connections — coordinate-based, positions defined in map
const FLOWS = [
  { from: 'raw',  to: 'mold', strength: 3, status: 'ok' },
  { from: 'mold', to: 'pack', strength: 4, status: 'ok' },
  { from: 'pack', to: 'mark', strength: 3, status: 'ok' },
  { from: 'pack', to: 'glue', strength: 3, status: 'warn' },
  { from: 'pack', to: 'cut',  strength: 2, status: 'ok' },
  { from: 'mark', to: 'wh',   strength: 3, status: 'ok' },
  { from: 'glue', to: 'hem',  strength: 2, status: 'warn' },
  { from: 'cut',  to: 'sew',  strength: 2, status: 'ok' },
  { from: 'sew',  to: 'wh',   strength: 2, status: 'ok' },
  { from: 'hem',  to: 'wh',   strength: 2, status: 'ok' },
];

// Workshop positions on map (% of map area)
const POS = {
  raw:  { x: 6,  y: 50, w: 92 },
  mold: { x: 20, y: 50, w: 130 },
  pack: { x: 39, y: 50, w: 170, big: true },
  mark: { x: 60, y: 18, w: 130 },
  glue: { x: 60, y: 50, w: 130 },
  cut:  { x: 60, y: 82, w: 130 },
  wh:   { x: 83, y: 18, w: 130 },
  hem:  { x: 83, y: 50, w: 130 },
  sew:  { x: 83, y: 82, w: 130 },
};

// --- Icons ---
const sIcon = (paths, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const PMIcons = {
  flame:    sIcon(<path d="M12 2c1 5 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4-1 3 2 4 2 4s-2-3 1-7c1-1.5 0-4 0-4z"/>),
  box:      sIcon(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>),
  tag:      sIcon(<><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>),
  drop:     sIcon(<path d="M12 2.5C7 10 5 12 5 15.5a7 7 0 0 0 14 0c0-3.5-2-5.5-7-13z"/>),
  scissors: sIcon(<><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></>),
  needle:   sIcon(<><path d="M3 21l4-4"/><path d="M21 3 7 17"/><circle cx="6" cy="18" r="2"/><circle cx="20" cy="4" r="1"/></>),
  thread:   sIcon(<><path d="M4 4c8 0 8 16 16 16"/><circle cx="20" cy="20" r="1.5"/></>),
  cube:     sIcon(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>),
  wh:       sIcon(<><path d="M3 21V9l9-5 9 5v12"/><rect x="9" y="13" width="6" height="8"/><line x1="3" y1="21" x2="21" y2="21"/></>),
  zap:      sIcon(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>, 14),
  alert:    sIcon(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>, 14),
  check:    sIcon(<polyline points="20 6 9 17 4 12"/>, 14),
  arrow:    sIcon(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>, 14),
  filter:   sIcon(<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>, 14),
  layers:   sIcon(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>, 14),
  user:     sIcon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>, 14),
  clock:    sIcon(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, 14),
  dot:      sIcon(<circle cx="12" cy="12" r="6"/>, 14),
  ext:      sIcon(<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>, 14),
  pulse:    sIcon(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>, 14),
  sun:      sIcon(<><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></>, 14),
  moon:     sIcon(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>, 14),
};

function getStatus(load) {
  if (load >= 90) return 'jam';
  if (load >= 80) return 'warn';
  return 'ok';
}

// ====== WORKSHOP CARD ======
function WorkshopCard({ ws, pos, theme, selected, onClick }) {
  if (ws.role === 'stock') return <StockCard ws={ws} pos={pos} theme={theme} />;
  const status = ws.role === 'sink' ? 'ok' : getStatus(ws.load);
  const statusColor = status === 'jam' ? theme.flowJam : status === 'warn' ? theme.flowWarn : theme.flowOk;
  const dispatcher = ws.role === 'dispatcher';
  const sink = ws.role === 'sink';

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${pos.x}%`, top: `${pos.y}%`,
        width: pos.w, transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: selected ? 5 : 2,
      }}>
      {/* Glow when selected */}
      {selected && (
        <div style={{
          position: 'absolute', inset: -6, borderRadius: 14,
          boxShadow: `0 0 0 2px ${ws.hue}, 0 0 32px ${ws.hue}66`,
          pointerEvents: 'none',
        }}/>
      )}
      <div style={{
        background: theme.panel,
        borderRadius: 12,
        overflow: 'hidden',
        border: dispatcher
          ? `2px solid ${theme.accent}`
          : `1px solid ${theme.border}`,
        boxShadow: dispatcher
          ? `0 0 0 3px ${theme.accent}22, 0 12px 30px rgba(0,0,0,0.35)`
          : '0 4px 12px rgba(0,0,0,0.18)',
        transition: 'transform .15s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = ''}
      >
        {/* Color strip top */}
        <div style={{ height: 4, background: ws.hue }}></div>

        {/* Header */}
        <div style={{ padding: '10px 12px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: dispatcher ? 36 : 30, height: dispatcher ? 36 : 30, borderRadius: 8,
            background: `${ws.hue}22`, color: ws.hue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>{PMIcons[ws.icon]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {dispatcher && (
              <div style={{
                fontFamily: PM.mono, fontSize: 9, fontWeight: 800, color: theme.accent,
                letterSpacing: '0.18em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1,
              }}>★ DISPATCHER ★</div>
            )}
            <div style={{
              fontSize: dispatcher ? 15 : 13, fontWeight: 700, color: theme.ink,
              letterSpacing: '-0.01em', lineHeight: 1.1,
            }}>{ws.name}</div>
          </div>
          {ws.warn && (
            <span style={{ color: theme.flowWarn, display: 'inline-flex' }}>{PMIcons.alert}</span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '0 12px 10px' }}>
          {sink ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: PM.mono, fontSize: 22, fontWeight: 800, color: theme.ink, lineHeight: 1 }}>{ws.batches}</span>
              <span style={{ fontSize: 11, color: theme.dim, fontWeight: 600 }}>партий принято</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}` }}></span>
                <span style={{ fontSize: 11, color: theme.ink2, fontWeight: 600 }}>
                  В работе · <span style={{ fontFamily: PM.mono, fontWeight: 700, color: theme.ink }}>{ws.batches}</span> партий
                </span>
              </div>

              {/* Load bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: theme.bg2,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${ws.load}%`,
                    background: status === 'jam'
                      ? `linear-gradient(90deg, ${theme.flowWarn}, ${theme.flowJam})`
                      : status === 'warn'
                      ? `linear-gradient(90deg, ${ws.hue}, ${theme.flowWarn})`
                      : ws.hue,
                    transition: 'width .4s',
                  }}></div>
                </div>
                <span style={{
                  fontFamily: PM.mono, fontSize: 11, fontWeight: 800,
                  color: statusColor, minWidth: 28, textAlign: 'right',
                }}>{ws.load}%</span>
              </div>

              {/* Queue dots */}
              {ws.queue > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
                  <span style={{ fontFamily: PM.mono, fontSize: 9, color: theme.dim, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Очередь
                  </span>
                  <div style={{ display: 'inline-flex', gap: 3, marginLeft: 2 }}>
                    {Array.from({ length: Math.min(ws.queue, 8) }).map((_, i) => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: ws.hue, opacity: 1 - (i * 0.08),
                      }}></span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StockCard({ ws, pos, theme }) {
  return (
    <div style={{
      position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
      width: pos.w, transform: 'translate(-50%, -50%)',
      zIndex: 2,
    }}>
      <div style={{
        background: 'transparent',
        border: `1.5px dashed ${theme.border}`,
        borderRadius: 12, padding: '10px 8px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: `${ws.hue}22`, color: ws.hue,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px',
        }}>{PMIcons.cube}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.ink2 }}>{ws.name}</div>
        <div style={{ fontFamily: PM.mono, fontSize: 10, color: theme.dim, marginTop: 2 }}>склад</div>
      </div>
    </div>
  );
}

// ====== FLOW LINES (SVG) ======
function FlowLines({ theme }) {
  // SVG coord system 100 x 100 (percentage). We'll use percent-based positioning via SVG viewBox.
  // Convert workshop POS to SVG points adjusted for card edges (offset slightly toward card edge).
  const pt = (id, offsetX = 0, offsetY = 0) => {
    const p = POS[id];
    return { x: p.x + offsetX, y: p.y + offsetY };
  };

  const colorFor = (s) => s === 'warn' ? theme.flowWarn : s === 'jam' ? theme.flowJam : theme.flowOk;

  // Define path geometries per flow. Use cubic Beziers for smooth curves.
  function pathFor(from, to) {
    const a = POS[from], b = POS[to];
    // approximate card half-width in % (rough — uses average map width ~1100px)
    const w = 6;
    const startX = a.x + w, endX = b.x - w;
    const startY = a.y, endY = b.y;
    const midX = (startX + endX) / 2;
    if (Math.abs(a.y - b.y) < 1) {
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    }
    return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  }

  // Special return paths from Обшив/Швейка up to Склад (curved up)
  function pathUpReturn(from, to) {
    const a = POS[from], b = POS[to];
    const startX = a.x, endX = b.x;
    const startY = a.y - 4, endY = b.y + 4;
    return `M ${startX} ${startY} C ${startX} ${(startY+endY)/2}, ${endX} ${(startY+endY)/2}, ${endX} ${endY}`;
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <defs>
        {FLOWS.map(f => (
          <marker
            key={`arrow-${f.from}-${f.to}`}
            id={`arrow-${f.from}-${f.to}`}
            viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={colorFor(f.status)}/>
          </marker>
        ))}
      </defs>

      {/* Background lines */}
      {FLOWS.map((f) => {
        const isReturn = (f.from === 'sew' || f.from === 'hem') && f.to === 'wh';
        const d = isReturn ? pathUpReturn(f.from, f.to) : pathFor(f.from, f.to);
        const c = colorFor(f.status);
        return (
          <g key={`${f.from}-${f.to}`}>
            <path d={d} stroke={c} strokeOpacity="0.18"
                  strokeWidth={f.strength * 0.45 + 0.3}
                  fill="none" strokeLinecap="round"/>
            <path d={d} stroke={c} strokeOpacity="0.85"
                  strokeWidth={f.strength * 0.18 + 0.15}
                  fill="none" strokeLinecap="round" strokeDasharray="0.6 0.9"
                  markerEnd={`url(#arrow-${f.from}-${f.to})`}>
              <animate attributeName="stroke-dashoffset" from="3" to="0" dur={`${2 + f.strength * 0.2}s`} repeatCount="indefinite"/>
            </path>
            {/* Moving batch dots */}
            <circle r={f.strength * 0.18 + 0.25} fill={c}>
              <animateMotion dur={`${4 + f.strength * 0.3}s`} repeatCount="indefinite" path={d}/>
            </circle>
            {f.strength >= 3 && (
              <circle r={f.strength * 0.16 + 0.2} fill={c} opacity="0.7">
                <animateMotion dur={`${4 + f.strength * 0.3}s`} repeatCount="indefinite" begin={`-${(4 + f.strength * 0.3) / 2}s`} path={d}/>
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ====== LEFT PANEL ======
function LeftPanel({ theme, t, setTweak }) {
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: 14,
      padding: 16, background: theme.panel, borderRight: `1px solid ${theme.border}`,
      overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: `1px solid ${theme.borderSoft}` }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: theme.accent, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{PMIcons.layers}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em' }}>LightFabric</div>
          <div style={{ fontFamily: PM.mono, fontSize: 10, color: theme.dim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Карта производства</div>
        </div>
      </div>

      {/* Live indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', background: theme.bg2, borderRadius: 8,
      }}>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <span style={{
            position: 'absolute', inset: -3, borderRadius: '50%', background: theme.flowOk, opacity: 0.4,
            animation: 'pmPulse 1.6s ease-out infinite',
          }}></span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.flowOk, position: 'relative' }}></span>
        </span>
        <span style={{ fontFamily: PM.mono, fontSize: 11, fontWeight: 700, color: theme.ink, letterSpacing: '0.06em' }}>LIVE</span>
        <span style={{ fontFamily: PM.mono, fontSize: 11, color: theme.dim, marginLeft: 'auto' }}>12.05 · 16:47</span>
      </div>

      {/* Legend */}
      <div>
        <div style={{ fontFamily: PM.mono, fontSize: 10, fontWeight: 700, color: theme.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Цеха
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {WS.filter(w => w.role !== 'stock').map(w => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 0' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: w.hue, flexShrink: 0 }}></span>
              <span style={{ fontSize: 12, color: theme.ink2, fontWeight: 500, flex: 1 }}>{w.name}</span>
              {w.role === 'dispatcher' && (
                <span style={{ fontFamily: PM.mono, fontSize: 9, fontWeight: 700, color: theme.accent, letterSpacing: '0.06em' }}>★</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Flow legend */}
      <div>
        <div style={{ fontFamily: PM.mono, fontSize: 10, fontWeight: 700, color: theme.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Потоки
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { c: theme.flowOk, l: 'Норма', s: '< 80% загрузки' },
            { c: theme.flowWarn, l: 'Внимание', s: 'возможна задержка' },
            { c: theme.flowJam, l: 'Затор', s: 'требует действий' },
          ].map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 18, height: 3, borderRadius: 2, background: it.c, flexShrink: 0 }}></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: theme.ink, fontWeight: 600 }}>{it.l}</div>
                <div style={{ fontSize: 10, color: theme.dim }}>{it.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div>
        <div style={{ fontFamily: PM.mono, fontSize: 10, fontWeight: 700, color: theme.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Фильтр
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: theme.dim, fontWeight: 600, marginBottom: 4, display: 'block' }}>Артикул</label>
          <select style={{
            width: '100%', padding: '8px 10px',
            background: theme.bg2, color: theme.ink,
            border: `1px solid ${theme.border}`, borderRadius: 8,
            fontSize: 12, fontWeight: 500, outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23${theme.dim.replace('#','')}' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 28,
          }}>
            <option>Все артикулы</option>
            <option>112/н Сапоги</option>
            <option>905 Галоши</option>
            <option>022 Сабо</option>
            <option>441 Ботинки</option>
          </select>
        </div>

        <Check label="Показывать брак" sub="0.9% сегодня" checked={true} theme={theme}/>
        <Check label="Показывать застрявшие" sub="нет таких" checked={true} theme={theme}/>
        <Check label="Только моя смена" checked={false} theme={theme}/>
      </div>

      {/* Theme toggle */}
      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${theme.borderSoft}` }}>
        <div style={{ fontFamily: PM.mono, fontSize: 10, fontWeight: 700, color: theme.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Тема
        </div>
        <div style={{ display: 'flex', background: theme.bg2, borderRadius: 8, padding: 3, gap: 2 }}>
          {[
            { v: 'dark',  l: 'Тёмная',   ic: PMIcons.moon },
            { v: 'light', l: 'Светлая',  ic: PMIcons.sun  },
          ].map(opt => (
            <button key={opt.v}
              onClick={() => setTweak('theme', opt.v)}
              style={{
                flex: 1, padding: '7px 8px',
                background: t.theme === opt.v ? theme.panel : 'transparent',
                color: t.theme === opt.v ? theme.ink : theme.dim,
                border: 'none', borderRadius: 6,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                boxShadow: t.theme === opt.v ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
              }}>{opt.ic} {opt.l}</button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Check({ label, sub, checked, theme }) {
  const [on, setOn] = React.useState(checked);
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '6px 0', cursor: 'pointer' }}>
      <span
        onClick={(e) => { e.preventDefault(); setOn(!on); }}
        style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
          background: on ? theme.accent : 'transparent',
          border: `1.5px solid ${on ? theme.accent : theme.border}`,
          color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .12s',
        }}>{on && PMIcons.check}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: theme.ink, fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: theme.dim, marginTop: 1 }}>{sub}</div>}
      </span>
    </label>
  );
}

// ====== RIGHT PANEL ======
function RightPanel({ theme, selected, onClose }) {
  return (
    <aside style={{
      width: 320, flexShrink: 0,
      background: theme.panel, borderLeft: `1px solid ${theme.border}`,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {!selected ? <EmptyRight theme={theme}/> : <SelectedRight ws={selected} theme={theme} onClose={onClose}/>}
    </aside>
  );
}

function EmptyRight({ theme }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ paddingBottom: 12, borderBottom: `1px solid ${theme.borderSoft}` }}>
        <div style={{ fontFamily: PM.mono, fontSize: 10, fontWeight: 700, color: theme.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          Состояние завода
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: theme.ink, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.flowOk }}></span>
          Работает в норме
        </div>
      </div>

      <KPIRow label="Партий в потоке" value="34" sub="всего активных" theme={theme}/>
      <KPIRow label="Средняя загрузка" value="68%" sub="по 7 цехам" theme={theme}/>
      <KPIRow label="Пар выпущено сегодня" value="1\u202F284" sub="+12% к плану" theme={theme} accent/>
      <KPIRow label="Активных бригадиров" value="9" sub="смена № 1" theme={theme}/>

      <div style={{
        padding: 14, background: theme.bg2, border: `1px dashed ${theme.border}`,
        borderRadius: 10, textAlign: 'center', marginTop: 8,
      }}>
        <div style={{ color: theme.dim, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{PMIcons.layers}</div>
        <div style={{ fontSize: 12, color: theme.ink2, fontWeight: 600 }}>Кликните по цеху</div>
        <div style={{ fontSize: 11, color: theme.dim, marginTop: 3, lineHeight: 1.4 }}>
          Откроется детальная карточка с бригадой и партиями в работе
        </div>
      </div>

      {/* Hot zones */}
      <div>
        <div style={{ fontFamily: PM.mono, fontSize: 10, fontWeight: 700, color: theme.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Требует внимания
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { ws: 'mold', txt: 'загрузка 92% — близко к пику',  c: theme.flowJam },
            { ws: 'glue', txt: 'медленный темп · −12% к норме', c: theme.flowWarn },
          ].map((h, i) => {
            const w = wsById(h.ws);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', background: theme.bg2, borderRadius: 8,
                borderLeft: `3px solid ${h.c}`,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, background: `${w.hue}22`, color: w.hue,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{PMIcons[w.icon]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: theme.ink }}>{w.name}</div>
                  <div style={{ fontSize: 10, color: theme.dim }}>{h.txt}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KPIRow({ label, value, sub, theme, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: `1px solid ${theme.borderSoft}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: theme.ink2, fontWeight: 500 }}>{label}</div>
        <div style={{ fontFamily: PM.mono, fontSize: 10, color: theme.dim, marginTop: 1 }}>{sub}</div>
      </div>
      <div style={{
        fontFamily: PM.mono, fontSize: 22, fontWeight: 800,
        color: accent ? theme.accent : theme.ink, letterSpacing: '-0.02em',
      }}>{value}</div>
    </div>
  );
}

function SelectedRight({ ws, theme, onClose }) {
  const status = ws.role === 'sink' ? 'ok' : getStatus(ws.load);
  const statusColor = status === 'jam' ? theme.flowJam : status === 'warn' ? theme.flowWarn : theme.flowOk;
  const statusLabel = status === 'jam' ? 'ЗАТОР' : status === 'warn' ? 'ВНИМАНИЕ' : 'НОРМА';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: 16, borderBottom: `1px solid ${theme.borderSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, background: ws.hue, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{PMIcons[ws.icon]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {ws.role === 'dispatcher' && (
              <div style={{ fontFamily: PM.mono, fontSize: 9, fontWeight: 800, color: theme.accent, letterSpacing: '0.15em', marginBottom: 2 }}>
                ★ DISPATCHER
              </div>
            )}
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{ws.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }}></span>
              <span style={{ fontFamily: PM.mono, fontSize: 10, fontWeight: 700, color: statusColor, letterSpacing: '0.08em' }}>{statusLabel}</span>
              <span style={{ fontFamily: PM.mono, fontSize: 10, color: theme.dim, marginLeft: 4 }}>· смена № 1 · 08:00 — 16:00</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 26, height: 26, border: 'none', background: 'transparent',
            color: theme.dim, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0,
          }}>×</button>
        </div>
      </div>

      {/* Foreman */}
      {ws.foreman && (
        <div style={{ padding: 16, borderBottom: `1px solid ${theme.borderSoft}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', background: theme.bg2, color: ws.hue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 12, fontFamily: PM.mono,
            border: `2px solid ${ws.hue}`,
          }}>{ws.foreman.split(' ')[0][0]}{ws.foreman.split(' ')[1][0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.ink }}>{ws.foreman}</div>
            <div style={{ fontSize: 11, color: theme.dim }}>Бригадир · {ws.people} человек в смене</div>
          </div>
          <span style={{ fontFamily: PM.mono, fontSize: 10, color: theme.flowOk, fontWeight: 700, padding: '3px 7px', background: `${theme.flowOk}1a`, borderRadius: 100 }}>
            ON SHIFT
          </span>
        </div>
      )}

      {/* Load summary */}
      {ws.role !== 'sink' && (
        <div style={{ padding: 16, borderBottom: `1px solid ${theme.borderSoft}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: PM.mono, fontSize: 10, fontWeight: 700, color: theme.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Загрузка</span>
            <span style={{ fontFamily: PM.mono, fontSize: 28, fontWeight: 800, color: statusColor, letterSpacing: '-0.02em' }}>{ws.load}%</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { l: 'В работе', v: ws.batches },
              { l: 'В очереди', v: ws.queue },
              { l: 'Сдано', v: Math.round(ws.batches * 1.8) },
            ].map((m, i) => (
              <div key={i} style={{ padding: '8px 10px', background: theme.bg2, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: theme.dim, fontWeight: 600 }}>{m.l}</div>
                <div style={{ fontFamily: PM.mono, fontSize: 18, fontWeight: 800, color: theme.ink, lineHeight: 1.1, marginTop: 2 }}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch list */}
      {ws.list && (
        <div style={{ padding: 16, borderBottom: `1px solid ${theme.borderSoft}` }}>
          <div style={{ fontFamily: PM.mono, fontSize: 10, fontWeight: 700, color: theme.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Партии в работе
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ws.list.map(b => (
              <div key={b.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', background: theme.bg2, borderRadius: 8,
                borderLeft: `3px solid ${b.status === 'queue' ? theme.soft : ws.hue}`,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: PM.mono, fontSize: 11, fontWeight: 700, color: theme.ink, letterSpacing: '0.02em' }}>{b.id}</div>
                  <div style={{ fontSize: 11, color: theme.ink2 }}>
                    {b.sku} · <span style={{ fontFamily: PM.mono, color: theme.dim }}>{b.qty} пар</span>
                    {b.dest && <> · <span style={{ color: theme.accent }}>→ {b.dest}</span></>}
                  </div>
                </div>
                <span style={{
                  fontFamily: PM.mono, fontSize: 9, fontWeight: 700,
                  color: b.status === 'queue' ? theme.dim : theme.flowOk,
                  letterSpacing: '0.08em',
                }}>
                  {b.status === 'queue' ? 'ОЧЕРЕДЬ' : 'РАБОТА'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: 16 }}>
        <button style={{
          width: '100%', padding: '11px 14px',
          background: theme.accent, color: 'white', border: 'none',
          borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          Открыть подробнее {PMIcons.ext}
        </button>
      </div>
    </div>
  );
}

// ====== EVENT FEED ======
const EVENTS = [
  { t: '16:42', txt: 'ЛИТ-140526-01 принята в Клеевом',  who: 'Азамов К.',        tag: 'accept',  ws: 'glue' },
  { t: '16:38', txt: 'УПК-140526-04 передана в Крой',     who: 'Мангасарян Р.Ю.',  tag: 'move',    ws: 'pack' },
  { t: '16:30', txt: 'Закрыта смена в Швейке',            who: 'Авагимян Н.М. · 24 операции', tag: 'shift-close', ws: 'sew' },
  { t: '16:22', txt: 'Зафиксирован брак: 2 пары 905',     who: 'ОТК · отбор',      tag: 'defect', ws: 'mark', warn: true },
  { t: '16:15', txt: 'ЛИТ-140526-02 завершена',           who: 'Мангасарян Р.Ю.',  tag: 'finish', ws: 'mold' },
  { t: '16:08', txt: 'Маркировка: КРС-1 простой 8 мин',   who: 'Оганджанян А.С.',  tag: 'idle',   ws: 'mark', warn: true },
  { t: '15:54', txt: 'УПК-140526-03 → Маркировка',        who: 'Мангасарян Р.Ю.',  tag: 'move',    ws: 'pack' },
  { t: '15:42', txt: 'Списано ЭВА 124.8 кг',              who: 'Литейка · норматив', tag: 'stock', ws: 'mold' },
  { t: '15:30', txt: 'Принят склад: 96 пар 112/н',        who: 'Хатаян Р.Ю.',      tag: 'wh-in',   ws: 'wh' },
  { t: '15:18', txt: 'СБК-140526-02 передана в Склад',    who: 'Ароян О.Н.',       tag: 'move',    ws: 'hem' },
];
const TAG_LABELS = {
  accept: 'Принято',
  move: 'Передача',
  'shift-close': 'Смена',
  defect: 'Брак',
  finish: 'Завершено',
  idle: 'Простой',
  stock: 'Списание',
  'wh-in': 'Приёмка',
};
const TAG_COLORS = {
  accept: '#10B981', move: '#3D7EFF', 'shift-close': '#8B5CF6', defect: '#EF4444',
  finish: '#10B981', idle: '#F59E0B', stock: '#06B6D4', 'wh-in': '#3B82F6',
};

function EventFeed({ theme }) {
  return (
    <div style={{
      borderTop: `1px solid ${theme.border}`, background: theme.panel,
      padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8,
      maxHeight: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: PM.mono, fontSize: 10, fontWeight: 700, color: theme.dim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Лента событий · реальное время
        </div>
        <span style={{ position: 'relative', width: 6, height: 6, display: 'inline-flex' }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: theme.flowOk }}></span>
          <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', background: theme.flowOk, opacity: 0.3, animation: 'pmPulse 1.6s ease-out infinite' }}></span>
        </span>
        <div style={{ flex: 1 }}></div>
        <div style={{ fontFamily: PM.mono, fontSize: 11, color: theme.dim }}>
          обновлено сейчас · показано {EVENTS.length} из 142
        </div>
      </div>

      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, marginRight: -8, paddingRight: 8 }}>
        {EVENTS.map((e, i) => {
          const ws = wsById(e.ws);
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '6px 8px', borderRadius: 6,
              background: 'transparent',
              transition: 'background-color .12s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e2) => e2.currentTarget.style.background = theme.bg2}
            onMouseLeave={(e2) => e2.currentTarget.style.background = 'transparent'}>
              <span style={{ fontFamily: PM.mono, fontSize: 11, fontWeight: 700, color: theme.dim, minWidth: 40 }}>{e.t}</span>
              <span style={{
                fontFamily: PM.mono, fontSize: 9, fontWeight: 700,
                color: TAG_COLORS[e.tag], background: `${TAG_COLORS[e.tag]}1f`,
                padding: '2px 7px', borderRadius: 4, letterSpacing: '0.06em',
                minWidth: 76, textAlign: 'center',
              }}>{TAG_LABELS[e.tag]}</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 600, color: theme.ink2, minWidth: 110,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: ws.hue, flexShrink: 0 }}></span>
                {ws.name}
              </span>
              <span style={{ fontSize: 12, color: theme.ink, fontWeight: 500, flex: 1 }}>
                {e.txt}
              </span>
              <span style={{ fontSize: 11, color: theme.dim, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {PMIcons.user} {e.who}
              </span>
              {e.warn && <span style={{ color: theme.flowWarn }}>{PMIcons.alert}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ====== HEADER TOP BAR ======
function TopBar({ theme }) {
  return (
    <header style={{
      padding: '12px 20px', borderBottom: `1px solid ${theme.border}`,
      background: theme.panel, display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em' }}>
          Карта производства
        </h1>
        <div style={{ fontFamily: PM.mono, fontSize: 10, color: theme.dim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Light Company
        </div>
      </div>

      <div style={{ flex: 1 }}></div>

      {/* Global KPI strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {[
          { l: 'В потоке', v: '34',    sub: 'партий', tone: 'ink' },
          { l: 'Сегодня',  v: '1 284', sub: 'пар',    tone: 'accent' },
          { l: 'Брак',     v: '0.9%',  sub: 'от объёма', tone: 'warn' },
          { l: 'План',     v: '+12%',  sub: 'к норме',   tone: 'ok' },
        ].map((k, i) => {
          const c = k.tone === 'accent' ? theme.accent
                  : k.tone === 'warn'   ? theme.flowWarn
                  : k.tone === 'ok'     ? theme.flowOk
                  : theme.ink;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderLeft: i ? `1px solid ${theme.borderSoft}` : 'none', paddingLeft: i ? 18 : 0 }}>
              <div style={{ fontFamily: PM.mono, fontSize: 18, fontWeight: 800, color: c, lineHeight: 1, letterSpacing: '-0.02em' }}>{k.v}</div>
              <div style={{ fontFamily: PM.mono, fontSize: 9, color: theme.dim, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                {k.l} · <span style={{ color: theme.ink2 }}>{k.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* User */}
      <div style={{ paddingLeft: 16, borderLeft: `1px solid ${theme.borderSoft}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.ink }}>А. Хачатуров</div>
          <div style={{ fontFamily: PM.mono, fontSize: 10, color: theme.dim }}>Генеральный директор</div>
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: theme.accent, color: 'white',
          fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${theme.accent}`,
        }}>АХ</div>
      </div>
    </header>
  );
}

// ====== MAIN ======
const PMTweakDefaults = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "showDefects": true,
  "showStuck": true
}/*EDITMODE-END*/;

function ProductionMap() {
  const [t, setTweak] = useTweaks(PMTweakDefaults);
  const theme = t.theme === 'light' ? PM.light : PM.dark;
  const [selectedId, setSelectedId] = React.useState('pack');
  const selected = selectedId ? wsById(selectedId) : null;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: theme.bg, color: theme.ink,
      fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <TopBar theme={theme} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <LeftPanel theme={theme} t={t} setTweak={setTweak}/>

        <main style={{
          flex: 1, position: 'relative',
          background: `radial-gradient(ellipse at center, ${theme.bg2} 0%, ${theme.bg} 70%)`,
          minWidth: 0,
          overflow: 'hidden',
        }}>
          {/* Subtle grid */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <pattern id="pmGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke={theme.grid} strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pmGrid)"/>
          </svg>

          {/* Map title strip */}
          <div style={{
            position: 'absolute', top: 14, left: 14,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: theme.panel, border: `1px solid ${theme.border}`,
            padding: '6px 12px', borderRadius: 100, zIndex: 4,
          }}>
            <span style={{ color: theme.accent }}>{PMIcons.layers}</span>
            <span style={{ fontFamily: PM.mono, fontSize: 11, fontWeight: 700, color: theme.ink, letterSpacing: '0.06em' }}>Схема цехов</span>
            <span style={{ fontFamily: PM.mono, fontSize: 10, color: theme.dim }}>9 цехов · 34 партии</span>
          </div>

          {/* Flow lines */}
          <FlowLines theme={theme}/>

          {/* Workshop cards */}
          {WS.map(w => (
            <WorkshopCard
              key={w.id} ws={w} pos={POS[w.id]} theme={theme}
              selected={selectedId === w.id}
              onClick={() => setSelectedId(w.id)}
            />
          ))}

          {/* Branch labels for the right column */}
          <BranchLabel theme={theme} x={71.5} y={18} label="ветка А · сухая"/>
          <BranchLabel theme={theme} x={71.5} y={50} label="ветка Б · клеевая"/>
          <BranchLabel theme={theme} x={71.5} y={82} label="ветка В · текстильная"/>
        </main>

        <RightPanel theme={theme} selected={selected} onClose={() => setSelectedId(null)}/>
      </div>

      <EventFeed theme={theme}/>

      <style>{`
        @keyframes pmPulse { 0% { transform: scale(0.6); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
      `}</style>
    </div>
  );
}

function BranchLabel({ theme, x, y, label }) {
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      transform: 'translate(-50%, calc(-50% - 64px))',
      fontFamily: PM.mono, fontSize: 9, fontWeight: 700, color: theme.dim,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      pointerEvents: 'none',
    }}>{label}</div>
  );
}

window.ProductionMap = ProductionMap;
