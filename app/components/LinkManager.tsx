"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { localInputToIso } from "@/lib/time";

type Side = "BRIDE" | "GROOM" | "BOTH";

export type LinkItem = {
  id: string;
  type: "SUMMARY" | "SINGLE_EVENT";
  audienceLabel: string | null;
  enabled: boolean;
  eventCount: number;
  url: string;
};

type Selection = { on: boolean; startsAt: string; invitedBy: "" | Side };

const inputClass = "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm";

export function LinkManager({
  weddingId,
  events,
  summaryDesigns,
  links,
  onChanged,
}: {
  weddingId: string;
  events: { id: string; name: string }[];
  summaryDesigns: { id: string; name: string }[];
  links: LinkItem[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"SUMMARY" | "SINGLE_EVENT">("SUMMARY");
  const [audienceLabel, setAudienceLabel] = useState("");
  const [side, setSide] = useState<Side>("BOTH");
  const [customText, setCustomText] = useState("");
  const [designId, setDesignId] = useState(summaryDesigns[0]?.id ?? "");
  const [selection, setSelection] = useState<Record<string, Selection>>({});
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function selectionFor(id: string): Selection {
    return selection[id] ?? { on: false, startsAt: "", invitedBy: "" };
  }

  function update(id: string, patch: Partial<Selection>) {
    setSelection((current) => ({ ...current, [id]: { ...selectionFor(id), ...patch } }));
  }

  function toggle(id: string, on: boolean) {
    if (type === "SINGLE_EVENT" && on) {
      setSelection(Object.fromEntries(events.map((event) => [event.id, { ...selectionFor(event.id), on: event.id === id }])));
      return;
    }
    update(id, { on });
  }

  function changeType(next: "SUMMARY" | "SINGLE_EVENT") {
    setType(next);
    if (next === "SINGLE_EVENT") {
      const firstOn = events.find((event) => selectionFor(event.id).on);
      setSelection(Object.fromEntries(events.map((event) => [event.id, { ...selectionFor(event.id), on: event.id === firstOn?.id }])));
    }
  }

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      onChanged();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "something went wrong");
    }
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    const chosen = events.filter((item) => selectionFor(item.id).on);
    if (chosen.length === 0) {
      setError("Choose at least one event");
      return;
    }
    await run(async () => {
      await api("POST", `/api/weddings/${weddingId}/links`, {
        type,
        side,
        audienceLabel: audienceLabel || null,
        designId: type === "SUMMARY" ? designId : null,
        customText: customText || null,
        events: chosen.map((item) => {
          const picked = selectionFor(item.id);
          return {
            eventId: item.id,
            invitedBy: picked.invitedBy || null,
            startsAt: picked.startsAt ? localInputToIso(picked.startsAt) : null,
          };
        }),
      });
      setOpen(false);
      setAudienceLabel("");
      setCustomText("");
      setSelection({});
    });
  }

  async function copy(link: LinkItem) {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(link.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Could not copy the link");
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Invite links</h2>
        <button
          onClick={() => setOpen(!open)}
          disabled={events.length === 0}
          className="rounded-lg border border-stone-300 bg-white px-3 py-1 text-sm hover:bg-stone-100 disabled:opacity-50"
        >
          {open ? "Cancel" : "New link"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {open && (
        <form onSubmit={create} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={type === "SUMMARY"} onChange={() => changeType("SUMMARY")} />
              Summary of several events
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={type === "SINGLE_EVENT"} onChange={() => changeType("SINGLE_EVENT")} />
              Single event
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-stone-700">
              Who is this link for
              <input
                className={inputClass}
                value={audienceLabel}
                placeholder="Close family"
                onChange={(e) => setAudienceLabel(e.target.value)}
              />
            </label>
            <label className="block text-sm text-stone-700">
              Invited by
              <select className={inputClass} value={side} onChange={(e) => setSide(e.target.value as Side)}>
                <option value="BRIDE">Bride&apos;s family</option>
                <option value="GROOM">Groom&apos;s family</option>
                <option value="BOTH">Both families</option>
              </select>
            </label>
          </div>
          {type === "SUMMARY" && (
            <label className="block text-sm text-stone-700">
              Summary design
              <select className={inputClass} value={designId} onChange={(e) => setDesignId(e.target.value)}>
                {summaryDesigns.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm text-stone-700">
            Message for guests (optional)
            <input className={inputClass} value={customText} onChange={(e) => setCustomText(e.target.value)} />
          </label>
          <div className="space-y-2">
            <p className="text-sm text-stone-700">Events shown</p>
            {events.map((item) => {
              const picked = selectionFor(item.id);
              return (
                <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 px-3 py-2 text-sm">
                  <label className="flex min-w-40 items-center gap-2">
                    <input type="checkbox" checked={picked.on} onChange={(e) => toggle(item.id, e.target.checked)} />
                    {item.name}
                  </label>
                  {picked.on && (
                    <>
                      <label className="flex items-center gap-2 text-stone-600">
                        Time for this link
                        <input
                          type="datetime-local"
                          className="rounded-lg border border-stone-300 px-2 py-1"
                          value={picked.startsAt}
                          onChange={(e) => update(item.id, { startsAt: e.target.value })}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-stone-600">
                        Invited by
                        <select
                          className="rounded-lg border border-stone-300 px-2 py-1"
                          value={picked.invitedBy}
                          onChange={(e) => update(item.id, { invitedBy: e.target.value as "" | Side })}
                        >
                          <option value="">Link default</option>
                          <option value="BRIDE">Bride&apos;s family</option>
                          <option value="GROOM">Groom&apos;s family</option>
                          <option value="BOTH">Both families</option>
                        </select>
                      </label>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <button type="submit" className="rounded-lg bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800">
            Create link
          </button>
        </form>
      )}

      <ul className="space-y-2 text-sm">
        {links.length === 0 && <li className="text-stone-500">No links yet.</li>}
        {links.map((link) => (
          <li key={link.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
            <span className="font-medium">{link.audienceLabel ?? "Link"}</span>
            <span className="text-stone-500">
              {link.type === "SUMMARY" ? "Summary" : "Single event"} · {link.eventCount} event{link.eventCount === 1 ? "" : "s"}
            </span>
            {!link.enabled && <span className="text-red-600">Turned off</span>}
            <a href={link.url} target="_blank" rel="noreferrer" className="break-all text-amber-700 hover:underline">
              {link.url}
            </a>
            <span className="ml-auto flex gap-2">
              <button onClick={() => copy(link)} className="rounded-lg border border-stone-300 px-2 py-1 hover:bg-stone-100">
                {copied === link.id ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => run(() => api("PUT", `/api/links/${link.id}/enabled`, { enabled: !link.enabled }))}
                className="rounded-lg border border-stone-300 px-2 py-1 hover:bg-stone-100"
              >
                {link.enabled ? "Turn off" : "Turn on"}
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Delete this link? Anyone who has it will no longer be able to open it.")) {
                    run(() => api("DELETE", `/api/links/${link.id}`));
                  }
                }}
                className="rounded-lg border border-red-300 px-2 py-1 text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
