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
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25), transparent 60%), #1a1040' }}
      >
        <section className="w-full max-w-[440px] rounded-[24px] bg-white p-10 text-center shadow-card">
          <div className="mb-4 text-6xl">📧</div>
          <h1 className="gradient-text mb-2 text-3xl font-black">Проверь почту</h1>
          <p className="mb-6 text-sm font-bold text-[var(--text-muted)]">Мы отправили письмо на {checkEmail}.</p>
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
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25), transparent 60%), #1a1040' }}
    >
      <form className="w-full max-w-[440px] rounded-[24px] bg-white p-8 shadow-card sm:p-10" onSubmit={submit}>
        <h1 className="gradient-text mb-1 text-center text-[32px] font-black">⚔️ Card Quest</h1>
        <p className="mb-6 text-center text-sm font-extrabold text-[var(--text-muted)]">
          {tab === 'signin' ? 'Войди в свою гильдию' : 'Создай аккаунт гильдии'}
        </p>

        {!isSupabaseConfigured ? (
          <div className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
            Supabase не настроен, поэтому включён локальный email/password режим в этом браузере.
          </div>
        ) : null}

        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
          {[
            { value: 'signin', label: 'Войти' },
            { value: 'signup', label: 'Зарегистрироваться' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-black transition ${
                tab === item.value ? 'bg-white text-[var(--c-purple)] shadow-card' : 'text-gray-500'
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
              <span className="mb-1 block text-sm font-black text-[var(--text-primary)]">Твоё имя</span>
              <input
                className="input-field"
                value={form.displayName}
                onChange={(event) => updateField('displayName', event.target.value)}
                placeholder="Мама"
              />
              {validation.displayName ? <span className="mt-1 block text-xs font-bold text-red-500">{validation.displayName}</span> : null}
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-sm font-black text-[var(--text-primary)]">Email</span>
            <input
              className="input-field"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="you@example.com"
            />
            {validation.email ? <span className="mt-1 block text-xs font-bold text-red-500">{validation.email}</span> : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-black text-[var(--text-primary)]">Пароль</span>
            <div className="flex rounded-xl border-[1.5px] border-gray-200 bg-[var(--bg-input)] focus-within:border-[var(--c-purple)]">
              <input
                className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Минимум 8 символов"
              />
              <button type="button" className="px-4 font-black text-gray-400" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {validation.password ? <span className="mt-1 block text-xs font-bold text-red-500">{validation.password}</span> : null}
          </label>

          {tab === 'signup' ? (
            <label className="block">
              <span className="mb-1 block text-sm font-black text-[var(--text-primary)]">Повтори пароль</span>
              <div className="flex rounded-xl border-[1.5px] border-gray-200 bg-[var(--bg-input)] focus-within:border-[var(--c-purple)]">
                <input
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={(event) => updateField('confirm', event.target.value)}
                  placeholder="Ещё раз пароль"
                />
                <button type="button" className="px-4 font-black text-gray-400" onClick={() => setShowConfirm((value) => !value)}>
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
              {validation.confirm ? <span className="mt-1 block text-xs font-bold text-red-500">{validation.confirm}</span> : null}
            </label>
          ) : null}
        </div>

        {error ? <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}

        <button type="submit" className="btn-primary mt-6 w-full" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? 'Подождите...' : tab === 'signin' ? 'Войти' : 'Создать аккаунт'}
        </button>

        {tab === 'signin' ? (
          <button
            type="button"
            className="mt-4 w-full text-sm font-black text-[var(--text-purple)]"
            onClick={() => authActions.resetPassword(form.email).catch((resetError) => setError(resetError.message))}
          >
            Забыл пароль?
          </button>
        ) : (
          <button type="button" className="mt-4 w-full text-sm font-black text-[var(--text-purple)]" onClick={() => setTab('signin')}>
            Уже есть аккаунт? Войти
          </button>
        )}

        <Link to="/" className="mt-5 block text-center text-xs font-bold text-gray-400">
          Вернуться в приложение
        </Link>
      </form>
    </main>
  );
};
