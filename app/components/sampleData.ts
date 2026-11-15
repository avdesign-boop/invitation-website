import type { DesignData, DesignEvent } from "@/services/template/designs/types";

function sampleEvent(id: string, name: string, startsAt: string, invitedBy: DesignEvent["invitedBy"]): DesignEvent {
  return {
    id,
    name,
    startsAt: new Date(startsAt),
    venue: "The Grand Pavilion",
    address: "Civil Lines, Jaipur",
    mapUrl: null,
    dressCode: "Traditional",
    note: "We would love to celebrate with you",
    invitedBy,
  };
}

export function sampleDataFor(kind: "EVENT" | "SUMMARY", designName: string): DesignData {
  const events =
    kind === "EVENT"
      ? [sampleEvent("sample", designName, "2027-02-12T18:30:00+05:30", "BOTH")]
      : [
          sampleEvent("sample-1", "Mehendi", "2027-02-10T16:00:00+05:30", "BRIDE"),
          sampleEvent("sample-2", "Wedding Ceremony", "2027-02-12T18:30:00+05:30", "BOTH"),
          sampleEvent("sample-3", "Reception", "2027-02-13T20:00:00+05:30", "GROOM"),
        ];
  return { brideName: "Meera", groomName: "Aarav", customText: null, events };
}
