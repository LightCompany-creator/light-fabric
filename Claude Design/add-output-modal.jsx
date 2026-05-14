const { useState: useStateAW } = React;

const awIcon = (paths, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);

const AW = {
  brand: '#214A8C', mist: '#F4F7FC', pale: '#E8EFF8',
  accent: '#F59E0B', success: '#10B981', danger: '#EF4444',
  ink: '#0F1B2D', ink2: '#344563', dim: '#6B7C93', soft: '#9AABBF',
  border: '#D9E2EE', wsMold: '#EF4444',
  mono: "'JetBrains Mono', monospace",
  num: { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' },
};

const ARTICLES = [
  { code: '022',         name: 'Сабо мужские',           mat: 'ЭВА' },
  { code: '116нм',       name: 'Галоши с надставкой',    mat: 'ЭВА' },
  { code: '905',         name: 'Галоши мужские',         mat: 'ЭВА' },
  { code: '907',         name: 'Галоши мужские',         mat: 'ЭВА' },
  { code: '112/н',       name: 'Сапоги мужские',         mat: 'ЭВА' },
  { code: '113/м',       name: 'Сапоги с манжетом',      mat: 'ЭВА' },
  { code: '184/м',       name: 'Сапоги мужские',         mat: 'ЭВА' },
  { code: '187/н',       name: 'Сапоги мужские',         mat: 'ЭВА' },
  { code: '220/н',       name: 'Полусапожки',            mat: 'ЭВА' },
  { code: '412н',        name: 'Сапоги мужские',         mat: 'ЭВА' },
  { code: 'А-100м',      name: 'Сапоги мужские',         mat: 'ЭВА' },
  { code: 'АВ-300н',     name: 'Сапоги Аляска',          mat: 'ЭВА' },
  { code: '038/н',       name: 'Сапоги силиконовые',     mat: 'Силикон' },
  { code: '046/н-манжет',name: 'Сапоги ПВХ с манжетом',  mat: 'ПВХ' },
];

function FieldLabel({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: AW.ink2, marginBottom: 6 }}>
      {children}{required && <span style={{ color: AW.danger, marginLeft: 4 }}>*</span>}
    </label>
  );
}

const inputBase = {
  width: '100%', padding: '12px 14px', border: `1px solid ${AW.border}`,
  borderRadius: 10, fontSize: 15, fontFamily: "'Inter', sans-serif", color: AW.ink,
  background: 'white', outline: 'none',
};

const inputErr = { borderColor: AW.danger, background: '#FFF5F5' };

function ArticleSelect({ open, article, query, setOpen, setArticle, setQuery, hasError }) {
  const filtered = ARTICLES.filter(a =>
    !query || a.code.toLowerCase().includes(query.toLowerCase()) || a.name.toLowerCase().includes(query.toLowerCase())
  );
  const matPill = (m) => {
    const map = { 'ЭВА': { bg: '#D1FAE5', c: '#065F46' }, 'ПВХ': { bg: '#DBEAFE', c: '#1E40AF' }, 'Силикон': { bg: '#F3E8FF', c: '#6B21A8' }};
    const s = map[m] || map['ЭВА'];
    return <span style={{ ...AW.num, padding: '2px 8px', background: s.bg, color: s.c, borderRadius: 100, fontSize: 10, fontWeight: 700 }}>{m}</span>;
  };
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        ...inputBase,
        ...(hasError ? inputErr : {}),
        cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: article ? '8px 14px' : '12px 14px',
      }}>
        {article ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ ...AW.num, fontSize: 18, fontWeight: 700, color: AW.brand }}>{article.code}</span>
            <span style={{ fontSize: 13, color: AW.dim }}>{article.name}</span>
            {matPill(article.mat)}
          </div>
        ) : <span style={{ color: AW.soft }}>Выберите артикул…</span>}
        {awIcon(<polyline points="6 9 12 15 18 9"/>, 18)}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'white', border: `1px solid ${AW.border}`, borderRadius: 12,
          boxShadow: '0 12px 32px rgba(15,27,45,0.12)', zIndex: 10,
          maxHeight: 320, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 10, borderBottom: `1px solid ${AW.border}`, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', color: AW.soft }}>
              {awIcon(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>, 16)}
            </span>
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Поиск по коду или названию…"
              autoFocus
              style={{ ...inputBase, paddingLeft: 38, fontSize: 14 }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: AW.dim, fontSize: 13 }}>Ничего не найдено</div>}
            {filtered.map(a => (
              <div key={a.code} onClick={() => { setArticle(a); setOpen(false); setQuery(''); }}
                style={{
                  padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: `1px solid ${AW.mist}`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = AW.mist}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <span style={{ ...AW.num, fontSize: 16, fontWeight: 700, color: AW.brand, minWidth: 110 }}>{a.code}</span>
                <span style={{ flex: 1, fontSize: 13, color: AW.ink2 }}>{a.name}</span>
                {matPill(a.mat)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddOutputModal({ variant = 'default' }) {
  const isError = variant === 'error';
  const [open, setOpen] = useStateAW(false);
  const [article, setArticle] = useStateAW(ARTICLES[4]); // 112/н
  const [query, setQuery] = useStateAW('');
  const [sizeFrom, setSizeFrom] = useStateAW('42');
  const [sizeTo, setSizeTo] = useStateAW('46');
  const [pairs, setPairs] = useStateAW(isError ? '96' : '96');
  const [weight, setWeight] = useStateAW('68.0');
  const [defect, setDefect] = useStateAW(isError ? '120' : '2');
  const [machine, setMachine] = useStateAW('ИЛМ-3');
  const [downtime, setDowntime] = useStateAW('15');
  const [reason, setReason] = useStateAW('Замена матрицы');

  const showReason = parseInt(downtime || '0', 10) > 0;
  const defectErr = isError;

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: 'rgba(15,27,45,0.45)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32, fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: 760, background: 'white', borderRadius: 16,
        boxShadow: '0 24px 60px rgba(15,27,45,0.3)', overflow: 'hidden',
        maxHeight: '100%', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '22px 28px', borderBottom: `1px solid ${AW.border}`, gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: AW.ink, letterSpacing: '-0.01em' }}>
                Новая выработка
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '4px 10px', background: '#FEE2E2', borderRadius: 100,
                color: '#991B1B', fontSize: 12, fontWeight: 700,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: AW.wsMold }}></span>
                Литейка
              </div>
            </div>
            <div style={{ fontSize: 13, color: AW.dim }}>
              Смена · 12 мая 2026, день · открыта в 08:00
            </div>
          </div>
          <button style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${AW.border}`,
            background: 'white', color: AW.ink2, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {awIcon(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, 18)}
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          <div className="aw-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
            {/* Col 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <FieldLabel required>Артикул</FieldLabel>
                <ArticleSelect open={open} article={article} query={query}
                  setOpen={setOpen} setArticle={setArticle} setQuery={setQuery} />
              </div>

              <div>
                <FieldLabel required>Размеры</FieldLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
                  <input value={sizeFrom} onChange={e => setSizeFrom(e.target.value)} placeholder="от"
                    style={{ ...inputBase, ...AW.num, textAlign: 'center', fontSize: 18, fontWeight: 700 }} />
                  <span style={{ ...AW.num, fontSize: 20, color: AW.dim }}>—</span>
                  <input value={sizeTo} onChange={e => setSizeTo(e.target.value)} placeholder="до"
                    style={{ ...inputBase, ...AW.num, textAlign: 'center', fontSize: 18, fontWeight: 700 }} />
                </div>
              </div>

              <div>
                <FieldLabel required>Количество пар</FieldLabel>
                <input value={pairs} onChange={e => setPairs(e.target.value)}
                  style={{ ...inputBase, ...AW.num, textAlign: 'center', fontSize: 28, fontWeight: 800, padding: '14px', letterSpacing: '-0.01em' }} />
              </div>

              <div>
                <FieldLabel required>Вес, кг</FieldLabel>
                <div style={{ position: 'relative' }}>
                  <input value={weight} onChange={e => setWeight(e.target.value)} step="0.1"
                    style={{ ...inputBase, ...AW.num, fontSize: 18, fontWeight: 700, paddingRight: 50 }} />
                  <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: AW.dim, fontSize: 13, fontFamily: AW.mono }}>кг</span>
                </div>
              </div>
            </div>

            {/* Col 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <FieldLabel>Брак, пар</FieldLabel>
                <input value={defect} onChange={e => setDefect(e.target.value)}
                  style={{ ...inputBase, ...AW.num, fontSize: 18, fontWeight: 700, ...(defectErr ? inputErr : {}) }} />
                {defectErr && (
                  <div style={{
                    marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '8px 12px', background: '#FEE2E2', border: `1px solid #FCA5A5`,
                    borderRadius: 8, color: '#B91C1C', fontSize: 13, fontWeight: 500,
                  }}>
                    <span style={{ color: AW.danger, flexShrink: 0, marginTop: 1 }}>
                      {awIcon(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>, 14)}
                    </span>
                    <span>Брак не может превышать общее количество (96 пар).</span>
                  </div>
                )}
              </div>

              <div>
                <FieldLabel required>Машина</FieldLabel>
                <div style={{ position: 'relative' }}>
                  <select value={machine} onChange={e => setMachine(e.target.value)}
                    style={{ ...inputBase, ...AW.num, fontSize: 16, fontWeight: 600, appearance: 'none', paddingRight: 40, cursor: 'pointer' }}>
                    {['ИЛМ-1','ИЛМ-2','ИЛМ-3','ИЛМ-4'].map(m => <option key={m}>{m}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: AW.dim, pointerEvents: 'none' }}>
                    {awIcon(<polyline points="6 9 12 15 18 9"/>, 16)}
                  </span>
                </div>
              </div>

              <div>
                <FieldLabel>Простой, мин</FieldLabel>
                <input value={downtime} onChange={e => setDowntime(e.target.value)}
                  style={{ ...inputBase, ...AW.num, fontSize: 18, fontWeight: 700 }} />
              </div>

              {showReason && (
                <div>
                  <FieldLabel required>Причина простоя</FieldLabel>
                  <input value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="Например: замена матрицы, отсутствие сырья"
                    style={{ ...inputBase }} />
                </div>
              )}
            </div>
          </div>

          {/* Hint */}
          <div style={{
            marginTop: 24, padding: '14px 16px',
            background: AW.mist, border: `1px solid ${AW.border}`, borderRadius: 10,
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <span style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: 8,
              background: AW.pale, color: AW.brand,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {awIcon(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>, 14)}
            </span>
            <div style={{ flex: 1, fontSize: 13, color: AW.ink2, lineHeight: 1.55 }}>
              <div style={{ fontWeight: 600, color: AW.ink, marginBottom: 2 }}>Партия будет создана автоматически при закрытии смены.</div>
              <div>
                Расход сырья спишется по нормативу: <span style={{ ...AW.num, fontWeight: 700, color: AW.brand }}>0.7 кг ЭВА × 96 пар = 67.2 кг</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '18px 28px', borderTop: `1px solid ${AW.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          background: AW.mist,
        }}>
          <div style={{ ...AW.num, fontSize: 11, color: AW.dim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            * — обязательные поля
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{
              padding: '13px 22px', background: 'white', color: AW.ink2,
              border: `1px solid ${AW.border}`, borderRadius: 10,
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>Отмена</button>
            <button disabled={defectErr} style={{
              padding: '13px 24px', background: defectErr ? AW.soft : AW.brand, color: 'white',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: defectErr ? 'not-allowed' : 'pointer',
              boxShadow: defectErr ? 'none' : '0 4px 14px rgba(33,74,140,0.25)',
            }}>Сохранить</button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.AddOutputModal = AddOutputModal;
