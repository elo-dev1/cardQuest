export const MemberAvatar = ({ avatar, fallback = '', className = '' }) => {
  const src = avatar || fallback;
  if (!src) return null;

  if (src.startsWith('data:')) {
    return (
      <div className={`${className} overflow-hidden`}>
        <img src={src} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${className} grid place-items-center`}>
      {src}
    </div>
  );
};
