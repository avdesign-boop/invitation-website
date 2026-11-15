import { Reveal } from "./Reveal";
import { formatDate, formatTime, invitedByLine, mapLink } from "./format";
import type { DesignComponent } from "./types";

export type EventTheme = {
  page: string;
  accent: string;
  card: string;
  link: string;
};

export function makeEventDesign(theme: EventTheme): DesignComponent {
  return function EventDesign({ data }) {
    const event = data.events[0];
    if (!event) {
      return <main className={`min-h-screen ${theme.page}`} />;
    }

    return (
      <main className={`min-h-screen ${theme.page}`}>
        <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <Reveal>
            <p className={`text-sm uppercase tracking-[0.3em] ${theme.accent}`}>You are invited to</p>
            <h1 className="mt-4 font-serif text-4xl sm:text-5xl">{event.name}</h1>
            <p className="mt-6 font-serif text-2xl">
              {data.groomName} &amp; {data.brideName}
            </p>
            {data.customText && <p className="mx-auto mt-6 max-w-sm opacity-80">{data.customText}</p>}
          </Reveal>
        </section>

        <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <Reveal>
            <p className={`text-sm uppercase tracking-[0.3em] ${theme.accent}`}>When</p>
            <p className="mt-4 font-serif text-3xl">{formatDate(event.startsAt)}</p>
            <p className="mt-2 text-xl">{formatTime(event.startsAt)}</p>
          </Reveal>
        </section>

        <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <Reveal className={`rounded-2xl p-8 ${theme.card}`}>
            <p className={`text-sm uppercase tracking-[0.3em] ${theme.accent}`}>Where</p>
            <p className="mt-4 font-serif text-2xl">{event.venue}</p>
            {event.address && <p className="mt-2 opacity-80">{event.address}</p>}
            <a className={`mt-4 inline-block underline ${theme.link}`} href={mapLink(event)}>
              View on map
            </a>
            {event.dressCode && <p className="mt-6 opacity-80">Dress code: {event.dressCode}</p>}
            {event.note && <p className="mt-2 italic opacity-80">{event.note}</p>}
          </Reveal>
        </section>

        <footer className="px-6 pb-16 pt-8 text-center">
          <Reveal>
            <p className="font-serif text-lg">{invitedByLine(data, event)}</p>
          </Reveal>
        </footer>
      </main>
    );
  };
}
