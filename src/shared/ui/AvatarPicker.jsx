import { useRef } from 'react';
import { AVATARS } from '@/shared/data/memberData';

export const AvatarPicker = ({ value, onChange }) => {
  const fileInputRef = useRef(null);
  const isCustom = value?.startsWith('data:');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => onChange(event.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">Аватар</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <button
          type="button"
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl transition ${
            isCustom ? 'ring-2 ring-[var(--charcoal)]' : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)]'
          }`}
          onClick={() => fileInputRef.current?.click()}
          title="Загрузить своё фото"
        >
          {isCustom ? (
            <img src={value} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="text-2xl leading-none font-light text-[var(--text-secondary)]">+</span>
          )}
        </button>
        {AVATARS.map((avatar) => (
          <button
            type="button"
            key={avatar}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl transition ${
              !isCustom && value === avatar ? 'bg-[var(--charcoal)] text-white' : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)]'
            }`}
            onClick={() => onChange(avatar)}
          >
            {avatar}
          </button>
        ))}
      </div>
    </div>
  );
};
