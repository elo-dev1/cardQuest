import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AVATARS, HERO_CLASSES } from '@/shared/data/memberData';

const classEntries = Object.entries(HERO_CLASSES);

const makeInitial = (child) => ({
  name: child?.name ?? '',
  avatar: child?.avatar ?? AVATARS[2],
  heroClass: child?.classId ?? child?.hero_class ?? 'archer',
  pin: child?.pin ?? '',
});

export const AddChildModal = ({ child = null, open, onClose, onSubmit }) => {
  const [form, setForm] = useState(makeInitial(child));
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(child);

  useEffect(() => {
    if (open) setForm(makeInitial(child));
  }, [child, open]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        avatar: form.avatar,
        heroClass: form.heroClass,
        pin: form.pin.replace(/\D/g, '').slice(0, 4),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[9997] grid place-items-center bg-black/65 p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            className="card w-full max-w-[560px] p-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            onClick={(event) => event.stopPropagation()}
            onSubmit={submit}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-[var(--text-primary)]">{isEditing ? 'Редактировать ребёнка' : 'Добавить ребёнка'}</h2>
              <button type="button" className="text-2xl font-black text-gray-400" onClick={onClose}>
                ×
              </button>
            </div>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-black text-[var(--text-primary)]">Имя</span>
              <input
                className="input-field"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Алексей"
                autoFocus
              />
            </label>

            <div className="mb-4">
              <div className="mb-2 text-sm font-black text-[var(--text-primary)]">Аватар</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {AVATARS.map((avatar) => (
                  <button
                    type="button"
                    key={avatar}
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg transition ${
                      form.avatar === avatar ? 'bg-[var(--c-purple)] text-white shadow-purple' : 'bg-gray-100'
                    }`}
                    onClick={() => setForm((current) => ({ ...current, avatar }))}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {classEntries.map(([key, heroClass]) => (
                <button
                  type="button"
                  key={key}
                  className={`rounded-xl border p-3 text-left transition ${
                    form.heroClass === key ? 'border-[var(--c-purple)] bg-[var(--c-purple-pale)] shadow-purple' : 'border-gray-200 bg-white'
                  }`}
                  onClick={() => setForm((current) => ({ ...current, heroClass: key }))}
                >
                  <div className="text-xl">{heroClass.icon}</div>
                  <div className="text-sm font-black">{heroClass.label}</div>
                </button>
              ))}
            </div>

            <label className="mb-6 block">
              <span className="mb-1 block text-sm font-black text-[var(--text-primary)]">PIN-код</span>
              <input
                className="input-field"
                inputMode="numeric"
                maxLength={4}
                value={form.pin}
                onChange={(event) => setForm((current) => ({ ...current, pin: event.target.value.replace(/\D/g, '') }))}
                placeholder="4 цифры, необязательно"
              />
            </label>

            <button type="submit" className="btn-primary w-full" disabled={!form.name.trim() || isSaving}>
              {isSaving ? 'Сохраняем...' : isEditing ? 'Сохранить' : 'Добавить ребёнка'}
            </button>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
