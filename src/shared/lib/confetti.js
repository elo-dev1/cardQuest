export const fireConfetti = () => {
  window.dispatchEvent(new CustomEvent('confetti:fire'));
};
