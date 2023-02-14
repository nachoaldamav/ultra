export function convertTime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);
  const months = Math.floor(days / 30);
  const weeks = Math.floor(days / 7);
  if (ms < 1000) {
    return `${ms.toFixed(2)} ms`;
  }
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  if (weeks < 4) {
    return `${weeks} week${weeks === 1 ? '' : 's'}`;
  }
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  if (years < 10) {
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  return `${years} years`;
}
