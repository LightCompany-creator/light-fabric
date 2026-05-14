// LightFlow — 1C Exchange (Обмен с 1С Бухгалтерия)

const EX = {
  brand: '#214A8C', brandDark: '#163566', pale: '#E8EFF8', mist: '#F4F7FC',
  excel: '#107C41', excelDark: '#0B6033', excelBg: '#E6F4EC', excelBorder: '#B8DCC4',
  oneC: '#FCC500', oneCDark: '#8B6914', oneCBg: '#FFF8DB',
  amber: '#F59E0B', amberBg: '#FEF3C7', amberDark: '#92400E',
  success: '#10B981', successDark: '#065F46', successBg: '#D1FAE5',
  danger: '#EF4444', dangerBg: '#FEE2E2', dangerDark: '#991B1B',
  ink: '#0F1B2D', ink2: '#344563', dim: '#6B7C93', soft: '#9AABBF',
  border: '#D9E2EE', borderSoft: '#E6ECF4',
  mono: "'JetBrains Mono', monospace",
  num: { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' },
};

const EI = (p, s = 18) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>
);
const EXIcons = {
  in:    EI(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>, 18),
  out:   EI(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>, 18),
  users: EI(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>, 20),
  box:   EI(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>, 20),
  truck: EI(<><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>, 20),
  ruble: EI(<><path d="M6 4h7a4 4 0 0 1 0 8H6"/><line x1="3" y1="12" x2="13" y2="12"/><line x1="6" y1="4" x2="6" y2="20"/><line x1="3" y1="16" x2="11" y2="16"/></>, 20),
  flask: EI(<><path d="M9 2h6v6l5 10a2 2 0 0 1-2 3H6a2 2 0 0 1-2-3l5-10V2z"/><line x1="9" y1="2" x2="15" y2="2"/></>, 20),
  pkg:   EI(<><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>, 20),
  upload:EI(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>, 14),
  dl:    EI(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>, 14),
  check: EI(<polyline points="20 6 9 17 4 12"/>, 14),
  warn:  EI(<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, 14),
  alert: EI(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>, 14),
  chevD: EI(<polyline points="6 9 12 15 18 9"/>, 14),
  chevR: EI(<polyline points="9 18 15 12 9 6"/>, 14),
  arrow: EI(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>, 12),
  cal:   EI(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, 14),
  hist:  EI(<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></>, 14),
  user:  EI(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>, 14),
  doc:   EI(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>, 16),
  refresh: EI(<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>, 14),
  info:  EI(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>, 14),
  bell:  EI(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>, 14),
  ext:   EI(<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>, 12),
};

// Tiny X logo for Excel files
function ExcelMark({ size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 6, background: EX.excel, color: 'white',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: EX.mono, fontWeight: 800, fontSize: size * 0.42,
      letterSpacing: '-0.05em', flexShrink: 0,
    }}>X</div>
  );
}

// =========== TOP BAR ===========
function ExTopBar() {
  return (
    <header style={{
      padding: '14px 28px', borderBottom: `1px solid ${EX.border}`, background: 'white',
      display: 'flex', alignItems: 'center', gap: 20,
    }}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>
        <span style={{ color: EX.ink }}>Light</span><span style={{ color: EX.brand }}>Flow</span>
      </div>
      <div style={{ height: 22, width: 1, background: EX.border }}></div>
      <nav style={{ display: 'flex', gap: 4 }}>
        {['Производство', 'Партии', 'Справочники', 'Зарплата', 'Обмен с 1С', 'Настройки'].map((t, i) => {
          const active = t === 'Обмен с 1С';
          return (
            <button key={i} style={{
              padding: '8px 14px',
              background: active ? EX.pale : 'transparent',
              color: active ? EX.brand : EX.ink2, border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
            }}>{t}</button>
          );
        })}
      </nav>
      <div style={{ flex: 1 }}></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', background: EX.successBg, color: EX.successDark,
          border: `1px solid ${EX.success}33`, borderRadius: 100,
          fontSize: 12, fontWeight: 700,
        }}>
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: EX.success }}></span>
          </span>
          1С подключена · v 8.3.22
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: EX.ink }}>Семенова Т.А.</div>
            <div style={{ fontSize: 11, color: EX.dim }}>Бухгалтер</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: EX.pale, color: EX.brand,
            fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${EX.brand}`,
          }}>СТ</div>
        </div>
      </div>
    </header>
  );
}

// =========== HEADER ===========
function TitleRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
      <div>
        <div style={{ ...EX.num, fontSize: 11, color: EX.dim, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          Интеграция
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: EX.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Обмен с 1С Бухгалтерия
        </h1>
        <div style={{ fontSize: 14, color: EX.dim, marginTop: 8, maxWidth: 720 }}>
          Загружайте справочники, выгружайте ведомости и отчёты. Файлы Excel в формате, согласованном с типовой конфигурацией 1С 8.3.
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{
          padding: '10px 14px', background: 'white', color: EX.ink2,
          border: `1px solid ${EX.border}`, borderRadius: 10,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {EXIcons.refresh} Проверить связь
        </button>
        <button style={{
          padding: '10px 14px', background: 'white', color: EX.brand,
          border: `1px solid ${EX.border}`, borderRadius: 10,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          {EXIcons.doc} Правила обмена {EXIcons.ext}
        </button>
      </div>
    </div>
  );
}

// =========== COLUMN HEADER ===========
function ColHeader({ tone, icon, title, subtitle, arrow }) {
  const isIn = tone === 'in';
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: isIn ? EX.pale : EX.excelBg,
          color: isIn ? EX.brand : EX.excelDark,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{icon}</div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: EX.ink, letterSpacing: '-0.02em', lineHeight: 1.1, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {title}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: EX.mono, fontSize: 10, fontWeight: 800,
              padding: '3px 9px', borderRadius: 100,
              background: isIn ? EX.pale : EX.excelBg,
              color: isIn ? EX.brand : EX.excelDark,
              letterSpacing: '0.08em',
            }}>
              {arrow} 1C
            </span>
          </h2>
          <div style={{ fontSize: 12, color: EX.dim, marginTop: 3 }}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

// =========== IMPORT CARDS ===========
function ImportCard({ icon, hue, title, desc, lastImport, errorDetails, fileName, state = 'idle' }) {
  return (
    <div style={{
      background: 'white', border: `1px solid ${EX.border}`, borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: `${hue}1f`, color: hue,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: EX.ink, letterSpacing: '-0.01em' }}>{title}</h3>
          <div style={{ fontSize: 12, color: EX.dim, marginTop: 3 }}>{desc}</div>
        </div>
      </div>

      {/* Dropzone */}
      <div style={{ padding: '0 18px 14px' }}>
        {state === 'idle' && (
          <div style={{
            position: 'relative',
            border: `2px dashed ${EX.border}`, borderRadius: 10,
            padding: '20px 16px', background: EX.mist,
            display: 'flex', alignItems: 'center', gap: 14,
            transition: 'all .15s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = EX.brand; e.currentTarget.style.background = EX.pale; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = EX.border; e.currentTarget.style.background = EX.mist; }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: 'white',
              border: `1px solid ${EX.border}`, color: EX.brand,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>{EXIcons.upload}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: EX.ink, fontWeight: 600, lineHeight: 1.3 }}>
                Перетащите файл сюда или <span style={{ color: EX.brand, textDecoration: 'underline' }}>выберите файл</span>
              </div>
              <div style={{ ...EX.num, fontSize: 11, color: EX.dim, marginTop: 2 }}>
                .xlsx · .xls · до 20 МБ
              </div>
            </div>
          </div>
        )}

        {state === 'selected' && (
          <div style={{
            padding: '14px 14px', background: 'white',
            border: `2px solid ${EX.brand}`, borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <ExcelMark size={32}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...EX.num, fontSize: 12, fontWeight: 700, color: EX.ink, lineHeight: 1.2 }}>{fileName}</div>
              <div style={{ ...EX.num, fontSize: 10, color: EX.dim, marginTop: 2 }}>184 КБ · выбран только что · не загружен</div>
            </div>
            <button style={{
              padding: '8px 16px', background: EX.brand, color: 'white',
              border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>Загрузить</button>
            <button style={{
              width: 30, height: 30, background: 'transparent', border: 'none',
              color: EX.dim, fontSize: 18, cursor: 'pointer', lineHeight: 1,
            }}>×</button>
          </div>
        )}

        {state === 'loading' && (
          <div style={{
            padding: '14px 14px', background: 'white',
            border: `1px solid ${EX.border}`, borderRadius: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <ExcelMark size={32}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...EX.num, fontSize: 12, fontWeight: 700, color: EX.ink }}>{fileName}</div>
                <div style={{ ...EX.num, fontSize: 10, color: EX.brand, fontWeight: 600, marginTop: 2 }}>Обрабатывается… 64%</div>
              </div>
            </div>
            <div style={{ height: 4, background: EX.pale, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '64%', height: '100%', background: EX.brand, borderRadius: 2 }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Last import strip */}
      {lastImport && (
        <div style={{
          padding: '11px 18px', background: EX.mist,
          borderTop: `1px solid ${EX.borderSoft}`,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <span style={{ ...EX.num, fontSize: 10, fontWeight: 700, color: EX.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Последний импорт
          </span>
          <span style={{ ...EX.num, fontSize: 12, color: EX.ink, fontWeight: 600 }}>{lastImport.date}</span>
          <span style={{ width: 2, height: 2, background: EX.soft, borderRadius: '50%' }}></span>
          <span style={{ ...EX.num, fontSize: 12, color: EX.ink2 }}>
            <strong style={{ color: EX.ink }}>{lastImport.records}</strong> записей
          </span>
          {lastImport.errors === 0 ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', background: EX.successBg, color: EX.successDark,
              borderRadius: 100, fontSize: 11, fontWeight: 700, marginLeft: 'auto',
            }}>{EXIcons.check} без ошибок</span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', background: EX.amberBg, color: EX.amberDark,
              borderRadius: 100, fontSize: 11, fontWeight: 700, marginLeft: 'auto',
            }}>{EXIcons.warn} {lastImport.errors} ошибки</span>
          )}
        </div>
      )}

      {errorDetails && <ErrorDetails details={errorDetails}/>}
    </div>
  );
}

function ErrorDetails({ details }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ borderTop: `1px solid ${EX.borderSoft}` }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '10px 18px', background: 'white',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, fontWeight: 600, color: EX.amberDark,
      }}>
        <span style={{
          transition: 'transform .2s', display: 'inline-flex',
          transform: open ? 'rotate(0)' : 'rotate(-90deg)',
        }}>{EXIcons.chevD}</span>
        Показать ошибки импорта ({details.length})
      </button>
      {open && (
        <div style={{ padding: '0 18px 14px' }}>
          {details.map((d, i) => (
            <div key={i} style={{
              padding: '10px 12px', background: '#FFFBEB', border: `1px solid #FDE68A`, borderRadius: 8,
              marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ color: EX.amber, flexShrink: 0, marginTop: 1 }}>{EXIcons.warn}</span>
              <div style={{ flex: 1, fontSize: 12, color: EX.ink2, lineHeight: 1.5 }}>
                <strong style={{ color: EX.ink, ...EX.num }}>Строка {d.row}:</strong> {d.msg}
                {d.value && <span style={{ ...EX.num, color: EX.dim, marginLeft: 6 }}>· значение: «{d.value}»</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =========== EXPORT CARD ===========
function ExportCard({ icon, hue, title, ready, lines, note }) {
  return (
    <div style={{
      background: 'white', border: `1px solid ${EX.border}`, borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: `${hue}1f`, color: hue,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: EX.ink, letterSpacing: '-0.01em' }}>{title}</h3>
          {note && <div style={{ fontSize: 11, color: EX.dim, marginTop: 2 }}>{note}</div>}
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', background: EX.successBg, color: EX.successDark,
          borderRadius: 100, fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>{EXIcons.check} Готова</span>
      </div>

      {/* Stats */}
      <div style={{ padding: '0 18px 14px' }}>
        <div style={{
          background: EX.excelBg, border: `1px solid ${EX.excelBorder}`, borderRadius: 10,
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <ExcelMark size={36}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...EX.num, fontSize: 12, fontWeight: 700, color: EX.ink, lineHeight: 1.3 }}>
              {lines.map((l, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span style={{ color: EX.dim, margin: '0 6px' }}>·</span>}
                  <span style={{ color: l.bold ? EX.excelDark : EX.ink }}>{l.txt}</span>
                </React.Fragment>
              ))}
            </div>
            <div style={{ ...EX.num, fontSize: 10, color: EX.excelDark, marginTop: 3, fontWeight: 600 }}>
              vedomost_{title.toLowerCase().replace(/[^a-zа-я]/gi, '_').slice(0, 12)}_2026_05.xlsx
            </div>
          </div>
          <button style={{
            padding: '10px 16px', background: EX.excel, color: 'white',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: '0 3px 8px rgba(16,124,65,0.3)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {EXIcons.dl} Скачать XLSX
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 18px', borderTop: `1px solid ${EX.borderSoft}`,
        background: EX.mist,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ color: EX.brand, display: 'inline-flex' }}>{EXIcons.info}</span>
        <span style={{ fontSize: 11, color: EX.dim, flex: 1 }}>Формат согласован с 1С Бухгалтерия 8.3</span>
        <button style={{
          padding: '4px 10px', background: 'transparent', color: EX.brand,
          border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>Предпросмотр →</button>
      </div>
    </div>
  );
}

// =========== PERIOD SELECTOR ===========
function PeriodSelector() {
  return (
    <div style={{
      background: 'white', border: `1px solid ${EX.border}`, borderRadius: 12,
      padding: '12px 16px', marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ color: EX.brand, display: 'inline-flex' }}>{EXIcons.cal}</span>
      <span style={{ ...EX.num, fontSize: 10, fontWeight: 700, color: EX.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Период
      </span>
      <select style={selectStyle} defaultValue="2026">
        <option>2026</option><option>2025</option><option>2024</option>
      </select>
      <select style={{ ...selectStyle, minWidth: 130 }} defaultValue="Май">
        {['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'].map(m => <option key={m}>{m}</option>)}
      </select>
      <div style={{ flex: 1 }}></div>
      <div style={{ ...EX.num, fontSize: 11, color: EX.dim }}>
        01.05.2026 — 31.05.2026 · 30 рабочих дней
      </div>
    </div>
  );
}
const selectStyle = {
  padding: '7px 28px 7px 10px',
  background: EX.mist, color: EX.ink,
  border: `1px solid ${EX.border}`, borderRadius: 8,
  fontSize: 13, fontWeight: 600, fontFamily: EX.mono, outline: 'none',
  appearance: 'none', minWidth: 100,
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7C93' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
};

// =========== HISTORY TABLE ===========
function HistoryTable() {
  const rows = [
    { d: '12.05', t: '17:42', what: 'Ведомость · май 2026',     dir: 'out', recs: 42, status: 'success', who: 'Семенова Т.А.' },
    { d: '25.04', t: '17:42', what: 'Ведомость · апрель 2026',  dir: 'out', recs: 42, status: 'success', who: 'Семенова Т.А.' },
    { d: '25.04', t: '17:30', what: 'Сотрудники',               dir: 'in',  recs: 42, status: 'success', who: 'Семенова Т.А.' },
    { d: '18.04', t: '14:20', what: 'Номенклатура',             dir: 'in',  recs: 47, status: 'warn',    err: '2 ошибки', who: 'Семенова Т.А.' },
    { d: '14.04', t: '09:11', what: 'Приход материалов',        dir: 'in',  recs: 18, status: 'success', who: 'Семенова Т.А.' },
    { d: '30.03', t: '16:00', what: 'Ведомость · март 2026',    dir: 'out', recs: 41, status: 'success', who: 'Семенова Т.А.' },
    { d: '28.03', t: '11:42', what: 'Расход материалов · март', dir: 'out', recs: 14, status: 'success', who: 'Корнеев Д.Б.' },
    { d: '12.03', t: '15:18', what: 'Сотрудники',               dir: 'in',  recs: 41, status: 'fail',    err: 'отменено', who: 'Семенова Т.А.' },
  ];

  const th = (label, align = 'left') => (
    <th style={{
      padding: '10px 16px', textAlign: align,
      fontSize: 10, fontWeight: 700, color: EX.dim, fontFamily: EX.mono,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      background: EX.mist, borderBottom: `1px solid ${EX.border}`,
    }}>{label}</th>
  );
  const td = (extra = {}) => ({
    padding: '11px 16px', borderTop: `1px solid ${EX.borderSoft}`,
    fontSize: 13, color: EX.ink, verticalAlign: 'middle', ...extra,
  });

  return (
    <section style={{ marginTop: 30 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: EX.ink, letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: EX.dim, display: 'inline-flex' }}>{EXIcons.hist}</span>
            История обменов
          </h2>
          <div style={{ fontSize: 12, color: EX.dim, marginTop: 4 }}>Последние 30 дней · 38 операций</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '7px 12px', background: 'white', border: `1px solid ${EX.border}`, color: EX.ink2, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>За всё время</button>
          <button style={{ padding: '7px 12px', background: 'white', border: `1px solid ${EX.border}`, color: EX.ink2, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Только ошибки</button>
        </div>
      </div>

      <div style={{ background: 'white', border: `1px solid ${EX.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {th('Дата')}
              {th('Операция')}
              {th('Направление')}
              {th('Записей', 'right')}
              {th('Статус')}
              {th('Кто')}
              {th('', 'right')}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="ex-row" style={{ background: i % 2 ? EX.mist : 'white' }}>
                <td style={td()}>
                  <div style={{ ...EX.num, fontSize: 13, color: EX.ink, fontWeight: 700 }}>{r.d}</div>
                  <div style={{ ...EX.num, fontSize: 10, color: EX.dim, fontWeight: 500 }}>{r.t}</div>
                </td>
                <td style={td()}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <ExcelMark size={22}/>
                    <span style={{ fontWeight: 600 }}>{r.what}</span>
                  </span>
                </td>
                <td style={td()}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                    background: r.dir === 'out' ? EX.excelBg : EX.pale,
                    color: r.dir === 'out' ? EX.excelDark : EX.brand,
                  }}>
                    {r.dir === 'out' ? '→ в 1С' : '← из 1С'}
                  </span>
                </td>
                <td style={td({ ...EX.num, textAlign: 'right', fontWeight: 700 })}>{r.recs}</td>
                <td style={td()}>
                  {r.status === 'success' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: EX.successDark, fontSize: 12, fontWeight: 700 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: EX.success }}></span>
                      Успех
                    </span>
                  )}
                  {r.status === 'warn' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: EX.amberDark, fontSize: 12, fontWeight: 700 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: EX.amber }}></span>
                      {r.err}
                    </span>
                  )}
                  {r.status === 'fail' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: EX.dangerDark, fontSize: 12, fontWeight: 700 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: EX.danger }}></span>
                      {r.err}
                    </span>
                  )}
                </td>
                <td style={td({ color: EX.ink2 })}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', background: EX.pale, color: EX.brand,
                      fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>{r.who.split(' ')[0][0]}{r.who.split(' ')[1][0]}</span>
                    <span style={{ fontSize: 12 }}>{r.who}</span>
                  </span>
                </td>
                <td style={td({ textAlign: 'right' })}>
                  <button style={{
                    padding: '5px 10px', background: 'transparent', color: EX.brand,
                    border: `1px solid ${EX.border}`, borderRadius: 6,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>Открыть</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// =========== MAIN ===========
function ExchangeScreen() {
  return (
    <div style={{
      minHeight: '100%', background: EX.mist,
      fontFamily: "'Inter', system-ui, sans-serif", color: EX.ink,
    }}>
      <ExTopBar />
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 28px 40px' }}>
        <TitleRow />

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'flex-start' }}>
          {/* LEFT — Import */}
          <section>
            <ColHeader
              tone="in"
              icon={EXIcons.in}
              title="Загрузить из 1С"
              subtitle="Файлы Excel, выгруженные из 1С Бухгалтерия"
              arrow="←"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <ImportCard
                icon={EXIcons.users} hue="#214A8C"
                title="Сотрудники"
                desc="Табельные номера, ФИО, должности, цеха"
                lastImport={{ date: '25.04.2026, 17:30', records: 42, errors: 0 }}
              />
              <ImportCard
                icon={EXIcons.box} hue="#F59E0B"
                title="Номенклатура"
                desc="Коды артикулов, наименования, цены"
                state="selected"
                fileName="nomenclatura_export_05_2026.xlsx"
                lastImport={{ date: '18.04.2026, 14:20', records: 47, errors: 2 }}
                errorDetails={[
                  { row: 12, msg: 'Артикул не распознан в справочнике', value: 'XX-44/н' },
                  { row: 28, msg: 'Дублирование кода артикула', value: '022' },
                ]}
              />
              <ImportCard
                icon={EXIcons.truck} hue="#10B981"
                title="Приход материалов"
                desc="Поступление сырья на склад"
                lastImport={{ date: '14.04.2026, 09:11', records: 18, errors: 0 }}
              />
            </div>
          </section>

          {/* RIGHT — Export */}
          <section>
            <ColHeader
              tone="out"
              icon={EXIcons.out}
              title="Выгрузить в 1С"
              subtitle="Файлы Excel для загрузки в 1С Бухгалтерию"
              arrow="→"
            />
            <PeriodSelector />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <ExportCard
                icon={EXIcons.ruble} hue="#214A8C"
                title="Ведомость зарплаты"
                note="Сдельная оплата по работникам и цехам"
                lines={[
                  { txt: '42 строки' },
                  { txt: '9 цехов' },
                  { txt: '1 247 850 ₽', bold: true },
                ]}
              />
              <ExportCard
                icon={EXIcons.flask} hue="#F59E0B"
                title="Расход материалов"
                note="Списания по нормативу и факту"
                lines={[
                  { txt: '14 позиций' },
                  { txt: '412 кг ЭВА', bold: true },
                  { txt: '+ красители' },
                ]}
              />
              <ExportCard
                icon={EXIcons.pkg} hue="#10B981"
                title="Выпуск готовой продукции"
                note="Принято на склад за период"
                lines={[
                  { txt: '8 артикулов' },
                  { txt: '28 750 пар' },
                  { txt: '24 384 000 ₽', bold: true },
                ]}
              />
            </div>

            {/* Notifications nudge */}
            <div style={{
              marginTop: 14, padding: '12px 14px',
              background: 'white', border: `1px dashed ${EX.border}`, borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ color: EX.brand, display: 'inline-flex' }}>{EXIcons.bell}</span>
              <div style={{ flex: 1, fontSize: 12, color: EX.ink2 }}>
                Получать письмо когда ведомость готова к выгрузке
              </div>
              <button style={{
                padding: '6px 12px', background: EX.pale, color: EX.brand,
                border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>Включить</button>
            </div>
          </section>
        </div>

        <HistoryTable />
      </main>
    </div>
  );
}

window.ExchangeScreen = ExchangeScreen;
