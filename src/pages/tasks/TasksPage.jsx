import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from '@/shared/data/taskTemplates';
import { HERO_CLASSES } from '@/shared/data/memberData';
import { useStore } from '@/shared/store/useStore';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { TaskItem } from '@/entities/task/TaskItem';
import { AddTaskModal } from '@/features/add-task/ui/AddTaskModal';

export const TasksPage = () => {
  const members = useStore((state) => state.members);
  const authUserId = useStore((state) => state.authUserId);
  const allTasks = useStore((state) => state.tasks);
  const currentMember = useStore((state) => state.getCurrentMember());
  const setCurrentMember = useStore((state) => state.setCurrentMember);
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
    const target = members.find((m) => m.id === id);
    if (target?.user_id && target.user_id !== authUserId) {
      setActiveMemberId(id);
    } else {
      setActiveMemberId(id);
      setCurrentMember(id);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap gap-2">
        {members.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => chooseMember(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              item.id === member?.id ? 'bg-[var(--c-purple)] text-white shadow-purple' : 'bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            {item.avatar} {item.name}
          </button>
        ))}
      </header>

      {member ? (
        <section className="card-dark p-4">
          {!isOwnProfile && (
            <div className="mb-3 rounded-lg bg-white/5 p-2 text-center text-xs font-bold text-white/50">
              👁️ Просмотр профиля
            </div>
          )}
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-3xl">{member.avatar}</div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black text-white">{member.name}</h1>
              {isOwnProfile && (
                <p className="text-sm font-bold text-white/55">
                  {heroClass?.icon} {heroClass?.label} · {progress.completed}/{progress.total} задач · {member.xp} XP · {member.coins} 💰
                </p>
              )}
            </div>
          </div>
          {isOwnProfile && <ProgressBar value={progress.percent} height={9} color="linear-gradient(90deg,#fde68a,#f59e0b)" />}
        </section>
      ) : null}

      {isOwnProfile && (
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="mb-3 rounded-full bg-[var(--c-purple)] px-5 py-2.5 text-sm font-black text-white shadow-purple transition hover:-translate-y-0.5"
        >
          + Новая задача
        </button>
      )}

      <section className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
            category === 'all' ? 'bg-[var(--c-purple)] text-white' : 'bg-white/10 text-white/60'
          }`}
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
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
                category === key ? 'bg-[var(--c-purple)] text-white' : 'bg-white/10 text-white/60'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {undone.map((task, index) => (
          <TaskItem key={task.id} task={task} memberId={member.id} index={index} isInteractive={isOwnProfile} />
        ))}
      </section>

      {done.length ? (
        <div className="flex items-center gap-3 text-sm font-black text-white/35">
          <span className="h-px flex-1 bg-white/10" />
          Выполнено ({done.length})
          <span className="h-px flex-1 bg-white/10" />
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {done.map((task, index) => (
          <TaskItem key={task.id} task={task} memberId={member.id} index={index} isInteractive={isOwnProfile} />
        ))}
      </section>

      <AddTaskModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
};
