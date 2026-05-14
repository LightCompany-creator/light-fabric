// LightFlow — Payroll register (Ведомость зарплаты)

const pIcon = (paths, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);

const PR = {
  brand: '#214A8C', brandDark: '#163566', pale: '#E8EFF8', mist: '#F4F7FC',
  accent: '#F59E0B', success: '#10B981', danger: '#EF4444',
  excel: '#107C41', excelDark: '#0B6033', excelBg: '#E6F4EC',
  ink: '#0F1B2D', ink2: '#344563', dim: '#6B7C93', soft: '#9AABBF',
  border: '#D9E2EE',
  mold: '#EF4444', pack: '#214A8C', glue: '#F59E0B', sew: '#10B981',
  mark: '#06B6D4', cut: '#EC4899', sewing: '#8B5CF6', mech: '#6366F1',
  mono: "'JetBrains Mono', monospace",
  num: { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' },
};

const PIcons = {
  chevL:   pIcon(<polyline points="15 18 9 12 15 6"/>, 14),
  chevR:   pIcon(<polyline points="9 18 15 12 9 6"/>, 14),
  chevD:   pIcon(<polyline points="6 9 12 15 18 9"/>, 14),
  cal:     pIcon(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, 16),
  users:   pIcon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>, 18),
  factory: pIcon(<><path d="M2 20V8l5 4V8l5 4V8l5 4V8l5 4v8z"/><path d="M2 20h20"/><path d="M9 16h2M14 16h2"/></>, 18),
  ruble:   pIcon(<><path d="M6 4h7a4 4 0 0 1 0 8H6"/><line x1="3" y1="12" x2="13" y2="12"/><line x1="6" y1="4" x2="6" y2="20"/><line x1="3" y1="16" x2="11" y2="16"/></>, 18),
  list:    pIcon(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>, 14),
  print:   pIcon(<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>, 14),
  dl:      pIcon(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>, 16),
  excel:   pIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="14" y2="19"/><line x1="14" y1="13" x2="8" y2="19"/></>, 16),
  doc:     pIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>, 16),
  chart:   pIcon(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>, 16),
  send:    pIcon(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>, 16),
  info:    pIcon(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>, 14),
  sort:    pIcon(<><polyline points="7 4 7 20"/><polyline points="11 8 7 4 3 8"/><polyline points="17 4 17 20"/><polyline points="13 16 17 20 21 16"/></>, 11),
  filter:  pIcon(<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>, 14),
  check:   pIcon(<polyline points="20 6 9 17 4 12"/>, 14),
  search:  pIcon(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>, 14),
};

const WS_TONES = {
  'Литейка':  { bg: '#FEE2E2', c: '#991B1B', dot: PR.mold },
  'Упаковка': { bg: PR.pale,   c: PR.brandDark, dot: PR.pack },
  'Клеевой':  { bg: '#FEF3C7', c: '#92400E', dot: PR.glue },
  'Швейка':   { bg: '#EDE9FE', c: '#5B21B6', dot: PR.sewing },
  'Маркировка':{ bg: '#CFFAFE', c: '#155E75', dot: PR.mark },
  'Крой':     { bg: '#FCE7F3', c: '#9D174D', dot: PR.cut },
  'Обшив':    { bg: '#D1FAE5', c: '#065F46', dot: PR.sew },
  'ОТК':      { bg: '#E0E7FF', c: '#3730A3', dot: PR.mech },
  'Склад':    { bg: '#F1F5F9', c: '#475569', dot: '#64748B' },
};

function WSPill({ name }) {
  const t = WS_TONES[name] || WS_TONES['Литейка'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px', background: t.bg, color: t.c,
      borderRadius: 100, fontSize: 11, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot }}></span>
      {name}
    </span>
  );
}

// --- Header ---
function PRHeader() {
  return (
    <header style={{ background: 'white', borderBottom: `1px solid ${PR.border}`, padding: '14px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ color: PR.ink }}>Light</span><span style={{ color: PR.brand }}>Flow</span>
        </div>
        <div style={{ height: 22, width: 1, background: PR.border }}></div>
        <nav style={{ display: 'flex', gap: 4 }}>
          {[
            { label: 'Производство' },
            { label: 'Партии' },
            { label: 'Справочники' },
            { label: 'Зарплата', active: true },
            { label: 'Отчёты' },
            { label: 'Настройки' },
          ].map((t, i) => (
            <button key={i} style={{
              padding: '8px 14px',
              background: t.active ? PR.pale : 'transparent',
              color: t.active ? PR.brand : PR.ink2, border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: t.active ? 700 : 500, cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </nav>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: PR.ink }}>Семенова Т.А.</div>
            <div style={{ fontSize: 11, color: PR.dim }}>Бухгалтер</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: PR.pale, color: PR.brand,
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${PR.brand}`,
          }}>СТ</div>
        </div>
      </div>
    </header>
  );
}

// --- Page title + period selector ---
function TitleRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
      <div>
        <div style={{ ...PR.num, fontSize: 11, color: PR.dim, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          Бухгалтерия
        </div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: PR.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Ведомость заработной платы
        </h1>
        <div style={{ fontSize: 14, color: PR.dim, marginTop: 8 }}>
          ООО «Светлая компания» · сдельная оплата · ставки утверждены 01.01.2026
        </div>
      </div>

      {/* Period selector */}
      <div style={{
        display: 'inline-flex', alignItems: 'center',
        background: 'white', border: `1px solid ${PR.border}`, borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(15,27,45,0.04)',
      }}>
        <button style={periodArrow}>{PIcons.chevL}</button>
        <div style={{ padding: '8px 20px', borderLeft: `1px solid ${PR.border}`, borderRight: `1px solid ${PR.border}`, display: 'flex', alignItems: 'center', gap: 10, minWidth: 230 }}>
          <span style={{ color: PR.brand }}>{PIcons.cal}</span>
          <div>
            <div style={{ ...PR.num, fontSize: 10, color: PR.dim, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Период</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: PR.ink, lineHeight: 1.1 }}>Май&nbsp;2026</div>
          </div>
        </div>
        <button style={periodArrow}>{PIcons.chevR}</button>
      </div>
    </div>
  );
}
const periodArrow = {
  width: 44, height: 44, background: 'white', color: PR.ink2,
  border: 'none', cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center',
};

// --- Summary cards ---
function SummaryRow() {
  const items = [
    { icon: PIcons.ruble,   label: 'Всего к выплате', value: '1\u202F247\u202F850', unit: '₽',  tone: 'brand' },
    { icon: PIcons.users,   label: 'Сотрудников',     value: '42',                  unit: 'чел.' },
    { icon: PIcons.factory, label: 'Цехов',           value: '9',                   unit: '' },
    { icon: PIcons.cal,     label: 'Период',          value: '01.05 — 31.05',       unit: '', sub: '30 рабочих дней', wide: true },
  ];
  return (
    <div className="pr-sum-row" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr', gap: 14, marginBottom: 20 }}>
      {items.map((it, i) => {
        const isBrand = it.tone === 'brand';
        return (
          <div key={i} style={{
            background: isBrand ? PR.brand : 'white',
            color: isBrand ? 'white' : PR.ink,
            border: isBrand ? 'none' : `1px solid ${PR.border}`,
            borderRadius: 12, padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: isBrand ? 'rgba(255,255,255,0.16)' : PR.pale,
              color: isBrand ? 'white' : PR.brand,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>{it.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: isBrand ? 'rgba(255,255,255,0.78)' : PR.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {it.label}
              </div>
              <div style={{ ...PR.num, fontSize: it.wide ? 18 : 24, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span>{it.value}</span>
                {it.unit && <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.75 }}>{it.unit}</span>}
              </div>
              {it.sub && <div style={{ ...PR.num, fontSize: 11, color: isBrand ? 'rgba(255,255,255,0.7)' : PR.dim, marginTop: 4 }}>{it.sub}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Tabs ---
function Tabs() {
  const tabs = [
    { label: 'Сводно по работникам', active: true },
    { label: 'По цехам' },
    { label: 'По датам' },
    { label: 'Детализация по операциям' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: `1px solid ${PR.border}`, marginBottom: 0, padding: '0 4px' }}>
      {tabs.map((t, i) => (
        <button key={i} style={{
          padding: '14px 18px', background: 'transparent', border: 'none',
          borderBottom: t.active ? `2px solid ${PR.brand}` : '2px solid transparent',
          color: t.active ? PR.brand : PR.ink2,
          fontSize: 14, fontWeight: t.active ? 700 : 500, cursor: 'pointer',
          marginBottom: -1,
        }}>{t.label}</button>
      ))}
      <div style={{ flex: 1 }}></div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: PR.soft }}>{PIcons.search}</span>
          <input placeholder="ФИО или таб. №" style={{
            padding: '7px 10px 7px 32px', border: `1px solid ${PR.border}`, borderRadius: 8,
            fontSize: 13, color: PR.ink, outline: 'none', background: PR.mist, width: 200,
          }}/>
        </div>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', background: 'white', color: PR.ink2,
          border: `1px solid ${PR.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>{PIcons.filter} Фильтры</button>
      </div>
    </div>
  );
}

// --- Table ---
function PayrollTable() {
  const rows = [
    { id: '000123', name: 'Иванов А.С.',    ws: 'Литейка',    role: 'Литейщик',        days: 21, pairs: '1\u202F920', sum: '28\u202F800' },
    { id: '000124', name: 'Петров В.И.',    ws: 'Литейка',    role: 'Литейщик',        days: 20, pairs: '1\u202F760', sum: '26\u202F400' },
    { id: '000125', name: 'Сидоров К.А.',   ws: 'Литейка',    role: 'Наладчик',        days: 22, pairs: '—',          sum: '45\u202F100', salary: true },
    { id: '000126', name: 'Кузнецов М.П.',  ws: 'Упаковка',   role: 'Упаковщик',       days: 21, pairs: '4\u202F200', sum: '8\u202F400' },
    { id: '000127', name: 'Морозова Н.В.',  ws: 'Швейка',     role: 'Швея',            days: 20, pairs: '—',          sum: '24\u202F000', salary: true },
    { id: '000128', name: 'Волков С.Е.',    ws: 'Клеевой',    role: 'Клеевщик',        days: 21, pairs: '1\u202F250', sum: '6\u202F250' },
    { id: '000129', name: 'Соколова Е.П.',  ws: 'Маркировка', role: 'Маркировщик',     days: 22, pairs: '5\u202F840', sum: '11\u202F680' },
    { id: '000130', name: 'Лебедев Д.А.',   ws: 'Литейка',    role: 'Литейщик',        days: 19, pairs: '1\u202F520', sum: '22\u202F800' },
    { id: '000131', name: 'Новиков Р.С.',   ws: 'Крой',       role: 'Раскройщик',      days: 21, pairs: '—',          sum: '32\u202F500', salary: true },
    { id: '000132', name: 'Орлова И.К.',    ws: 'Обшив',      role: 'Обшивщик',        days: 22, pairs: '880',        sum: '17\u202F600' },
    { id: '000133', name: 'Тимофеев П.М.',  ws: 'Клеевой',    role: 'Клеевщик',        days: 20, pairs: '1\u202F140', sum: '5\u202F700' },
    { id: '000134', name: 'Захарова О.Л.',  ws: 'ОТК',        role: 'Контролёр ОТК',   days: 21, pairs: '—',          sum: '27\u202F300', salary: true },
    { id: '000135', name: 'Григорьев А.В.', ws: 'Склад',      role: 'Кладовщик',       days: 22, pairs: '—',          sum: '24\u202F200', salary: true },
    { id: '000136', name: 'Беляева Т.С.',   ws: 'Упаковка',   role: 'Упаковщик',       days: 21, pairs: '3\u202F960', sum: '7\u202F920' },
    { id: '000137', name: 'Степанов Н.И.',  ws: 'Швейка',     role: 'Швея',            days: 22, pairs: '—',          sum: '26\u202F400', salary: true },
  ];

  const th = (label, opts = {}) => (
    <th style={{
      textAlign: opts.right ? 'right' : 'left',
      padding: '10px 14px', background: PR.mist, color: PR.brand,
      fontSize: 10, fontWeight: 700, fontFamily: PR.mono, letterSpacing: '0.1em', textTransform: 'uppercase',
      borderBottom: `1px solid ${PR.border}`, whiteSpace: 'nowrap',
      position: 'sticky', top: 0,
    }}>
      {label && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          {label}<span style={{ color: PR.soft }}>{PIcons.sort}</span>
        </span>
      )}
    </th>
  );

  const td = (extra = {}) => ({
    padding: '10px 14px', borderBottom: `1px solid ${PR.border}`,
    fontSize: 13, color: PR.ink, verticalAlign: 'middle', ...extra,
  });

  return (
    <div style={{ background: 'white', border: `1px solid ${PR.border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', maxHeight: 540 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
          <thead>
            <tr>
              {th('Таб. №')}
              {th('ФИО')}
              {th('Цех')}
              {th('Должность')}
              {th('Дней', { right: true })}
              {th('Пар выпуска', { right: true })}
              {th('Сумма, ₽', { right: true })}
              {th('')}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="pr-row" style={{ background: i % 2 ? PR.mist : 'white' }}>
                <td style={td({ fontFamily: PR.mono, color: PR.dim, fontWeight: 600 })}>{r.id}</td>
                <td style={td({ fontWeight: 600 })}>{r.name}</td>
                <td style={td()}><WSPill name={r.ws}/></td>
                <td style={td({ color: PR.ink2 })}>
                  {r.role}
                  {r.salary && <span style={{ ...PR.num, fontSize: 9, color: PR.dim, fontWeight: 700, letterSpacing: '0.08em', marginLeft: 8, padding: '1px 5px', background: PR.mist, borderRadius: 3 }}>ОКЛАД</span>}
                </td>
                <td style={td({ ...PR.num, textAlign: 'right', fontWeight: 600 })}>{r.days}</td>
                <td style={td({ ...PR.num, textAlign: 'right', color: r.pairs === '—' ? PR.soft : PR.ink })}>{r.pairs}</td>
                <td style={td({ ...PR.num, textAlign: 'right', fontWeight: 700, color: PR.ink })}>{r.sum}<span style={{ color: PR.dim, fontWeight: 500, marginLeft: 4 }}>₽</span></td>
                <td style={td({ textAlign: 'right', whiteSpace: 'nowrap' })}>
                  <div className="pr-actions" style={{ display: 'inline-flex', gap: 4 }}>
                    <button style={iconBtn} title="Детализация">{PIcons.list}</button>
                    <button style={iconBtn} title="В печать">{PIcons.print}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {/* Totals */}
          <tfoot>
            <tr style={{ background: PR.brand, color: 'white' }}>
              <td colSpan={2} style={{ padding: '14px 14px', fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>ИТОГО</td>
              <td colSpan={2} style={{ padding: '14px 14px', fontSize: 13, fontWeight: 600 }}>9 цехов · 42 чел.</td>
              <td style={{ padding: '14px 14px', ...PR.num, textAlign: 'right', fontWeight: 700 }}>30</td>
              <td style={{ padding: '14px 14px', ...PR.num, textAlign: 'right', fontWeight: 700 }}>38&nbsp;420</td>
              <td style={{ padding: '14px 14px', ...PR.num, textAlign: 'right', fontWeight: 800, fontSize: 16 }}>1&nbsp;247&nbsp;850<span style={{ fontWeight: 600, marginLeft: 4, opacity: 0.8 }}>₽</span></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
const iconBtn = {
  width: 28, height: 28, borderRadius: 7, border: `1px solid ${PR.border}`,
  background: 'white', color: PR.ink2, display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

// --- Right panel ---
function ActionPanel() {
  return (
    <aside style={{
      width: 280, flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: 12,
      position: 'sticky', top: 16, alignSelf: 'flex-start',
    }}>
      <div style={{ background: 'white', border: `1px solid ${PR.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ ...PR.num, fontSize: 10, fontWeight: 700, color: PR.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Действия
        </div>

        {/* Primary action */}
        <button style={{
          width: '100%', padding: '14px 16px', background: PR.brand, color: 'white', border: 'none',
          borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
          boxShadow: '0 4px 14px rgba(33,74,140,0.25)',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{PIcons.send} Сформировать ведомость</div>
          <div style={{ marginTop: 6, fontSize: 11, fontWeight: 400, opacity: 0.85, lineHeight: 1.4 }}>
            Создаёт записи в системе для дальнейшей выгрузки
          </div>
        </button>

        {/* Excel export — highlighted */}
        <button style={{
          width: '100%', marginTop: 10,
          padding: '14px 16px', background: PR.excelBg, color: PR.excelDark,
          border: `2px solid ${PR.excel}55`,
          borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 24, height: 24, borderRadius: 5, background: PR.excel, color: 'white',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: PR.mono, fontWeight: 800, fontSize: 11,
              }}>X</span>
              Экспорт в Excel для 1С
            </span>
            <span style={{ color: PR.excel }}>{PIcons.dl}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, fontWeight: 500, color: PR.excelDark, opacity: 0.85, lineHeight: 1.4 }}>
            Формат, согласованный с 1С Бухгалтерия 8.3
          </div>
        </button>

        <div style={{ height: 1, background: PR.border, margin: '14px 0' }}></div>

        {/* Secondary */}
        <button style={secondaryAction}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{PIcons.print} Печать ведомости</span>
        </button>
        <button style={{ ...secondaryAction, marginTop: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{PIcons.chart} Отчёт по цехам</span>
        </button>
      </div>

      {/* Status */}
      <div style={{
        background: PR.mist, border: `1px solid ${PR.border}`, borderRadius: 12, padding: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: PR.accent }}></span>
          <span style={{ ...PR.num, fontSize: 10, fontWeight: 700, color: PR.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Статус ведомости
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: PR.ink, marginBottom: 4 }}>
          Черновик
        </div>
        <div style={{ fontSize: 12, color: PR.dim, lineHeight: 1.5 }}>
          Не выгружена. Проверьте суммы и сформируйте перед выгрузкой в 1С.
        </div>
      </div>
    </aside>
  );
}
const secondaryAction = {
  width: '100%', padding: '11px 14px', background: 'white', color: PR.ink2,
  border: `1px solid ${PR.border}`, borderRadius: 10,
  fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};

// --- Footer info ---
function FooterInfo() {
  return (
    <div style={{
      marginTop: 22, padding: '14px 18px',
      background: 'white', border: `1px solid ${PR.border}`, borderRadius: 12,
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: PR.excelBg, color: PR.excelDark,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{PIcons.doc}</div>
      <div style={{ flex: 1, minWidth: 240, fontSize: 13, color: PR.ink2 }}>
        <span style={{ color: PR.dim }}>Последняя выгрузка в 1С: </span>
        <span style={{ ...PR.num, fontWeight: 700, color: PR.ink }}>30.04.2026 · 17:42</span>
        <span style={{ color: PR.dim }}> · бухгалтер </span>
        <span style={{ fontWeight: 600, color: PR.ink }}>Семенова Т.А.</span>
        <span style={{ color: PR.dim }}> · файл </span>
        <span style={{ ...PR.num, color: PR.excelDark, fontWeight: 600 }}>vedomost_2026_04.xlsx</span>
      </div>
      <button style={{
        padding: '8px 14px', background: 'white', color: PR.brand,
        border: `1px solid ${PR.border}`, borderRadius: 8,
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}>История выгрузок →</button>
    </div>
  );
}

// --- Main ---
function PayrollScreen() {
  return (
    <div style={{ minHeight: '100%', background: PR.mist, fontFamily: "'Inter', system-ui, sans-serif", color: PR.ink }}>
      <PRHeader />
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 28px 40px' }}>
        <TitleRow />
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SummaryRow />
            <Tabs />
            <PayrollTable />
            <FooterInfo />
          </div>
          <ActionPanel />
        </div>
      </main>
    </div>
  );
}

window.PayrollScreen = PayrollScreen;
