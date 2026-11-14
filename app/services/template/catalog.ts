export type CatalogDesign = {
  key: string;
  name: string;
  kind: "EVENT" | "SUMMARY";
  eventType?: string;
  guestType?: string;
};

export type CatalogPackage = {
  name: string;
  description: string;
  designs: CatalogDesign[];
};

export const royalMarigold: CatalogPackage = {
  name: "Royal Marigold",
  description: "Warm marigold and gold designs for every ceremony, with summary pages for each kind of guest.",
  designs: [
    { key: "royal-mehendi", name: "Mehendi", kind: "EVENT", eventType: "mehendi" },
    { key: "royal-haldi", name: "Haldi", kind: "EVENT", eventType: "haldi" },
    { key: "royal-sangeet", name: "Sangeet", kind: "EVENT", eventType: "sangeet" },
    { key: "royal-wedding", name: "Wedding Ceremony", kind: "EVENT", eventType: "wedding-ceremony" },
    { key: "royal-reception", name: "Reception", kind: "EVENT", eventType: "reception" },
    { key: "royal-summary-family", name: "Summary for close family", kind: "SUMMARY", guestType: "Close family" },
    { key: "royal-summary-extended", name: "Summary for extended family", kind: "SUMMARY", guestType: "Extended family" },
    { key: "royal-summary-friends", name: "Summary for friends", kind: "SUMMARY", guestType: "Friends" },
  ],
};
