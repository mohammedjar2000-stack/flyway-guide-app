export function resolvePlaceHours(hours?: string | null, _categoryKey?: string): string {
  return hours?.trim() || '';
}

export function parseHours(hours: string): { isOpen: boolean; label: string; subLabel: string } {
  if (!hours) return { isOpen: false, label: 'غير محدد', subLabel: '' };
  if (hours.includes('24/7') || hours.toLowerCase().includes('24/7')) {
    return { isOpen: true, label: 'مفتوح 24/7', subLabel: 'يومياً' };
  }
  const match = hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return { isOpen: false, label: hours, subLabel: '' };
  const [, sh, sm, eh, em] = match;
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const startMin = parseInt(sh, 10) * 60 + parseInt(sm, 10);
  let endMin = parseInt(eh, 10) * 60 + parseInt(em, 10);
  if (endMin < startMin) endMin += 24 * 60;
  const open = currentMin >= startMin && currentMin <= endMin;
  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'م' : 'ص';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  };
  if (open) {
    return { isOpen: true, label: 'مفتوح الآن', subLabel: `يغلق ${formatTime(parseInt(eh, 10), parseInt(em, 10))}` };
  }
  return { isOpen: false, label: 'مغلق الآن', subLabel: `يفتح ${formatTime(parseInt(sh, 10), parseInt(sm, 10))}` };
}
