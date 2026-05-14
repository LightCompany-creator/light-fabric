const { useState } = React;

// Lucide-style stroke icons
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const MailIcon = () => (
  <Icon d={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></>} />
);

const LockIcon = () => (
  <Icon d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} />
);

const EyeIcon = () => (
  <Icon d={<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>} />
);

const EyeOffIcon = () => (
  <Icon d={<><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></>} />
);

const AlertIcon = () => (
  <Icon size={16} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>} />
);

const loginStyles = {
  stage: {
    position: 'relative',
    width: '100%',
    height: '100%',
    background: '#F4F7FC',
    overflow: 'hidden',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#0F1B2D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
  },
  decor: {
    position: 'absolute',
    right: '-20px',
    bottom: '-60px',
    fontSize: '280px',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    color: '#E8EFF8',
    lineHeight: 0.85,
    pointerEvents: 'none',
    userSelect: 'none',
    fontFamily: "'Inter', sans-serif",
  },
  topBadge: {
    position: 'absolute',
    top: '32px',
    left: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    background: 'white',
    border: '1px solid #D9E2EE',
    borderRadius: '100px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    fontWeight: 700,
    color: '#6B7C93',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  topBadgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10B981',
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    background: 'white',
    border: '1px solid #D9E2EE',
    borderRadius: '16px',
    padding: '40px 36px 36px',
    boxShadow: '0 12px 40px rgba(33,74,140,0.08)',
    zIndex: 2,
  },
  logo: {
    fontSize: '36px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    textAlign: 'center',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#6B7C93',
    textAlign: 'center',
    marginBottom: '32px',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.04em',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#344563',
    marginBottom: '6px',
    letterSpacing: '0.02em',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#9AABBF',
    pointerEvents: 'none',
    display: 'flex',
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 44px',
    border: '1px solid #D9E2EE',
    borderRadius: '10px',
    fontSize: '15px',
    fontFamily: "'Inter', sans-serif",
    color: '#0F1B2D',
    background: 'white',
    outline: 'none',
    transition: 'all 0.15s',
  },
  inputError: {
    borderColor: '#EF4444',
    background: '#FFF5F5',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    color: '#6B7C93',
    cursor: 'pointer',
    borderRadius: '6px',
  },
  errorMsg: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    background: '#FEE2E2',
    border: '1px solid #FCA5A5',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#B91C1C',
    fontSize: '13px',
    marginTop: '4px',
    marginBottom: '20px',
    lineHeight: 1.45,
  },
  errorIconWrap: {
    color: '#EF4444',
    marginTop: '1px',
    flexShrink: 0,
  },
  submit: {
    width: '100%',
    padding: '15px 20px',
    background: '#214A8C',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'background 0.15s',
  },
  submitDisabled: {
    background: '#3D6FB8',
    cursor: 'wait',
  },
  forgot: {
    display: 'block',
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '13px',
    color: '#6B7C93',
    textDecoration: 'none',
  },
  divider: {
    margin: '24px 0 16px',
    height: '1px',
    background: '#D9E2EE',
  },
  hint: {
    fontSize: '11px',
    color: '#9AABBF',
    textAlign: 'center',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.05em',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2.5px solid rgba(255,255,255,0.35)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'lf-spin 0.8s linear infinite',
  },
  stateTag: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '4px 12px',
    background: '#0F1B2D',
    color: 'white',
    borderRadius: '100px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    zIndex: 3,
  },
  footer: {
    position: 'absolute',
    bottom: '28px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#9AABBF',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    zIndex: 2,
  },
};

function LoginScreen({ variant = 'default', stateTagText = null }) {
  const [showPw, setShowPw] = useState(false);
  const isLoading = variant === 'loading';
  const isError = variant === 'error';

  return (
    <div style={loginStyles.stage}>
      {/* corner badge */}
      <div style={loginStyles.topBadge}>
        <span style={loginStyles.topBadgeDot}></span>
        LightFlow · MES v1.0
      </div>

      {/* decorative 2004 */}
      <div style={loginStyles.decor}>2004</div>

      {/* card */}
      <div style={loginStyles.card}>
        {stateTagText && <div style={loginStyles.stateTag}>{stateTagText}</div>}

        <div style={loginStyles.logo}>
          <span style={{ color: '#0F1B2D' }}>Light</span>
          <span style={{ color: '#214A8C' }}>Flow</span>
        </div>
        <div style={loginStyles.subtitle}>
          Система оперативного учёта · Light Company
        </div>

        <div style={loginStyles.field}>
          <label style={loginStyles.label}>Email</label>
          <div style={loginStyles.inputWrap}>
            <span style={loginStyles.inputIcon}><MailIcon /></span>
            <input
              type="email"
              defaultValue={isError ? 'brigadir@light-c.shop' : (isLoading ? 'i.petrov@light-c.shop' : '')}
              placeholder="you@light-c.shop"
              style={{
                ...loginStyles.input,
                ...(isError ? loginStyles.inputError : {}),
              }}
            />
          </div>
        </div>

        <div style={{ ...loginStyles.field, marginBottom: isError ? '10px' : '8px' }}>
          <label style={loginStyles.label}>Пароль</label>
          <div style={loginStyles.inputWrap}>
            <span style={loginStyles.inputIcon}><LockIcon /></span>
            <input
              type={showPw ? 'text' : 'password'}
              defaultValue={isError || isLoading ? '••••••••' : ''}
              placeholder="••••••••"
              style={{
                ...loginStyles.input,
                paddingRight: '52px',
                ...(isError ? loginStyles.inputError : {}),
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(s => !s)}
              style={loginStyles.eyeBtn}
              aria-label={showPw ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {isError && (
          <div style={loginStyles.errorMsg}>
            <span style={loginStyles.errorIconWrap}><AlertIcon /></span>
            <span>
              Неверный email или пароль. Проверьте данные или обратитесь к&nbsp;администратору.
            </span>
          </div>
        )}

        <button
          style={{
            ...loginStyles.submit,
            ...(isLoading ? loginStyles.submitDisabled : {}),
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span style={loginStyles.spinner}></span>
              <span>Входим…</span>
            </>
          ) : (
            'Войти'
          )}
        </button>

        <a href="#" style={loginStyles.forgot}>Забыли пароль?</a>

        <div style={loginStyles.divider}></div>
        <div style={loginStyles.hint}>
          Доступ выдаёт администратор · служба поддержки: it@light-c.shop
        </div>
      </div>

      <div style={loginStyles.footer}>
        © Light Company · Кисловодск · с 2004
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
