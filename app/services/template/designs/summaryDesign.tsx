import { Reveal } from "./Reveal";
import { formatDate, formatTime, invitedByLine, mapLink } from "./format";
import type { DesignComponent } from "./types";

export type SummaryTheme = {
  page: string;
  accent: string;
  card: string;
  link: string;
  greeting: string;
};

export function makeSummaryDesign(theme: SummaryTheme): DesignComponent {
  return function SummaryDesign({ data }) {
    return (
      <main className={`min-h-screen px-6 py-16 ${theme.page}`}>
        <div className="mx-auto max-w-md">
          <Reveal className="text-center">
            <p className={`text-sm uppercase tracking-[0.3em] ${theme.accent}`}>{theme.greeting}</p>
            <h1 className="mt-4 font-serif text-5xl">
              {data.groomName} &amp; {data.brideName}
            </h1>
            {data.customText && <p className="mt-6 opacity-80">{data.customText}</p>}
          </Reveal>

          <div className="mt-12 space-y-6">
            {data.events.map((event) => (
              <Reveal key={event.id} className={`rounded-2xl p-6 ${theme.card}`}>
                <h2 className="font-serif text-2xl">{event.name}</h2>
                <p className="mt-3 font-medium">{formatDate(event.startsAt)}</p>
                <p className="opacity-80">{formatTime(event.startsAt)}</p>
                <p className="mt-3">{event.venue}</p>
                {event.address && <p className="text-sm opacity-70">{event.address}</p>}
                {event.dressCode && <p className="mt-2 text-sm opacity-70">Dress code: {event.dressCode}</p>}
                {event.note && <p className="mt-1 text-sm italic opacity-70">{event.note}</p>}
                <a className={`mt-3 inline-block text-sm underline ${theme.link}`} href={mapLink(event)}>
                  View on map
                </a>
                <p className="mt-4 text-sm opacity-80">{invitedByLine(data, event)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </main>
    );
  };
}
