import { v4 as uuidv4 } from 'uuid';

export const normalizeMember = (member, index = 0) => {
  const role = member.role ?? (member.member_role === 'child' ? 'child' : 'parent');
  const heroClass = member.classId ?? member.hero_class ?? member.heroClass ?? 'mage';
  return {
    ...member,
    id: member.id ?? uuidv4(),
    name: member.name ?? 'Герой',
    role,
    member_role: member.member_role ?? (role === 'child' ? 'child' : index === 0 ? 'owner' : 'parent'),
    avatar: member.avatar ?? '🧙',
    hero_class: heroClass,
    classId: heroClass,
    pin: member.pin ?? '',
    xp: member.xp ?? 0,
    coins: member.coins ?? 0,
    level: member.level ?? 1,
    xp_next: member.xp_next ?? 120,
    total_tasks: member.total_tasks ?? 0,
    isChild: role === 'child',
    order: member.order ?? index,
  };
};
