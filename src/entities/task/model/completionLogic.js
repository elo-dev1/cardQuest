export const normalizeCompletion = (completion) => {
  let date = completion.date;
  if (!date && completion.completed_at) {
    date = new Date(completion.completed_at).toISOString().split('T')[0];
  }
  if (date instanceof Date) {
    date = date.toISOString().split('T')[0];
  }
  if (date && typeof date === 'string' && date.includes('T')) {
    date = date.split('T')[0];
  }

  return {
    ...completion,
    date,
    taskId: completion.taskId ?? completion.task_id,
    task_id: completion.task_id ?? completion.taskId,
    memberId: completion.memberId ?? completion.member_id,
    member_id: completion.member_id ?? completion.memberId,
  };
};
