"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DesignPreview } from "@/components/DesignPreview";
import { LinkManager, type LinkItem } from "@/components/LinkManager";
import { api } from "@/lib/api";
import { isoToLocalInput, localInputToDate, localInputToIso } from "@/lib/time";
import type { DesignData } from "@/services/template/designs/types";

type Side = "BRIDE" | "GROOM" | "BOTH";

type EventForm = {
  id: string;
  name: string;
  side: Side;
  venue: string;
  address: string;
  mapUrl: string;
  startsAt: string;
  dressCode: string;
  note: string;
  designId: string;
};

type WeddingDetail = {
  id: string;
  brideName: string;
  groomName: string;
  slug: string;
  packageId: string;
  showDefaultPageWhenOff: boolean;
  events: {
    id: string;
    name: string;
    side: Side;
    venue: string;
    address: string | null;
    mapUrl: string | null;
    startsAt: string;
    dressCode: string | null;
    note: string | null;
    designId: string;
  }[];
};

type PackageDetail = {
  designs: { id: string; key: string; name: string; kind: "EVENT" | "SUMMARY"; eventType: string | null }[];
};

const EVENT_SUGGESTIONS = [
  "Roka",
  "Sagai",
  "Tilak",
  "Mehendi",
  "Haldi",
  "Sangeet",
  "Baraat",
  "Wedding Ceremony",
  "Reception",
];

function eventTypeOf(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:bg-stone-100 disabled:text-stone-600";

const editButtonClass =
  "rounded-lg border border-amber-700 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-stone-700">
      {label}
      {children}
    </label>
  );
}

export default function WeddingEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [wedding, setWedding] = useState<WeddingDetail | null>(null);
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [couple, setCouple] = useState({ brideName: "", groomName: "", showDefaultPageWhenOff: false });
  const [events, setEvents] = useState<EventForm[]>([]);
  const [selected, setSelected] = useState(0);
  const [editingCouple, setEditingCouple] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (select?: number) => {
      const loaded = await api<WeddingDetail>("GET", `/api/weddings/${id}`);
      const [loadedPackage, loadedLinks] = await Promise.all([
        api<PackageDetail>("GET", `/api/packages/${loaded.packageId}`),
        api<{ links: LinkItem[] }>("GET", `/api/weddings/${id}/links`),
      ]);
      setWedding(loaded);
      setPkg(loadedPackage);
      setLinks(loadedLinks.links);
      setCouple({
        brideName: loaded.brideName,
        groomName: loaded.groomName,
        showDefaultPageWhenOff: loaded.showDefaultPageWhenOff,
      });
      setEvents(
        loaded.events.map((event) => ({
          id: event.id,
          name: event.name,
          side: event.side,
          venue: event.venue,
          address: event.address ?? "",
          mapUrl: event.mapUrl ?? "",
          startsAt: isoToLocalInput(event.startsAt),
          dressCode: event.dressCode ?? "",
          note: event.note ?? "",
          designId: event.designId,
        })),
      );
      setSelected((current) => Math.min(select ?? current, Math.max(loaded.events.length - 1, 0)));
    },
    [id],
  );

  useEffect(() => {
    load().catch((failure) => setError(failure.message));
  }, [load]);

  function reportFailure(failure: unknown) {
    setStatus({ kind: "error", text: failure instanceof Error ? failure.message : "something went wrong" });
  }

  async function addEvent() {
    if (!pkg) {
      return;
    }
    const firstDesign = pkg.designs.find((item) => item.kind === "EVENT");
    if (!firstDesign) {
      return;
    }
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000 + 330 * 60000).toISOString().slice(0, 10);
    try {
      const created = await api<{ id: string }>("POST", `/api/weddings/${id}/events`, {
        name: "New event",
        side: "BOTH",
        venue: "Venue to be announced",
        address: null,
        mapUrl: null,
        startsAt: localInputToIso(`${tomorrow}T18:00`),
        dressCode: null,
        note: null,
        designId: firstDesign.id,
      });
      await load(events.length);
      setEditingEventId(created.id);
      setStatus({ kind: "ok", text: "Event added. Fill in its details and save." });
    } catch (failure) {
      reportFailure(failure);
    }
  }

  async function deleteEvent() {
    const event = events[selected];
    if (!window.confirm(`Delete ${event.name}? Links that only show this event will be deleted too.`)) {
      return;
    }
    try {
      await api("DELETE", `/api/events/${event.id}`);
      setEditingEventId((current) => (current === event.id ? null : current));
      await load(0);
      setStatus({ kind: "ok", text: `${event.name} deleted` });
    } catch (failure) {
      reportFailure(failure);
    }
  }

  async function deleteWedding() {
    if (!wedding) {
      return;
    }
    const title = `${wedding.groomName} & ${wedding.brideName}`;
    if (!window.confirm(`Delete the wedding of ${title}? Its events and invite links will be deleted too. This cannot be undone.`)) {
      return;
    }
    try {
      await api("DELETE", `/api/weddings/${id}`);
      router.replace("/dashboard");
    } catch (failure) {
      reportFailure(failure);
    }
  }

  function changeName(name: string) {
    const match = pkg?.designs.find((item) => item.kind === "EVENT" && item.eventType === eventTypeOf(name));
    updateEvent(match ? { name, designId: match.id } : { name });
  }

  function updateEvent(patch: Partial<EventForm>) {
    setEvents((current) => current.map((event, index) => (index === selected ? { ...event, ...patch } : event)));
  }

  async function saveCouple() {
    if (!wedding) {
      return;
    }
    try {
      await api("PUT", `/api/weddings/${id}`, { ...couple, slug: wedding.slug });
      setEditingCouple(false);
      setStatus({ kind: "ok", text: "Couple details saved" });
    } catch (failure) {
      setStatus({ kind: "error", text: failure instanceof Error ? failure.message : "could not save" });
    }
  }

  async function saveEvent() {
    const event = events[selected];
    try {
      await api("PUT", `/api/events/${event.id}`, {
        name: event.name,
        side: event.side,
        venue: event.venue,
        address: event.address || null,
        mapUrl: event.mapUrl || null,
        startsAt: localInputToIso(event.startsAt),
        dressCode: event.dressCode || null,
        note: event.note || null,
        designId: event.designId,
      });
      setEditingEventId(null);
      setStatus({ kind: "ok", text: `${event.name} saved` });
    } catch (failure) {
      setStatus({ kind: "error", text: failure instanceof Error ? failure.message : "could not save" });
    }
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!wedding || !pkg) {
    return <p className="text-stone-500">Loading...</p>;
  }

  const event: EventForm | undefined = events[selected];
  const isEditingEvent = event !== undefined && editingEventId === event.id;
  const design = event ? pkg.designs.find((item) => item.id === event.designId) : undefined;
  const previewData: DesignData | null = event
    ? {
        brideName: couple.brideName,
        groomName: couple.groomName,
        customText: null,
        events: [
          {
            id: event.id,
            name: event.name,
            startsAt: localInputToDate(event.startsAt),
            venue: event.venue,
            address: event.address || null,
            mapUrl: event.mapUrl || null,
            dressCode: event.dressCode || null,
            note: event.note || null,
            invitedBy: event.side,
          },
        ],
      }
    : null;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-amber-700 hover:underline">
          Back to weddings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          {couple.groomName} &amp; {couple.brideName}
        </h1>
        <p className="text-sm text-stone-500">/w/{wedding.slug}</p>
      </div>

      {status && (
        <p className={status.kind === "ok" ? "text-green-700" : "text-red-600"}>{status.text}</p>
      )}

      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Couple</h2>
        <fieldset disabled={!editingCouple} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Groom name">
              <input
                className={inputClass}
                value={couple.groomName}
                onChange={(e) => setCouple({ ...couple, groomName: e.target.value })}
              />
            </Field>
            <Field label="Bride name">
              <input
                className={inputClass}
                value={couple.brideName}
                onChange={(e) => setCouple({ ...couple, brideName: e.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={couple.showDefaultPageWhenOff}
              onChange={(e) => setCouple({ ...couple, showDefaultPageWhenOff: e.target.checked })}
            />
            Show a default page when a link is turned off
          </label>
        </fieldset>
        {editingCouple ? (
          <button onClick={saveCouple} className="rounded-lg bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800">
            Save couple
          </button>
        ) : (
          <button onClick={() => setEditingCouple(true)} className={editButtonClass}>
            Edit couple
          </button>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Events</h2>
        <div className="flex flex-wrap gap-2">
          {events.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelected(index)}
              className={`rounded-full border px-4 py-1 text-sm ${
                index === selected
                  ? "border-amber-700 bg-amber-700 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
              }`}
            >
              {item.name}
            </button>
          ))}
          <button
            onClick={addEvent}
            className="rounded-full border border-dashed border-amber-700 px-4 py-1 text-sm text-amber-700 hover:bg-amber-50"
          >
            Add event
          </button>
        </div>
        {!event && <p className="text-sm text-stone-500">No events yet. Add the first one to get started.</p>}

        {event && previewData && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
          <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
            <fieldset disabled={!isEditingEvent} className="m-0 min-w-0 space-y-4 border-0 p-0">
            <Field label="Event name">
              <input
                className={inputClass}
                list="event-suggestions"
                value={event.name}
                onChange={(e) => changeName(e.target.value)}
              />
              <datalist id="event-suggestions">
                {EVENT_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date and time (IST)">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={event.startsAt}
                  onChange={(e) => updateEvent({ startsAt: e.target.value })}
                />
              </Field>
              <Field label="Invited by">
                <select
                  className={inputClass}
                  value={event.side}
                  onChange={(e) => updateEvent({ side: e.target.value as Side })}
                >
                  <option value="BRIDE">Bride&apos;s family</option>
                  <option value="GROOM">Groom&apos;s family</option>
                  <option value="BOTH">Both families</option>
                </select>
              </Field>
            </div>
            <Field label="Venue">
              <input className={inputClass} value={event.venue} onChange={(e) => updateEvent({ venue: e.target.value })} />
            </Field>
            <Field label="Address">
              <input className={inputClass} value={event.address} onChange={(e) => updateEvent({ address: e.target.value })} />
            </Field>
            <Field label="Map link">
              <input className={inputClass} value={event.mapUrl} onChange={(e) => updateEvent({ mapUrl: e.target.value })} />
            </Field>
            <Field label="Dress code">
              <input className={inputClass} value={event.dressCode} onChange={(e) => updateEvent({ dressCode: e.target.value })} />
            </Field>
            <Field label="Note">
              <input className={inputClass} value={event.note} onChange={(e) => updateEvent({ note: e.target.value })} />
            </Field>
            <Field label="Design">
              <select className={inputClass} value={event.designId} onChange={(e) => updateEvent({ designId: e.target.value })}>
                {pkg.designs
                  .filter((item) => item.kind === "EVENT")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </Field>
            </fieldset>
            <div className="flex gap-3">
              {isEditingEvent ? (
                <button onClick={saveEvent} className="rounded-lg bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800">
                  Save {event.name}
                </button>
              ) : (
                <button onClick={() => setEditingEventId(event.id)} className={editButtonClass}>
                  Edit {event.name}
                </button>
              )}
              <button onClick={deleteEvent} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                Delete event
              </button>
            </div>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            {design && <DesignPreview designKey={design.key} data={previewData} scrollable />}
          </div>
        </div>
        )}
      </section>

      <LinkManager
        weddingId={wedding.id}
        events={wedding.events.map((item) => ({ id: item.id, name: item.name }))}
        summaryDesigns={pkg.designs.filter((item) => item.kind === "SUMMARY")}
        links={links}
        onChanged={() => load().catch((failure) => reportFailure(failure))}
      />

      <section className="space-y-3 rounded-2xl border border-red-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-red-700">Delete wedding</h2>
        <p className="text-sm text-stone-600">
          This deletes the wedding with all its events and invite links. Links already shared will stop working.
        </p>
        <button onClick={deleteWedding} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50">
          Delete wedding
        </button>
      </section>
    </div>
  );
}
