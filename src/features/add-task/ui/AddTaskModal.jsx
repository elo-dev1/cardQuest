import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CATEGORIES } from '@/shared/data/taskTemplates';
import { useStore } from '@/shared/store/useStore';

const categoryEntries = Object.entries(CATEGORIES).filter(([key]) => key !== 'special');

const ASSIGN_TO_OPTIONS = [
  { value: 'all', label: 'Все' },
  { value: 'children', label: 'Дети' },
  { value: 'parents', label: 'Родители' },
];

const REPEAT_OPTIONS = [
  { value: 'daily', label: 'Ежедневно' },
  { value: 'weekly', label: 'Еженедельно' },
];

export const AddTaskModal = ({ open, onClose }) => {
  const [form, setForm] = useState({
    title: '',
    category: 'home',
    assigned_to: 'all',
    repeat_type: 'daily',
  });
  const [isSaving, setIsSaving] = useState(false);
  const addTask = useStore((state) => state.addTask);
  const addToast = useStore((state) => state.addToast);

  useEffect(() => {
    if (open) setForm({ title: '', category: 'home', assigned_to: 'all', repeat_type: 'daily' });
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || isSaving) return;
    setIsSaving(true);
    addTask({
      title: form.title.trim(),
      category: form.category,
      assigned_to: form.assigned_to,
      repeat_type: form.repeat_type,
    });
    addToast('Задача создана!');
    onClose();
    setIsSaving(false);
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
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-[var(--text-primary)]">Новая задача</h2>
              <button type="button" className="text-2xl font-black text-gray-400" onClick={onClose}>
                ×
              </button>
            </div>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-black text-[var(--text-primary)]">Название</span>
              <input
                className="input-field"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Например: Убрать комнату"
                autoFocus
              />
            </label>

            <div className="mb-4">
              <div className="mb-2 text-sm font-black text-[var(--text-primary)]">Категория</div>
              <div className="flex flex-wrap gap-2">
                {categoryEntries.map(([key, cat]) => (
                  <button
                    type="button"
                    key={key}
                    className={`rounded-xl border px-4 py-2 text-sm font-black transition ${
                      form.category === key ? 'border-[var(--c-purple)] bg-[var(--c-purple-pale)] text-[var(--c-purple)]' : 'border-gray-200 bg-white text-gray-700'
                    }`}
                    onClick={() => setForm((f) => ({ ...f, category: key }))}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-2 text-sm font-black text-[var(--text-primary)]">Кому назначить</div>
              <div className="flex gap-2">
                {ASSIGN_TO_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`rounded-xl border px-4 py-2 text-sm font-black transition ${
                      form.assigned_to === opt.value ? 'border-[var(--c-purple)] bg-[var(--c-purple-pale)] text-[var(--c-purple)]' : 'border-gray-200 bg-white text-gray-700'
                    }`}
                    onClick={() => setForm((f) => ({ ...f, assigned_to: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-2 text-sm font-black text-[var(--text-primary)]">Повторение</div>
              <div className="flex gap-2">
                {REPEAT_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`rounded-xl border px-4 py-2 text-sm font-black transition ${
                      form.repeat_type === opt.value ? 'border-[var(--c-purple)] bg-[var(--c-purple-pale)] text-[var(--c-purple)]' : 'border-gray-200 bg-white text-gray-700'
                    }`}
                    onClick={() => setForm((f) => ({ ...f, repeat_type: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={!form.title.trim() || isSaving}>
              {isSaving ? 'Создаём...' : 'Создать задачу'}
            </button>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};