import { useNavigate } from 'react-router-dom';
import { useStore } from '@/shared/store/useStore';
import { MemberAvatar } from '@/shared/ui/MemberAvatar';

export const MobileHeader = () => {
  const navigate = useNavigate();
  const member = useStore((state) => state.getCurrentMember());
  const openProfileSelect = useStore((state) => state.openProfileSelect);

  const handleAvatarClick = () => {
    if (openProfileSelect) {
      openProfileSelect();
    } else {
      window.dispatchEvent(new CustomEvent('open-profile-select'));
    }
  };

  const handleCoinsClick = () => {
    navigate('/shop');
  };

  if (!member) return null;

  return (
    <header className="mobile-header">
      <button
        type="button"
        className="mobile-header-avatar"
        onClick={handleAvatarClick}
      >
        <MemberAvatar avatar={member.avatar} className="h-full w-full" />
      </button>
      <span className="mobile-header-name">{member.name}</span>
      <button
        type="button"
        className="mobile-header-coins"
        onClick={handleCoinsClick}
      >
        <img src="/common/money.png" alt="" className="h-5 w-5" />
        <span>{member.coins || 0}</span>
      </button>
    </header>
  );
};
