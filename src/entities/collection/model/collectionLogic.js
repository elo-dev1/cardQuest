export const normalizeCollectionItem = (item) => ({
  ...item,
  cardId: item.cardId ?? item.card_id,
  card_id: item.card_id ?? item.cardId,
  count: item.count ?? 1,
  isNew: item.isNew ?? item.is_new ?? false,
  stars: item.stars ?? 0,
  addedAt: item.addedAt ?? (item.obtained_at ? new Date(item.obtained_at).getTime() : 0),
});

export const normalizeMemberCollections = (collections, members) => {
  const result = {};
  const collectionsByMember = (Array.isArray(collections) ? collections : []).reduce((acc, item) => {
    if (!acc[item.member_id]) acc[item.member_id] = [];
    acc[item.member_id].push(normalizeCollectionItem(item));
    return acc;
  }, {});

  members.forEach((member) => {
    result[member.id] = collectionsByMember[member.id] || [];
  });

  return result;
};
