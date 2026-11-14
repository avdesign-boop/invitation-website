import type { ReactElement } from "react";

export type InvitedBySide = "BRIDE" | "GROOM" | "BOTH";

export type DesignEvent = {
  id: string;
  name: string;
  startsAt: Date;
  venue: string;
  address: string | null;
  mapUrl: string | null;
  dressCode: string | null;
  note: string | null;
  invitedBy: InvitedBySide;
};

export type DesignData = {
  brideName: string;
  groomName: string;
  customText: string | null;
  events: DesignEvent[];
};

export type DesignComponent = (props: { data: DesignData }) => ReactElement;
