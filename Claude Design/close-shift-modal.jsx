// LightFlow — Close Shift modal (Закрытие смены · Литейка)

const CS = {
  brand: '#214A8C', brandDark: '#163566', pale: '#E8EFF8', mist: '#F4F7FC',
  amber: '#F59E0B', amberDark: '#B45309', amberBg: '#FEF3C7', amberBorder: '#FDE68A',
  success: '#10B981', successDark: '#065F46', successBg: '#D1FAE5',
  danger: '#EF4444', dangerBg: '#FEE2E2',
  ink: '#0F1B2D', ink2: '#344563', dim: '#6B7C93', soft: '#9AABBF',
  border: '#D9E2EE', borderSoft: '#E6ECF4',
  mono: "'JetBrains Mono', monospace",
  num: { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' },
};

const ic = (paths, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const CSIcons = {
  close: ic(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, 20),
  check: ic(<polyline points="20 6 9 17 4 12"/>, 14),
  warn:  ic(<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, 18),
  alert: ic(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>, 16),
  box:   ic(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>, 16),
  arrow: ic(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>, 14),
  pkg:   ic(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>, 16),
  user:  ic(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>, 14),
  scale: ic(<><line x1="6" y1="3" x2="6" y2="21"/><polyline points="6 8 18 8 22 14 14 14"/><polyline points="6 8 2 14 10 14"/></>, 16),
  bug:   ic(<><circle cx="12" cy="13" r="6"/><path d="M9 9l-2-2M15 9l2-2M9 19l-2 2M15 19l2 2M3 13h3M18 13h3M12 5V3"/></>, 16),
  weight:ic(<><path d="M6.5 6.5h11l1.5 12.5h-14z"/><circle cx="12" cy="4" r="2"/></>, 16),
  ruble: ic(<><path d="M6 4h7a4 4 0 0 1 0 8H6"/><line x1="3" y1="12" x2="13" y2="12"/><line x1="6" y1="4" x2="6" y2="20"/><line x1="3" y1="16" x2="11" y2="16"/></>, 16),
  clock: ic(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, 14),
  lock:  ic(<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>, 14),
  info:  ic(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>, 14),
};

// ---- Section header ----
function SectionHeader({ num, title, sub, color = CS.brand, icon, tone }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 8,
        background: tone === 'success' ? CS.successBg : tone === 'amber' ? CS.amberBg : CS.pale,
        color: tone === 'success' ? CS.successDark : tone === 'amber' ? CS.amberDark : CS.brand,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: CS.mono, fontWeight: 800, fontSize: 12,
      }}>{num}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: CS.ink, letterSpacing: '-0.01em' }}>{title}</h3>
        {sub && <span style={{ fontSize: 12, color: CS.dim }}>{sub}</span>}
      </div>
    </div>
  );
}

// ---- Block 1: Production summary ----
function ProductionSummary() {
  const items = [
    { icon: CSIcons.pkg,    label: 'Всего пар',  value: '312', unit: 'пар', tone: 'brand' },
    { icon: CSIcons.weight, label: 'Общий вес',  value: '128', unit: 'кг' },
    { icon: CSIcons.bug,    label: 'Брак',       value: '3',   unit: 'пары', extra: '0.9% от выпуска', tone: 'soft-danger' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {items.map((it, i) => {
        const isBrand = it.tone === 'brand';
        const isDanger = it.tone === 'soft-danger';
        return (
          <div key={i} style={{
            background: isBrand ? CS.brand : 'white',
            color: isBrand ? 'white' : CS.ink,
            border: isBrand ? 'none' : `1px solid ${CS.border}`,
            borderRadius: 12, padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                width: 28, height: 28, borderRadius: 7,
                background: isBrand ? 'rgba(255,255,255,0.18)' : isDanger ? CS.dangerBg : CS.pale,
                color: isBrand ? 'white' : isDanger ? CS.danger : CS.brand,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{it.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: isBrand ? 'rgba(255,255,255,0.78)' : CS.dim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {it.label}
              </span>
            </div>
            <div style={{ ...CS.num, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>{it.value}</span>
              <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.7 }}>{it.unit}</span>
            </div>
            {it.extra && (
              <div style={{ ...CS.num, marginTop: 6, fontSize: 11, color: isDanger ? CS.danger : (isBrand ? 'rgba(255,255,255,0.7)' : CS.dim), fontWeight: 600 }}>
                {it.extra}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Block 2: Batches to be created ----
function BatchesBlock() {
  const batches = [
    { id: 'ЛИТ-120526-01', sku: '112/н', name: 'Сапоги',   qty: 96,  next: 'Клеевой',     hue: '#F59E0B' },
    { id: 'ЛИТ-120526-02', sku: '905',   name: 'Галоши',   qty: 144, next: 'Маркировка',  hue: '#06B6D4' },
    { id: 'ЛИТ-120526-03', sku: '022',   name: 'Сабо',     qty: 72,  next: 'Маркировка',  hue: '#8B5CF6' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {batches.map((b, i) => (
        <div key={b.id} style={{
          background: 'white', border: `1px solid ${CS.border}`, borderRadius: 10,
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ width: 4, height: 38, borderRadius: 2, background: b.hue, flexShrink: 0 }}></div>
          <div style={{ ...CS.num, fontSize: 12, fontWeight: 700, color: CS.ink, letterSpacing: '0.02em', minWidth: 132 }}>
            {b.id}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flex: 1, minWidth: 0 }}>
            <span style={{ ...CS.num, fontSize: 12, fontWeight: 700, color: CS.brand, background: CS.pale, padding: '2px 7px', borderRadius: 4 }}>{b.sku}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: CS.ink }}>{b.name}</span>
          </div>
          <div style={{ ...CS.num, fontSize: 13, fontWeight: 700, color: CS.ink, whiteSpace: 'nowrap' }}>
            {b.qty} <span style={{ fontWeight: 500, color: CS.dim }}>пар</span>
          </div>
          <div style={{ color: CS.soft, display: 'inline-flex' }}>{CSIcons.arrow}</div>
          <div style={{
            fontSize: 12, fontWeight: 600, color: CS.ink2,
            background: CS.mist, padding: '5px 10px', borderRadius: 100, whiteSpace: 'nowrap',
            minWidth: 110, textAlign: 'center',
          }}>
            {b.next}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Block 3: Materials ----
function MaterialsBlock() {
  const mats = [
    { name: 'ЭВА базовые гранулы',  unit: 'кг', used: '124.8', before: '5\u202F000.0', after: '4\u202F875.2' },
    { name: 'Краситель чёрный',     unit: 'кг', used: '0.8',   before: '42.5',           after: '41.7' },
    { name: 'Краситель синий',      unit: 'кг', used: '0.4',   before: '28.0',           after: '27.6' },
  ];
  const th = (label, align = 'left') => (
    <th style={{
      padding: '8px 14px', textAlign: align,
      fontSize: 10, fontWeight: 700, color: CS.dim, fontFamily: CS.mono,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      borderBottom: `1px solid ${CS.borderSoft}`,
      background: CS.mist,
    }}>{label}</th>
  );
  return (
    <div style={{ background: 'white', border: `1px solid ${CS.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {th('Материал')}
            {th('Списание', 'right')}
            {th('Было', 'right')}
            {th('', 'center')}
            {th('Станет', 'right')}
          </tr>
        </thead>
        <tbody>
          {mats.map((m, i) => (
            <tr key={i} style={{ borderTop: i === 0 ? 'none' : `1px solid ${CS.borderSoft}` }}>
              <td style={{ padding: '12px 14px', fontSize: 13, color: CS.ink, fontWeight: 500 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: i === 0 ? '#94A3B8' : i === 1 ? '#0F1B2D' : '#214A8C' }}></span>
                  {m.name}
                </span>
              </td>
              <td style={{ ...CS.num, padding: '12px 14px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: CS.danger }}>
                −{m.used} <span style={{ color: CS.dim, fontWeight: 500 }}>{m.unit}</span>
              </td>
              <td style={{ ...CS.num, padding: '12px 14px', textAlign: 'right', fontSize: 12, color: CS.dim }}>
                {m.before}
              </td>
              <td style={{ padding: '12px 8px', color: CS.soft, textAlign: 'center' }}>{CSIcons.arrow}</td>
              <td style={{ ...CS.num, padding: '12px 14px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: CS.ink }}>
                {m.after} <span style={{ color: CS.dim, fontWeight: 500 }}>{m.unit}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Block 4: Payroll ----
function PayrollBlock() {
  const rows = [
    { name: 'Иванов А.С.',   op: 'Литьё',   sku: '112/н', qty: 96,  rate: 15,   sum: '1\u202F440' },
    { name: 'Петров В.И.',   op: 'Литьё',   sku: '905',   qty: 144, rate: 4,    sum: '576' },
    { name: 'Сидоров К.А.',  op: 'Наладка', sku: null,    qty: 2,   rate: 1100, sum: '2\u202F200', special: 'машин × смена' },
    { name: 'Кузнецов М.П.', op: 'Литьё',   sku: '022',   qty: 72,  rate: 4,    sum: '288' },
  ];
  return (
    <div style={{ background: 'white', border: `1px solid ${CS.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 0.7fr 1fr 0.6fr 1fr',
          alignItems: 'center', gap: 12,
          padding: '12px 16px',
          borderTop: i === 0 ? 'none' : `1px solid ${CS.borderSoft}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: CS.pale, color: CS.brand,
              fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{r.name.split(' ')[0][0]}{r.name.split(' ')[1][0]}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: CS.ink }}>{r.name}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: CS.ink2 }}>
            {r.op}
            {r.sku && <span style={{ ...CS.num, marginLeft: 6, padding: '1px 6px', background: CS.mist, color: CS.brand, borderRadius: 4, fontSize: 11 }}>{r.sku}</span>}
          </div>
          <div style={{ ...CS.num, fontSize: 12, color: CS.dim, textAlign: 'right' }}>
            {r.special
              ? <>{r.qty} {r.special}</>
              : <>{r.qty} <span style={{ color: CS.soft }}>пар</span> × {r.rate}<span style={{ color: CS.soft }}>&thinsp;₽</span></>}
          </div>
          <div style={{ color: CS.soft, textAlign: 'center' }}>=</div>
          <div style={{ ...CS.num, fontSize: 15, fontWeight: 800, color: CS.ink, textAlign: 'right' }}>
            {r.sum} <span style={{ color: CS.dim, fontWeight: 500 }}>₽</span>
          </div>
        </div>
      ))}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.4fr 0.7fr 1fr 0.6fr 1fr',
        gap: 12, alignItems: 'center',
        padding: '14px 16px', background: CS.brand, color: 'white',
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Итого по смене
        </div>
        <div></div>
        <div style={{ ...CS.num, fontSize: 11, opacity: 0.8, textAlign: 'right' }}>4 чел.</div>
        <div style={{ textAlign: 'center', opacity: 0.6 }}>=</div>
        <div style={{ ...CS.num, fontSize: 20, fontWeight: 800, textAlign: 'right', letterSpacing: '-0.02em' }}>
          4&nbsp;504 <span style={{ fontWeight: 600, opacity: 0.8 }}>₽</span>
        </div>
      </div>
    </div>
  );
}

// ---- Block 5: Warning ----
function WarningBlock() {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      background: CS.amberBg, border: `1px solid ${CS.amberBorder}`, borderRadius: 12, padding: '14px 18px',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: CS.amber, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{CSIcons.warn}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: CS.amberDark, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
          Внимание · требует комментария
        </div>
        <div style={{ fontSize: 14, color: CS.ink, fontWeight: 500, lineHeight: 1.5 }}>
          Машина <span style={{ ...CS.num, fontWeight: 700 }}>ИЛМ-3</span> простаивала <span style={{ ...CS.num, fontWeight: 700 }}>30&nbsp;мин</span> (14:20–14:50). Укажите причину для отчёта по эффективности.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button style={{
          padding: '8px 14px', background: CS.amber, color: 'white', border: 'none',
          borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>Указать причину</button>
        <button style={{
          padding: '8px 14px', background: 'transparent', color: CS.amberDark,
          border: `1px solid ${CS.amberBorder}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Пропустить</button>
      </div>
    </div>
  );
}

// ---- Backdrop context (foundry foreman screen behind modal) ----
function BackdropContext() {
  return (
    <div style={{ minHeight: '100vh', background: CS.mist, fontFamily: "'Inter', system-ui, sans-serif", padding: 28, color: CS.ink }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}><span>Light</span><span style={{ color: CS.brand }}>Flow</span></div>
        <div style={{ height: 18, width: 1, background: CS.border }}></div>
        <div style={{ fontSize: 13, color: CS.dim }}>Бригадир · Литейка · смена 12 мая 2026</div>
      </div>
      <div style={{ height: 12, width: 240, background: '#E2E8F0', borderRadius: 4, marginBottom: 18 }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ background: 'white', border: `1px solid ${CS.border}`, borderRadius: 12, padding: 16, height: 90 }}></div>
        ))}
      </div>
      <div style={{ background: 'white', border: `1px solid ${CS.border}`, borderRadius: 12, padding: 16, height: 420 }}></div>
    </div>
  );
}

// ---- Main modal ----
function CloseShiftModal() {
  const [confirming, setConfirming] = React.useState(false);

  return (
    <>
      <BackdropContext />
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.55)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        zIndex: 50, animation: 'csFade 200ms ease-out',
      }}>
        <div style={{
          width: '100%', maxWidth: 880, maxHeight: 'calc(100vh - 48px)',
          background: 'white', borderRadius: 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(15,27,45,0.4), 0 0 0 1px rgba(15,27,45,0.05)',
          animation: 'csRise 220ms cubic-bezier(.2,.7,.3,1)',
        }}>
          {/* Header */}
          <header style={{
            padding: '20px 28px 18px',
            borderBottom: `1px solid ${CS.border}`,
            display: 'flex', alignItems: 'flex-start', gap: 16,
            background: 'white',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: CS.amberBg, color: CS.amberDark,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{CSIcons.lock}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: CS.ink, letterSpacing: '-0.02em' }}>
                  Закрытие смены
                </h2>
                <span style={{ ...CS.num, fontSize: 12, fontWeight: 600, color: CS.brand, background: CS.pale, padding: '3px 10px', borderRadius: 100 }}>
                  Литейка
                </span>
                <span style={{ ...CS.num, fontSize: 12, fontWeight: 600, color: CS.dim }}>
                  12 мая 2026 · 1-я смена
                </span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: CS.ink2 }}>
                <span style={{ color: CS.amber, display: 'inline-flex' }}>{CSIcons.alert}</span>
                Проверьте данные перед закрытием. После закрытия изменения <strong style={{ color: CS.ink }}>невозможны</strong>.
              </div>
            </div>
            <button aria-label="Закрыть" style={{
              width: 34, height: 34, border: `1px solid ${CS.border}`, background: 'white',
              borderRadius: 8, cursor: 'pointer', color: CS.ink2,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>{CSIcons.close}</button>
          </header>

          {/* Scrollable body */}
          <div style={{ overflowY: 'auto', padding: '22px 28px', background: CS.mist, flex: 1 }}>
            {/* Foreman / brigade strip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22,
              background: 'white', border: `1px solid ${CS.border}`, borderRadius: 10, padding: '10px 14px',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: CS.brand, color: 'white', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>СК</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: CS.ink }}>Сидоров К.А. · бригадир</div>
                <div style={{ ...CS.num, fontSize: 11, color: CS.dim }}>Бригада 4 чел. · машины: ИЛМ-1, ИЛМ-2, ИЛМ-3</div>
              </div>
              <div style={{ ...CS.num, fontSize: 11, fontWeight: 700, color: CS.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>СМЕНА</div>
              <div style={{ ...CS.num, fontSize: 14, fontWeight: 700, color: CS.ink, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: CS.brand }}>{CSIcons.clock}</span> 08:00 — 16:00
              </div>
            </div>

            {/* Block 1 */}
            <section style={{ marginBottom: 24 }}>
              <SectionHeader num="1" title="Сводка по выпуску" />
              <ProductionSummary />
            </section>

            {/* Block 2 */}
            <section style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: CS.successBg, color: CS.successDark,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: CS.mono, fontWeight: 800, fontSize: 12,
                }}>2</div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: CS.ink }}>
                  <span style={{ color: CS.success, marginRight: 6, display: 'inline-flex', verticalAlign: 'text-bottom' }}>{CSIcons.check}</span>
                  Будут созданы партии
                </h3>
                <span style={{
                  ...CS.num, fontSize: 11, fontWeight: 700, color: CS.successDark,
                  background: CS.successBg, padding: '2px 8px', borderRadius: 100,
                }}>3 шт</span>
              </div>
              <BatchesBlock />
            </section>

            {/* Block 3 */}
            <section style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, background: CS.pale, color: CS.brand,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: CS.mono, fontWeight: 800, fontSize: 12,
                }}>3</div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: CS.ink }}>
                  <span style={{ color: CS.brand, marginRight: 6, display: 'inline-flex', verticalAlign: 'text-bottom' }}>{CSIcons.box}</span>
                  Списание материалов <span style={{ fontSize: 12, fontWeight: 500, color: CS.dim }}>(по нормативу)</span>
                </h3>
              </div>
              <MaterialsBlock />
            </section>

            {/* Block 4 */}
            <section style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, background: CS.pale, color: CS.brand,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: CS.mono, fontWeight: 800, fontSize: 12,
                }}>4</div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: CS.ink }}>
                  <span style={{ color: CS.brand, marginRight: 6, display: 'inline-flex', verticalAlign: 'text-bottom' }}>{CSIcons.ruble}</span>
                  Расчёт зарплаты по работникам
                </h3>
              </div>
              <PayrollBlock />
            </section>

            {/* Block 5 — warning */}
            <section style={{ marginBottom: 6 }}>
              <WarningBlock />
            </section>
          </div>

          {/* Footer */}
          <footer style={{
            padding: '16px 28px', background: 'white',
            borderTop: `1px solid ${CS.border}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {!confirming ? (
              <>
                <div style={{ fontSize: 12, color: CS.dim, flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: CS.soft }}>{CSIcons.info}</span>
                  Проверено: <strong style={{ color: CS.ink, ...CS.num }}>4&nbsp;504 ₽</strong> · 3 партии · 312 пар
                </div>
                <button style={btnSecondary}>Отмена</button>
                <button
                  onClick={() => setConfirming(true)}
                  style={btnPrimary}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {CSIcons.lock} Закрыть смену
                  </span>
                </button>
              </>
            ) : (
              <>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: CS.amber, display: 'inline-flex' }}>{CSIcons.alert}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: CS.ink }}>
                      Точно закрыть смену?
                    </div>
                    <div style={{ fontSize: 12, color: CS.dim }}>
                      Это действие <strong style={{ color: CS.amberDark }}>необратимо</strong>. Будут созданы партии и записи в ЗП.
                    </div>
                  </div>
                </div>
                <button style={btnSecondary} onClick={() => setConfirming(false)}>Назад</button>
                <button style={{ ...btnPrimary, background: CS.amberDark }}>
                  Да, закрыть смену
                </button>
              </>
            )}
          </footer>
        </div>
      </div>

      <style>{`
        @keyframes csFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes csRise { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </>
  );
}

const btnSecondary = {
  padding: '11px 18px', background: 'white', color: CS.ink2,
  border: `1px solid ${CS.border}`, borderRadius: 10,
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
};
const btnPrimary = {
  padding: '13px 22px', background: CS.amber, color: 'white',
  border: 'none', borderRadius: 10,
  fontSize: 15, fontWeight: 800, cursor: 'pointer',
  boxShadow: '0 6px 18px rgba(245,158,11,0.35)',
  letterSpacing: '-0.005em',
};

window.CloseShiftModal = CloseShiftModal;
