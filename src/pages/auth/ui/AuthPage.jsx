import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authActions } from '@/features/auth/model/authActions';
import { useAuth } from '@/features/auth/model/useAuth';
import { isSupabaseConfigured } from '@/shared/lib/supabase';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { userId, loading } = useAuth();
  const [tab, setTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkEmail, setCheckEmail] = useState('');
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirm: '',
  });

  useEffect(() => {
    if (!loading && userId) navigate(redirectTo === '/auth' ? '/' : redirectTo, { replace: true });
  }, [loading, navigate, redirectTo, userId]);

  const goAfterAuth = () => {
    navigate(redirectTo === '/auth' ? '/' : redirectTo, { replace: true });
  };

  const validation = useMemo(() => {
    const errors = {};
    if (tab === 'signup' && !form.displayName.trim()) errors.displayName = 'Укажите имя';
    if (!emailPattern.test(form.email.trim())) errors.email = 'Введите корректный email';
    if (form.password.length < 8) errors.password = 'Минимум 8 символов';
    if (tab === 'signup' && form.confirm !== form.password) errors.confirm = 'Пароли не совпадают';
    return errors;
  }, [form, tab]);

  const canSubmit = Object.keys(validation).length === 0;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      if (tab === 'signin') {
        await authActions.signIn({ email: form.email.trim(), password: form.password });
        goAfterAuth();
        return;
      }

      const data = await authActions.signUp({
        email: form.email.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
      });
      if (isSupabaseConfigured && data.user && !data.session) {
        setCheckEmail(form.email.trim());
        return;
      }
      goAfterAuth();
    } catch (submitError) {
      setError(submitError.message || 'Не удалось выполнить действие');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkEmail) {
    return (
      <main
        className="grid min-h-screen place-items-center p-6"
        style={{ background: 'var(--bg-app)' }}
      >
        <section className="w-full max-w-[440px] rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-10 text-center shadow-md border border-[var(--border-soft)]">
          <div className="mb-4 text-6xl">📧</div>
          <h1 className="font-['DM_Serif_Display'] text-3xl text-[var(--text-primary)] mb-2">Проверь почту</h1>
          <p className="mb-6 text-sm font-medium text-[var(--text-secondary)]">Мы отправили письмо на {checkEmail}.</p>
          <button type="button" className="btn-secondary w-full" onClick={() => setCheckEmail('')}>
            Вернуться ко входу
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      className="grid min-h-screen place-items-center p-6"
      style={{ background: 'var(--bg-app)' }}
    >
      <form className="w-full max-w-[440px] rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-8 shadow-md border border-[var(--border-soft)] sm:p-10" onSubmit={submit}>
        <h1 className="font-['DM_Serif_Display'] text-center text-[32px] text-[var(--text-primary)] mb-1">⚔️ Card Quest</h1>
        <p className="mb-6 text-center text-sm font-medium text-[var(--text-secondary)]">
          {tab === 'signin' ? 'Войди в свою гильдию' : 'Создай аккаунт гильдии'}
        </p>

        {!isSupabaseConfigured ? (
          <div className="mb-5 rounded-[var(--r-md)] bg-[var(--sand-bg)] px-4 py-3 text-sm font-medium text-[var(--sand)]">
            Supabase не настроен, поэтому включён локальный email/password режим в этом браузере.
          </div>
        ) : null}

        <div className="mb-6 inline-grid grid-cols-2 gap-1 rounded-full bg-[var(--bg-elevated)] p-1 w-full">
          {[
            { value: 'signin', label: 'Войти' },
            { value: 'signup', label: 'Зарегистрироваться' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                tab === item.value ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'
              }`}
              onClick={() => {
                setTab(item.value);
                setError('');
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {tab === 'signup' ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Твоё имя</span>
              <input
                className="input-field"
                value={form.displayName}
                onChange={(event) => updateField('displayName', event.target.value)}
                placeholder="Мама"
              />
              {validation.displayName ? <span className="mt-1 block text-xs font-medium text-[var(--clay)]">{validation.displayName}</span> : null}
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Email</span>
            <input
              className="input-field"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="you@example.com"
            />
            {validation.email ? <span className="mt-1 block text-xs font-medium text-[var(--clay)]">{validation.email}</span> : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Пароль</span>
            <div className="flex rounded-[var(--r-md)] border-[1.5px] border-transparent bg-[var(--bg-elevated)] focus-within:border-[var(--border-strong)] focus-within:bg-[var(--bg-surface)] transition">
              <input
                className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Минимум 8 символов"
              />
              <button type="button" className="px-4 font-medium text-[var(--text-tertiary)]" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {validation.password ? <span className="mt-1 block text-xs font-medium text-[var(--clay)]">{validation.password}</span> : null}
          </label>

          {tab === 'signup' ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Повтори пароль</span>
              <div className="flex rounded-[var(--r-md)] border-[1.5px] border-transparent bg-[var(--bg-elevated)] focus-within:border-[var(--border-strong)] focus-within:bg-[var(--bg-surface)] transition">
                <input
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={(event) => updateField('confirm', event.target.value)}
                  placeholder="Ещё раз пароль"
                />
                <button type="button" className="px-4 font-medium text-[var(--text-tertiary)]" onClick={() => setShowConfirm((value) => !value)}>
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
              {validation.confirm ? <span className="mt-1 block text-xs font-medium text-[var(--clay)]">{validation.confirm}</span> : null}
            </label>
          ) : null}
        </div>

        {error ? <div className="mt-5 rounded-[var(--r-md)] bg-[var(--clay-bg)] px-4 py-3 text-sm font-medium text-[var(--clay)]">{error}</div> : null}

        <button type="submit" className="btn-primary mt-6 w-full" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? 'Подождите...' : tab === 'signin' ? 'Войти' : 'Создать аккаунт'}
        </button>

        {tab === 'signin' ? (
          <button
            type="button"
            className="mt-4 w-full text-sm font-medium text-[var(--slate)]"
            onClick={() => authActions.resetPassword(form.email).catch((resetError) => setError(resetError.message))}
          >
            Забыл пароль?
          </button>
        ) : (
          <button type="button" className="mt-4 w-full text-sm font-medium text-[var(--slate)]" onClick={() => setTab('signin')}>
            Уже есть аккаунт? Войти
          </button>
        )}

        <Link to="/" className="mt-5 block text-center text-xs font-medium text-[var(--text-tertiary)]">
          Вернуться в приложение
        </Link>
      </form>
    </main>
  );
};
