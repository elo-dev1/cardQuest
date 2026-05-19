export const fireConfetti = () => {
  window.dispatchEvent(new CustomEvent('confetti:fire'));
};

export const fireTaskEffect = (effectType = 'golden_stars') => {
  window.dispatchEvent(new CustomEvent('task:effect', { detail: { effectType } }));
};
