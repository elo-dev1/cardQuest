import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '@/shared/data/taskTemplates';
import { HERO_CLASSES } from '@/shared/data/memberData';
import { MemberAvatar } from '@/shared/ui/MemberAvatar';
import { useStore } from '@/shared/store/useStore';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { TaskItem } from '@/entities/task/TaskItem';
import { AddTaskModal } from '@/features/add-task/ui/AddTaskModal';

export const TasksPage = () => {
  const members = useStore((state) => state.members);
  const authUserId = useStore((state) => state.authUserId);
  const allTasks = useStore((state) => state.tasks);
  const currentMember = useStore((state) => state.getCurrentMember());
  const getMemberProgress = useStore((state) => state.getMemberProgress);
  const isCompleted = useStore((state) => state.isCompleted);
  const [activeMemberId, setActiveMemberId] = useState(currentMember?.id || members[0]?.id);
  const [category, setCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (currentMember?.user_id && currentMember.user_id === authUserId) {
      setActiveMemberId(currentMember.id);
    } else if (members.length > 0) {
      const parentMember = members.find((m) => m.user_id === authUserId);
      if (parentMember) {
        setActiveMemberId(parentMember.id);
      }
    }
  }, []);

  const member = members.find((item) => item.id === activeMemberId) || currentMember || members[0];
  const heroClass = HERO_CLASSES[member?.classId];
  const progress = member ? getMemberProgress(member.id) : { completed: 0, total: 0, percent: 0 };
  const tasks = useMemo(() => {
    if (!member) return [];
    return allTasks.filter((task) => {
      if (task.assigned_to === 'all') return true;
      if (task.assigned_to === 'children') return member.role === 'child';
      if (task.assigned_to === 'parents') return member.role === 'parent';
      return task.assigned_to === member.id;
    }).filter((task) => category === 'all' || task.category === category);
  }, [allTasks, category, member]);
  const undone = tasks.filter((task) => !isCompleted(task.id, member.id));
  const done = tasks.filter((task) => isCompleted(task.id, member.id));
  const isOwnProfile = !member.user_id || member.user_id === authUserId;

  const chooseMember = (id) => {
    setActiveMemberId(id);
  };

  return (
    <div className="space-y-5">
      {/* Аватары участников — мобильный скролл */}
      <header className="member-scroll md:hidden">
        {members.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => chooseMember(item.id)}
            className={`member-avatar-btn ${item.id === member?.id ? 'active' : 'opacity-50'}`}
          >
            <MemberAvatar avatar={item.avatar} className="member-avatar-circle" />
            <span className="member-avatar-name">{item.name.split(' ')[0]}</span>
          </button>
        ))}
      </header>

      {/* Десктопная версия аватаров */}
      <header className="hidden md:flex gap-3 overflow-x-auto pb-1">
        {members.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => chooseMember(item.id)}
            className={`flex shrink-0 flex-col items-center gap-1.5 transition ${
              item.id === member?.id ? '' : 'opacity-50 hover:opacity-80'
            }`}
          >
            <MemberAvatar avatar={item.avatar} className={`h-12 w-12 rounded-full transition ${
              item.id === member?.id ? 'bg-[var(--charcoal)] text-white' : 'bg-[var(--bg-elevated)]'
            }`} />
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{item.name.split(' ')[0]}</span>
          </button>
        ))}
      </header>

      {/* Прогресс участника */}
      {member ? (
        <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
          {!isOwnProfile && (
            <div className="mb-3 rounded-[var(--r-sm)] bg-[var(--bg-elevated)] p-2 text-center text-xs font-medium text-[var(--text-tertiary)]">
              👁️ Просмотр профиля
            </div>
          )}
          <div className="flex items-center gap-3">
            <MemberAvatar avatar={member.avatar} className="h-12 w-12 rounded-full bg-[var(--bg-elevated)] text-2xl" />
            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] font-semibold text-[var(--text-primary)]">{member.name}</h1>
              {isOwnProfile && (
                <p className="text-[13px] font-medium text-[var(--text-secondary)]">
                  {progress.completed} из {progress.total} · {member.xp} XP · {member.coins} <img src="/common/money.png" alt="" className="inline-block w-4 h-4 align-text-bottom" />
                </p>
              )}
            </div>
          </div>
          {isOwnProfile && <ProgressBar value={progress.percent} height={8} variant="sand" className="mt-3" />}
        </section>
      ) : null}

      {/* Кнопка добавления задачи */}
      {isOwnProfile && (
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-6 py-2.5 text-sm"
        >
          + Новая задача
        </button>
      )}

      {/* Фильтры категорий — мобильный скролл pill */}
      <section className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`pill shrink-0 min-h-[44px] ${category === 'all' ? 'active' : ''}`}
        >
          Все
        </button>
        {Object.entries(CATEGORIES)
          .filter(([key]) => key !== 'special')
          .map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`pill shrink-0 min-h-[44px] ${category === key ? 'active' : ''}`}
            >
              <img src={item.iconSrc} alt="" className="inline-block w-4 h-4 align-text-bottom" /> {item.label}
            </button>
          ))}
      </section>

      {/* Задачи — полная ширина на мобайле, 2 колонки на десктопе */}
      <section className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-3">
        <AnimatePresence mode="popLayout">
          {undone.map((task, index) => (
            <TaskItem key={task.id} task={task} memberId={member.id} index={index} isInteractive={isOwnProfile} />
          ))}
        </AnimatePresence>
      </section>

      {/* Разделитель */}
      {done.length ? (
        <div className="flex items-center gap-3 text-[13px] font-medium text-[var(--text-tertiary)]">
          <span className="h-px flex-1 bg-[var(--border-soft)]" />
          Выполнено ({done.length})
          <span className="h-px flex-1 bg-[var(--border-soft)]" />
        </div>
      ) : null}

      <section className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-3">
        <AnimatePresence mode="popLayout">
          {done.map((task, index) => (
            <TaskItem key={task.id} task={task} memberId={member.id} index={index} isInteractive={isOwnProfile} />
          ))}
        </AnimatePresence>
      </section>

      <AddTaskModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
};
