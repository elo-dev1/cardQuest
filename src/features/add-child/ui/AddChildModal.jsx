import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AVATARS, HERO_CLASSES } from '@/shared/data/memberData';
import { AvatarPicker } from '@/shared/ui/AvatarPicker';

const classEntries = Object.entries(HERO_CLASSES);

const makeInitial = (child) => ({
  name: child?.name ?? '',
  avatar: child?.avatar ?? AVATARS[2],
  heroClass: child?.classId ?? child?.hero_class ?? 'warrior',
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
          className="fixed inset-0 z-[9997] grid place-items-center p-6 backdrop-blur-sm"
          style={{ background: 'var(--bg-overlay)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            className="w-full max-w-[560px] rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-6 shadow-lg"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(event) => event.stopPropagation()}
            onSubmit={submit}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">{isEditing ? 'Редактировать ребёнка' : 'Добавить ребёнка'}</h2>
              <button type="button" className="text-2xl font-medium text-[var(--text-tertiary)]" onClick={onClose}>
                ×
              </button>
            </div>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Имя</span>
              <input
                className="input-field"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Алексей"
                autoFocus
              />
            </label>

            <div className="mb-6">
              <AvatarPicker value={form.avatar} onChange={(avatar) => setForm((current) => ({ ...current, avatar }))} />
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {classEntries.map(([key, heroClass]) => (
                <button
                  type="button"
                  key={key}
                  className={`rounded-[var(--r-md)] border p-3 text-left transition ${
                    form.heroClass === key ? 'border-[var(--charcoal)] bg-[var(--bg-elevated)]' : 'border-[var(--border-soft)] bg-[var(--bg-surface)]'
                  }`}
                  onClick={() => setForm((current) => ({ ...current, heroClass: key }))}
                >
                  <div className="flex items-center justify-center h-7 w-7">{heroClass.iconSrc ? <img src={heroClass.iconSrc} alt="" className="w-5 h-5" /> : <span className="text-xl">{heroClass.icon}</span>}</div>
                  <div className="text-sm font-semibold">{heroClass.label}</div>
                </button>
              ))}
            </div>

            <label className="mb-6 block">
              <span className="mb-1 block text-sm font-medium text-[var(--text-primary)]">PIN-код</span>
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
