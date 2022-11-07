export default function parseTime(a: number, b: number) {
  // Convert diff to ms, seconds, minutes, hours, days
  const diff = Math.abs(a - b);
  const ms = diff;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  // If diff is less than 1 second, return ms
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms!`;
  }
  // If diff is less than 1 minute, return seconds
  if (seconds < 60) {
    return `${seconds}s!`;
  }
  // If diff is less than 1 hour, return minutes
  if (minutes < 60) {
    return `${minutes}m!`;
  }
  // If diff is less than 1 day, return hours
  if (hours < 24) {
    return `${hours}h!`;
  }
  // If diff is less than 1 week, return days
  if (days < 7) {
    return `${days}d!`;
  }
  // If diff is less than 1 month, return weeks
  if (weeks < 4) {
    return `${weeks}w!`;
  }
  // If diff is less than 1 year, return months
  if (months < 12) {
    return `${months}mo!`;
  }
  // If diff is more than 1 year, return years
  return `${years}y!`;
}
