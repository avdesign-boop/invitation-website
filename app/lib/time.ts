const IST_OFFSET_MINUTES = 330;

export function isoToLocalInput(iso: string): string {
  return new Date(new Date(iso).getTime() + IST_OFFSET_MINUTES * 60000).toISOString().slice(0, 16);
}

export function localInputToIso(value: string): string {
  return `${value}:00+05:30`;
}

export function localInputToDate(value: string): Date {
  const date = new Date(localInputToIso(value));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}
