import type { DesignData, DesignEvent } from "./types";

const timeZone = "Asia/Kolkata";

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function invitedByLine(data: DesignData, event: DesignEvent): string {
  if (event.invitedBy === "BRIDE") {
    return `With love from ${data.brideName}'s family`;
  }
  if (event.invitedBy === "GROOM") {
    return `With love from ${data.groomName}'s family`;
  }
  return `With love from the families of ${data.groomName} and ${data.brideName}`;
}

export function mapLink(event: DesignEvent): string {
  return event.mapUrl ?? `https://www.google.com/maps/search/${encodeURIComponent(event.venue)}`;
}
