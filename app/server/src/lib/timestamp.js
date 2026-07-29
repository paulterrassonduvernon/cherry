// Sortable, collision-resistant filename stem for anything timestamped on
// disk (entries, synthesis versions): millisecond precision so two writes
// almost never collide; callers add a random suffix on the rare collision.
export function timestampFilename(date) {
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}` +
    `-${pad(date.getMilliseconds(), 3)}`
  );
}
