import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HERO_CLASSES } from '@/shared/data/memberData';
import { MemberAvatar } from '@/shared/ui/MemberAvatar';
import { AddChildModal } from '@/features/add-child/ui/AddChildModal';
import { generateInviteCode, getFamilyInvitations, getInviteUrl, revokeInvitation } from '@/features/invite/model/inviteActions';
import { useStore } from '@/shared/store/useStore';
import { authActions } from '@/features/auth/model/authActions';

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
    if (!name.trim()) {
      addToast('Название гильдии не может быть пустым', 'error');
      return;
    }
    updateGuildName(name.trim());
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

  const handleLogout = async () => {
    if (!window.confirm('Вы действительно хотите выйти из аккаунта?')) return;
    try {
      await authActions.signOut();
      addToast('Вы успешно вышли из системы.', 'info');
      navigate('/auth', { replace: true });
    } catch (error) {
      addToast(error.message || 'Ошибка при выходе', 'error');
    }
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
        <h1 className="text-[17px] font-semibold text-[var(--text-primary)]">Настройки</h1>
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">Гильдия, участники, приглашения и данные</p>
      </header>

      {/* Гильдия */}
      <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Гильдия</h2>
        <hr className="my-4 border-[var(--border-soft)]" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <input 
              className="input-field" 
              value={name} 
              maxLength={50}
              onChange={(event) => setName(event.target.value)} 
            />
            <button type="button" className="btn-primary shrink-0" onClick={saveName}>
              Сохранить
            </button>
          </div>
      </section>

      {/* Участники */}
      <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Участники гильдии</h2>
          {canManage ? (
            <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => setChildModalOpen(true)}>
              + Добавить ребёнка
            </button>
          ) : null}
        </div>
        <hr className="my-4 border-[var(--border-soft)]" />
        <div className="space-y-3">
          {members.map((member) => {
            const heroClass = HERO_CLASSES[member.classId];
            const canEditChild = canManage && member.member_role === 'child';
            const canDelete = canManage && member.member_role !== 'owner';
            return (
              <div key={member.id} className="flex flex-wrap items-center gap-3 rounded-[var(--r-md)] bg-[var(--bg-elevated)] p-3">
                <MemberAvatar avatar={member.avatar} className="h-10 w-10 rounded-full bg-[var(--bg-elevated)] text-2xl" />
                <div className="min-w-[150px] flex-1">
                  <div className="font-semibold text-[var(--text-primary)]">{member.name}</div>
                  <div className="text-xs font-medium text-[var(--text-secondary)]">
                    {heroClass?.iconSrc ? <img src={heroClass.iconSrc} alt="" className="inline-block w-4 h-4 align-text-bottom" /> : heroClass?.icon} {heroClass?.label} · ур. {member.level}
                  </div>
                </div>
                <span className="rounded-full bg-[var(--bg-surface)] px-3 py-1 text-xs font-medium text-[var(--slate)] shadow-sm">
                  {roleLabels[member.member_role] ?? member.role}
                </span>
                {canEditChild ? (
                  <button
                    type="button"
                    className="rounded-full bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--slate)] shadow-sm"
                    onClick={() => {
                      setEditingChild(member);
                      setChildModalOpen(true);
                    }}
                  >
                    Редактировать
                  </button>
                ) : null}
                {canDelete ? (
                  <button type="button" className="rounded-full bg-[var(--clay-bg)] px-3 py-2 text-xs font-medium text-[var(--clay)]" onClick={() => deleteMember(member)}>
                    Удалить
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Приглашения */}
      {canManage ? (
        <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Приглашения</h2>
              <p className="text-[13px] font-medium text-[var(--text-secondary)]">Коды для взрослых участников с отдельным аккаунтом.</p>
            </div>
            <div className="flex items-center gap-2">
               <input
                 className="input-field !w-24"
                 type="number"
                 min={1}
                 max={20}
                 value={inviteUses}
                 onChange={(event) => {
                   const val = Math.min(20, Math.max(1, Number(event.target.value) || 1));
                   setInviteUses(val);
                 }}
                 aria-label="Количество использований"
               />
              <button type="button" className="btn-primary shrink-0 px-4 py-2 text-sm" onClick={createInvite} disabled={inviteLoading}>
                + Создать
              </button>
            </div>
          </div>
          <hr className="my-4 border-[var(--border-soft)]" />
          <div className="space-y-3">
            {invitations.length ? (
              invitations.map((invite) => (
                <div key={invite.id} className={`rounded-[var(--r-md)] bg-[var(--bg-elevated)] p-4 ${invite.is_active ? '' : 'opacity-55'}`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="font-mono text-2xl font-semibold tracking-[0.18em] text-[var(--text-primary)]">{invite.code}</div>
                    <div className="text-xs font-medium text-[var(--text-secondary)]">
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
                      <button type="button" className="rounded-full bg-[var(--clay-bg)] px-3 py-2 text-xs font-medium text-[var(--clay)]" onClick={() => revoke(invite.id)}>
                        Отозвать
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[var(--r-md)] bg-[var(--bg-elevated)] p-5 text-center text-sm font-medium text-[var(--text-secondary)]">
                Активных приглашений пока нет.
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Тема */}
      <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Тема</h2>
        <hr className="my-4 border-[var(--border-soft)]" />
        <div className="inline-grid grid-cols-2 gap-1 rounded-full bg-[var(--bg-elevated)] p-1">
          {[
            { value: 'dark', label: 'Тёмная', icon: '/common/night.png' },
            { value: 'light', label: 'Светлая', icon: '/common/light.png' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                theme === option.value ? 'bg-[var(--bg-surface)] text-[var(--charcoal)] shadow-sm' : 'text-[var(--text-secondary)]'
              }`}
              onClick={() => theme !== option.value && toggleTheme()}
            >
              <img src={option.icon} alt="" className="inline-block w-5 h-5 align-text-bottom" /> {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Аккаунт */}
      <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Аккаунт</h2>
        <hr className="my-4 border-[var(--border-soft)]" />
        <button type="button" className="btn-logout w-full flex items-center justify-center gap-2" onClick={handleLogout}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Выйти из аккаунта
        </button>
      </section>

      {/* Данные */}
      <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Данные</h2>
        <hr className="my-4 border-[var(--border-soft)]" />
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={handleExport}>
            Экспорт
          </button>
          <button type="button" className="rounded-full bg-[var(--clay)] px-6 py-3 font-semibold text-white shadow-sm" onClick={handleReset}>
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
