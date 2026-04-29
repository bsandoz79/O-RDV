export function buildGoogleCalendarUrl({ title, description, startDate, durationMinutes }) {
  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const fmt = (d) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description || '',
    dates: `${fmt(start)}/${fmt(end)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
