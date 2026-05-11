import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HERO_CLASSES } from '@/shared/data/memberData';
import { AddChildModal } from '@/features/add-child/ui/AddChildModal';
import { generateInviteCode, getFamilyInvitations, getInviteUrl, revokeInvitation } from '@/features/invite/model/inviteActions';
import { useStore } from '@/shared/store/useStore';

const roleLabels = {
  owner: 'Владелец',
  parent: 'parent',
  child: 'ребёнок',
};

const formatDate = (value) => {
  if (!value) return 'сегодня';
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(new Date(value));
};

export const SettingsPage = () => {
  const navigate = useNavigate();
  const family = useStore((state) => state.family);
  const members = useStore((state) => state.members);
  const currentMember = useStore((state) => state.getCurrentMember());
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const updateGuildName = useStore((state) => state.updateGuildName);
  const exportData = useStore((state) => state.exportData);
  const resetData = useStore((state) => state.resetData);
  const addToast = useStore((state) => state.addToast);
  const addChild = useStore((state) => state.addChild);
  const updateMember = useStore((state) => state.updateMember);
  const removeMember = useStore((state) => state.removeMember);
  const [name, setName] = useState(family?.name || '');
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [inviteUses, setInviteUses] = useState(1);
  const [inviteLoading, setInviteLoading] = useState(false);

  const canManage = currentMember?.member_role === 'owner' || currentMember?.member_role === 'parent' || currentMember?.role === 'parent';
  const isOwner = currentMember?.member_role === 'owner';

  useEffect(() => {
    setName(family?.name || '');
  }, [family?.name]);

  useEffect(() => {
    if (!family?.id || !canManage) return;
    getFamilyInvitations(family.id)
      .then(setInvitations)
      .catch((error) => addToast(error.message || 'Не удалось загрузить приглашения', 'error'));
  }, [addToast, canManage, family?.id]);

  const refreshInvites = async () => {
    if (!family?.id) return;
    setInvitations(await getFamilyInvitations(family.id));
  };

  const saveName = () => {
    updateGuildName(name);
    addToast('Название гильдии сохранено.', 'success');
  };

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'card-quest-export.json';
    link.click();
    URL.revokeObjectURL(url);
    addToast('Экспорт данных подготовлен.', 'success');
  };

  const handleReset = () => {
    if (!window.confirm('Сбросить локальный прогресс Card Quest на этом устройстве?')) return;
    resetData();
    navigate('/setup', { replace: true });
  };

  const submitChild = async (child) => {
    if (editingChild) {
      await updateMember(editingChild.id, {
        name: child.name,
        avatar: child.avatar,
        classId: child.heroClass,
        pin: child.pin,
      });
      addToast('Профиль ребёнка обновлён.', 'success');
      setEditingChild(null);
      return;
    }
    await addChild(child);
  };

  const deleteMember = async (member) => {
    if (member.member_role === 'owner') {
      addToast('Владельца гильдии удалить нельзя.', 'error');
      return;
    }
    if (member.member_role === 'parent' && !isOwner) {
      addToast('Только владелец может исключать взрослых участников.', 'error');
      return;
    }
    if (!window.confirm(`Удалить ${member.name} из гильдии?`)) return;
    await removeMember(member.id);
    addToast(`${member.name} удалён из гильдии.`, 'success');
  };

  const createInvite = async () => {
    if (!family?.id || !currentMember?.id || inviteLoading) return;
    setInviteLoading(true);
    try {
      const code = await generateInviteCode(family.id, currentMember.id, { maxUses: Math.max(1, Number(inviteUses) || 1) });
      addToast(`Код ${code} создан.`, 'success');
      await refreshInvites();
    } catch (error) {
      addToast(error.message || 'Не удалось создать приглашение', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInvite = async (code) => {
    await navigator.clipboard.writeText(getInviteUrl(code));
    addToast('Ссылка скопирована!', 'success');
  };

  const shareInvite = async (code) => {
    const url = getInviteUrl(code);
    if (!navigator.share) {
      await copyInvite(code);
      return;
    }
    await navigator.share({
      title: 'Card Quest — приглашение в гильдию',
      text: `Вступай в нашу гильдию "${family?.name}"!`,
      url,
    });
  };

  const revoke = async (id) => {
    await revokeInvitation(id);
    addToast('Приглашение отозвано.', 'success');
    await refreshInvites();
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-black text-white">Настройки</h1>
        <p className="text-sm font-bold text-white/50">Гильдия, участники, приглашения и данные</p>
      </header>

      <section className="card p-5">
        <h2 className="text-xl font-black text-[var(--text-primary)]">Гильдия</h2>
        <hr className="my-4 border-gray-100" />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input className="input-field" value={name} onChange={(event) => setName(event.target.value)} />
          <button type="button" className="btn-primary shrink-0" onClick={saveName}>
            Сохранить
          </button>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Участники гильдии</h2>
          {canManage ? (
            <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => setChildModalOpen(true)}>
              + Добавить ребёнка
            </button>
          ) : null}
        </div>
        <hr className="my-4 border-gray-100" />
        <div className="space-y-3">
          {members.map((member) => {
            const heroClass = HERO_CLASSES[member.classId];
            const canEditChild = canManage && member.member_role === 'child';
            const canDelete = canManage && member.member_role !== 'owner';
            return (
              <div key={member.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-gray-50 p-3">
                <div className="text-3xl">{member.avatar}</div>
                <div className="min-w-[150px] flex-1">
                  <div className="font-black text-[var(--text-primary)]">{member.name}</div>
                  <div className="text-xs font-bold text-[var(--text-muted)]">
                    {heroClass?.icon} {heroClass?.label} · ур. {member.level}
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--text-purple)] shadow-card">
                  {roleLabels[member.member_role] ?? member.role}
                </span>
                {canEditChild ? (
                  <button
                    type="button"
                    className="rounded-lg bg-white px-3 py-2 text-xs font-black text-[var(--text-purple)] shadow-card"
                    onClick={() => {
                      setEditingChild(member);
                      setChildModalOpen(true);
                    }}
                  >
                    Редактировать
                  </button>
                ) : null}
                {canDelete ? (
                  <button type="button" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-500" onClick={() => deleteMember(member)}>
                    Удалить
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {canManage ? (
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[var(--text-primary)]">Приглашения</h2>
              <p className="text-sm font-bold text-[var(--text-muted)]">Коды для взрослых участников с отдельным аккаунтом.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="input-field !w-24"
                type="number"
                min={1}
                max={20}
                value={inviteUses}
                onChange={(event) => setInviteUses(event.target.value)}
                aria-label="Количество использований"
              />
              <button type="button" className="btn-primary shrink-0 px-4 py-2 text-sm" onClick={createInvite} disabled={inviteLoading}>
                + Создать
              </button>
            </div>
          </div>
          <hr className="my-4 border-gray-100" />
          <div className="space-y-3">
            {invitations.length ? (
              invitations.map((invite) => (
                <div key={invite.id} className={`rounded-2xl bg-gray-50 p-4 ${invite.is_active ? '' : 'opacity-55'}`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="font-mono text-2xl font-black tracking-[0.18em] text-[var(--text-primary)]">{invite.code}</div>
                    <div className="text-xs font-black text-[var(--text-muted)]">
                      {formatDate(invite.created_at)} · {invite.uses_count}/{invite.max_uses} использ.
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => copyInvite(invite.code)}>
                      Скопировать
                    </button>
                    <button type="button" className="btn-primary px-3 py-2 text-xs" onClick={() => shareInvite(invite.code)}>
                      Поделиться
                    </button>
                    {invite.is_active ? (
                      <button type="button" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-500" onClick={() => revoke(invite.id)}>
                        Отозвать
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-gray-50 p-5 text-center text-sm font-bold text-[var(--text-muted)]">
                Активных приглашений пока нет.
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section className="card p-5">
        <h2 className="text-xl font-black text-[var(--text-primary)]">Тема</h2>
        <hr className="my-4 border-gray-100" />
        <div className="inline-grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
          {[
            { value: 'dark', label: '🌙 Тёмная' },
            { value: 'light', label: '☀️ Светлая' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={`rounded-lg px-4 py-2 text-sm font-black ${
                theme === option.value ? 'bg-white text-[var(--c-purple)] shadow-card' : 'text-gray-500'
              }`}
              onClick={() => theme !== option.value && toggleTheme()}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-black text-[var(--text-primary)]">Данные</h2>
        <hr className="my-4 border-gray-100" />
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={handleExport}>
            Экспорт
          </button>
          <button type="button" className="rounded-xl bg-red-500 px-6 py-3 font-black text-white shadow-card" onClick={handleReset}>
            Сбросить локально
          </button>
        </div>
      </section>

      <AddChildModal
        open={childModalOpen}
        child={editingChild}
        onClose={() => {
          setChildModalOpen(false);
          setEditingChild(null);
        }}
        onSubmit={submitChild}
      />
    </div>
  );
};
