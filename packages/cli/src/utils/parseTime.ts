export default function parseTime(a: number, b: number) {
  // Convert diff to seconds, minutes, hours, days
  const diff = Math.abs(a - b);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  // Return the appropriate string
  if (days > 0) {
    return `${days} d!`;
  }
  if (hours > 0) {
    return `${hours} h!`;
  }
  if (minutes > 0) {
    return `${minutes} min!`;
  }
  if (seconds > 0) {
    return `${seconds} s!`;
  }
  return `${diff.toFixed(2)} ms!`;
}
