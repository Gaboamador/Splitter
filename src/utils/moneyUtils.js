export function parseMoneyToCents(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return 0;
  }

  const normalized = String(value)
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.round(parsed * 100);
}

export function formatMoneyFromCents(cents, currency = 'ARS') {
  const amount = (Number(cents) || 0) / 100;

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function splitAmountEqually(totalAmountCents, participantIds) {
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    return {};
  }

  const baseShare = Math.floor(totalAmountCents / participantIds.length);
  const remainder = totalAmountCents % participantIds.length;

  return participantIds.reduce((sharesMap, participantId, index) => {
    sharesMap[participantId] = baseShare + (index < remainder ? 1 : 0);
    return sharesMap;
  }, {});
}