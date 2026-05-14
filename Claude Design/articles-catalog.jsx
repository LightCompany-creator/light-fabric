// LightFlow — Articles catalog (Справочник артикулов)

const aIcon = (paths, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);

const AC = {
  brand: '#214A8C', brandDark: '#163566', pale: '#E8EFF8', mist: '#F4F7FC',
  accent: '#F59E0B', success: '#10B981', danger: '#EF4444',
  violet: '#8B5CF6', cyan: '#06B6D4', rose: '#EC4899',
  ink: '#0F1B2D', ink2: '#344563', dim: '#6B7C93', soft: '#9AABBF',
  border: '#D9E2EE',
  mono: "'JetBrains Mono', monospace",
  num: { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' },
};

const ACIcons = {
  search:   aIcon(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>, 16),
  plus:     aIcon(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, 18),
  upload:   aIcon(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>, 16),
  edit:     aIcon(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>, 15),
  copy:     aIcon(<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>, 15),
  eye:      aIcon(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>, 15),
  sort:     aIcon(<><polyline points="7 4 7 20"/><polyline points="11 8 7 4 3 8"/><polyline points="17 4 17 20"/><polyline points="13 16 17 20 21 16"/></>, 12),
  chevL:    aIcon(<polyline points="15 18 9 12 15 6"/>, 14),
  chevR:    aIcon(<polyline points="9 18 15 12 9 6"/>, 14),
  chevD:    aIcon(<polyline points="6 9 12 15 18 9"/>, 14),
  reset:    aIcon(<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></>, 14),
};

// Workshop colors map
const WS_TONES = {
  Лит: { bg: '#FEE2E2', c: '#991B1B', dot: '#EF4444' },
  Уп:  { bg: AC.pale,   c: AC.brandDark, dot: AC.brand },
  Кл:  { bg: '#FEF3C7', c: '#92400E', dot: AC.accent },
  Об:  { bg: '#EDE9FE', c: '#5B21B6', dot: AC.violet },
  Мрк: { bg: '#CFFAFE', c: '#155E75', dot: AC.cyan },
  Кр:  { bg: '#FCE7F3', c: '#9D174D', dot: AC.rose },
  Шв:  { bg: '#D1FAE5', c: '#065F46', dot: AC.success },
};
const MATERIAL_TONES = {
  'ЭВА':     { bg: '#D1FAE5', c: '#065F46' },
  'ПВХ':     { bg: '#DBEAFE', c: '#1E40AF' },
  'Силикон': { bg: '#F3E8FF', c: '#6B21A8' },
  'Текстиль':{ bg: '#FEF3C7', c: '#92400E' },
};

// --- Header ---
function ACHeader() {
  return (
    <header style={{ background: 'white', borderBottom: `1px solid ${AC.border}`, padding: '14px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ color: AC.ink }}>Light</span><span style={{ color: AC.brand }}>Flow</span>
        </div>
        <div style={{ height: 22, width: 1, background: AC.border }}></div>
        <nav style={{ display: 'flex', gap: 4 }}>
          {[
            { label: 'Производство' },
            { label: 'Партии' },
            { label: 'Справочники', active: true },
            { label: 'Отчёты' },
            { label: 'Настройки' },
          ].map((t, i) => (
            <button key={i} style={{
              padding: '8px 14px', background: t.active ? AC.pale : 'transparent',
              color: t.active ? AC.brand : AC.ink2, border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: t.active ? 700 : 500, cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </nav>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: AC.ink }}>Кравцова Т.Н.</div>
            <div style={{ fontSize: 11, color: AC.dim }}>Технолог</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: AC.pale, color: AC.brand,
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${AC.brand}`,
          }}>КТ</div>
        </div>
      </div>
    </header>
  );
}

// --- Sub-header / page title ---
function PageTitle() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
      <div>
        <div style={{ ...AC.num, fontSize: 11, color: AC.dim, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          Справочник
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: AC.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Артикулы продукции
        </h1>
        <div style={{ fontSize: 14, color: AC.dim, marginTop: 8 }}>
          <span style={{ ...AC.num, fontWeight: 700, color: AC.ink }}>350+</span> моделей
          <span style={{ margin: '0 8px', color: AC.soft }}>·</span>
          Каталог Light Company
          <span style={{ margin: '0 8px', color: AC.soft }}>·</span>
          обновлён 09.05.2026
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 18px', background: 'white', color: AC.ink2,
          border: `1px solid ${AC.border}`, borderRadius: 10,
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>{ACIcons.upload} Импорт из Excel</button>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 20px', background: AC.brand, color: 'white',
          border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(33,74,140,0.25)',
        }}>{ACIcons.plus} Новый артикул</button>
      </div>
    </div>
  );
}

// --- Filter panel ---
function FilterPanel() {
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'white', border: `1px solid ${AC.border}`, borderRadius: 12,
      padding: 18, alignSelf: 'flex-start', position: 'sticky', top: 16,
    }}>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: AC.soft }}>
          {ACIcons.search}
        </span>
        <input placeholder="Код или название…" style={{
          width: '100%', padding: '10px 12px 10px 38px',
          border: `1px solid ${AC.border}`, borderRadius: 10,
          fontSize: 14, color: AC.ink, outline: 'none', background: AC.mist,
          fontFamily: "'Inter', sans-serif",
        }}/>
      </div>

      <FilterGroup title="Материал">
        {[
          { label: 'ЭВА', count: 312, checked: true,  tone: 'ЭВА' },
          { label: 'ПВХ', count: 22,  checked: false, tone: 'ПВХ' },
          { label: 'Силикон', count: 8, checked: false, tone: 'Силикон' },
          { label: 'Текстиль', count: 4, checked: false, tone: 'Текстиль' },
        ].map((m, i) => (
          <Checkbox key={i} label={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: MATERIAL_TONES[m.tone].c,
              }}></span>
              {m.label}
            </span>
          } count={m.count} checked={m.checked}/>
        ))}
      </FilterGroup>

      <FilterGroup title="Тип маршрута">
        {[
          { label: 'Простой',  desc: 'галоши, сабо',        checked: false },
          { label: 'Средний',  desc: 'сапоги',              checked: true  },
          { label: 'Сложный',  desc: 'с манжетом, Аляски',  checked: false },
        ].map((r, i) => <Radio key={i} {...r}/>)}
      </FilterGroup>

      <FilterGroup title="В коробке">
        <div style={{ padding: '4px 4px 0' }}>
          <input type="range" min="1" max="12" defaultValue="8" style={{ width: '100%', accentColor: AC.brand }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', ...AC.num, fontSize: 11, color: AC.dim, marginTop: 4 }}>
            <span>1</span><span style={{ color: AC.brand, fontWeight: 700 }}>8 пар</span><span>12</span>
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title="Цена опт, ₽">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 6, alignItems: 'center' }}>
          <input placeholder="от" defaultValue="200" style={miniInput}/>
          <span style={{ color: AC.soft, ...AC.num }}>—</span>
          <input placeholder="до" defaultValue="1200" style={miniInput}/>
        </div>
      </FilterGroup>

      <button style={{
        marginTop: 4, width: '100%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 12px', background: 'transparent', color: AC.dim,
        border: `1px dashed ${AC.border}`, borderRadius: 10,
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}>{ACIcons.reset} Сбросить фильтры</button>
    </aside>
  );
}
const miniInput = {
  width: '100%', padding: '8px 10px', border: `1px solid ${AC.border}`, borderRadius: 8,
  fontSize: 13, ...AC.num, textAlign: 'center', outline: 'none', background: 'white',
};

function FilterGroup({ title, children }) {
  return (
    <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${AC.mist}` }}>
      <div style={{
        ...AC.num, fontSize: 10, fontWeight: 700, color: AC.dim,
        letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10,
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{children}</div>
    </div>
  );
}
function Checkbox({ label, count, checked }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: AC.ink, cursor: 'pointer' }}>
      <span style={{
        width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked ? AC.brand : AC.border}`,
        background: checked ? AC.brand : 'white', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ ...AC.num, fontSize: 11, color: AC.soft }}>{count}</span>
    </label>
  );
}
function Radio({ label, desc, checked }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, cursor: 'pointer' }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${checked ? AC.brand : AC.border}`,
        background: 'white', flexShrink: 0, marginTop: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <span style={{ width: 8, height: 8, borderRadius: '50%', background: AC.brand }}></span>}
      </span>
      <span style={{ flex: 1 }}>
        <div style={{ color: AC.ink, fontWeight: checked ? 600 : 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: AC.dim, marginTop: 1 }}>{desc}</div>
      </span>
    </label>
  );
}

// --- Route chain mini ---
function RouteChain({ steps }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {steps.map((s, i) => {
        const t = WS_TONES[s] || WS_TONES['Лит'];
        return (
          <React.Fragment key={i}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 30, height: 22, padding: '0 6px',
              background: t.bg, color: t.c,
              border: `1px solid ${t.dot}44`, borderRadius: 5,
              fontSize: 11, fontWeight: 700, fontFamily: AC.mono, letterSpacing: '0.02em',
            }}>{s}</span>
            {i < steps.length - 1 && <span style={{ color: AC.soft, fontSize: 10 }}>›</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// --- Table ---
function ArticlesTable() {
  const rows = [
    { code: '022',     name: 'Сабо мужские',         mat: 'ЭВА',     sizes: '41–46', box: 6,  price: '240',  route: ['Лит','Уп','Мрк'] },
    { code: '116нм',   name: 'Галоши с надставкой',  mat: 'ЭВА',     sizes: '41–46', box: 12, price: '408',  route: ['Лит','Уп','Мрк'] },
    { code: '905',     name: 'Галоши мужские',       mat: 'ЭВА',     sizes: '40–45', box: 12, price: '288',  route: ['Лит','Уп','Мрк'] },
    { code: '907',     name: 'Галоши мужские',       mat: 'ЭВА',     sizes: '40–46', box: 12, price: '264',  route: ['Лит','Уп','Мрк'] },
    { code: '112/н',   name: 'Сапоги мужские',       mat: 'ЭВА',     sizes: '41–46', box: 8,  price: '828',  route: ['Лит','Уп','Кл','Об','Мрк'] },
    { code: '113/м',   name: 'Сапоги с манжетом',    mat: 'ЭВА',     sizes: '41–46', box: 8,  price: '960',  route: ['Лит','Уп','Кр','Шв','Кл','Мрк'] },
    { code: '184/м',   name: 'Сапоги мужские',       mat: 'ЭВА',     sizes: '41–46', box: 8,  price: '900',  route: ['Лит','Уп','Кл','Об','Мрк'] },
    { code: '220/н',   name: 'Полусапожки',          mat: 'ЭВА',     sizes: '41–46', box: 8,  price: '540',  route: ['Лит','Уп','Кл','Мрк'] },
    { code: 'А-100м',  name: 'Сапоги мужские',       mat: 'ЭВА',     sizes: '42–45', box: 8,  price: '756',  route: ['Лит','Уп','Кл','Об','Мрк'] },
    { code: 'АВ-300н', name: 'Сапоги Аляска',        mat: 'ЭВА',     sizes: '41–46', box: 4,  price: '1\u202F080', route: ['Лит','Уп','Кр','Шв','Кл'] },
    { code: '038/н',   name: 'Сапоги силиконовые',   mat: 'Силикон', sizes: '41–45', box: 6,  price: '468',  route: ['Лит','Уп','Кл','Об','Мрк'] },
    { code: '046/н',   name: 'Сапоги ПВХ',           mat: 'ПВХ',     sizes: '41–46', box: 6,  price: '420',  route: ['Лит','Уп','Кл','Мрк'] },
  ];

  const cols = ['Код','Наименование','Материал','Размеры','В коробке','Цена опт','Маршрут','Статус',''];
  const th = (label, opts = {}) => (
    <th style={{
      textAlign: opts.right ? 'right' : 'left',
      padding: '14px 18px', background: AC.mist, color: AC.brand,
      fontSize: 10, fontWeight: 700, fontFamily: AC.mono, letterSpacing: '0.1em', textTransform: 'uppercase',
      borderBottom: `1px solid ${AC.border}`, whiteSpace: 'nowrap',
      cursor: label ? 'pointer' : 'default',
      position: 'sticky', top: 0,
    }}>
      {label && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {label}
          <span style={{ color: AC.soft }}>{ACIcons.sort}</span>
        </span>
      )}
    </th>
  );

  return (
    <div style={{ background: 'white', border: `1px solid ${AC.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="ac-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
          <thead>
            <tr>
              {th('Код')}
              {th('Наименование')}
              {th('Материал')}
              {th('Размеры')}
              {th('В коробке', { right: true })}
              {th('Цена опт', { right: true })}
              {th('Маршрут')}
              {th('Статус')}
              {th('')}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const mt = MATERIAL_TONES[r.mat];
              return (
                <tr key={i} className="ac-row" style={{ background: i % 2 ? AC.mist : 'white' }}>
                  <td style={tdCode}>
                    <span style={{ ...AC.num, fontSize: 15, fontWeight: 700, color: AC.brand }}>{r.code}</span>
                  </td>
                  <td style={td}>{r.name}</td>
                  <td style={td}>
                    <span style={{
                      display: 'inline-flex', padding: '3px 9px',
                      background: mt.bg, color: mt.c, borderRadius: 100,
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                    }}>{r.mat}</span>
                  </td>
                  <td style={{ ...td, ...AC.num, color: AC.ink2 }}>{r.sizes}</td>
                  <td style={{ ...td, ...AC.num, textAlign: 'right' }}>{r.box}</td>
                  <td style={{ ...td, ...AC.num, textAlign: 'right', fontWeight: 700 }}>{r.price}<span style={{ color: AC.dim, fontWeight: 500, marginLeft: 3 }}>₽</span></td>
                  <td style={td}><RouteChain steps={r.route}/></td>
                  <td style={td}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '3px 9px', background: '#D1FAE5', color: '#065F46',
                      borderRadius: 100, fontSize: 11, fontWeight: 700,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: AC.success }}></span>
                      Активен
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <div className="ac-actions" style={{ display: 'inline-flex', gap: 4, opacity: 0, transition: 'opacity .12s' }}>
                      <button style={iconBtn} title="Редактировать">{ACIcons.edit}</button>
                      <button style={iconBtn} title="Дублировать">{ACIcons.copy}</button>
                      <button style={iconBtn} title="Деактивировать">{ACIcons.eye}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 22px', borderTop: `1px solid ${AC.border}`, background: 'white',
        gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 13, color: AC.dim }}>
          Показано <span style={{ ...AC.num, color: AC.ink, fontWeight: 700 }}>1–12</span> из <span style={{ ...AC.num, color: AC.ink, fontWeight: 700 }}>46</span>
          <span style={{ margin: '0 10px', color: AC.soft }}>·</span>
          по совпадению с фильтрами
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: AC.dim }}>На странице:</span>
            <div style={{ position: 'relative' }}>
              <select defaultValue="12" style={{
                ...AC.num, padding: '6px 28px 6px 10px', border: `1px solid ${AC.border}`,
                borderRadius: 8, fontSize: 13, background: 'white', appearance: 'none',
                cursor: 'pointer', color: AC.ink, fontWeight: 600,
              }}>
                <option>12</option><option>25</option><option>50</option><option>100</option>
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: AC.dim, pointerEvents: 'none' }}>
                {ACIcons.chevD}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={pageBtn(false, true)}>{ACIcons.chevL}</button>
            {[1,2,3,4].map(n => (
              <button key={n} style={pageBtn(n === 1)}>{n}</button>
            ))}
            <button style={pageBtn(false)}>{ACIcons.chevR}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
const td = { padding: '12px 18px', borderBottom: `1px solid ${AC.border}`, fontSize: 14, color: AC.ink, verticalAlign: 'middle' };
const tdCode = { ...td };
const iconBtn = {
  width: 28, height: 28, borderRadius: 7, border: `1px solid ${AC.border}`,
  background: 'white', color: AC.ink2, display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};
const pageBtn = (active, edge) => ({
  minWidth: 32, height: 32, padding: '0 10px',
  background: active ? AC.brand : 'white',
  color: active ? 'white' : (edge ? AC.ink2 : AC.ink2),
  border: active ? 'none' : `1px solid ${AC.border}`,
  borderRadius: 8, fontSize: 13, fontWeight: 600,
  fontFamily: AC.mono, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});

// --- Main ---
function ArticlesCatalog() {
  return (
    <div style={{ minHeight: '100%', background: AC.mist, fontFamily: "'Inter', system-ui, sans-serif", color: AC.ink }}>
      <ACHeader />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 28px 40px' }}>
        <div style={{ marginBottom: 22 }}>
          <PageTitle />
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <FilterPanel />
          <div style={{ flex: 1, minWidth: 0 }}>
            <ArticlesTable />
          </div>
        </div>
      </main>
    </div>
  );
}

window.ArticlesCatalog = ArticlesCatalog;
