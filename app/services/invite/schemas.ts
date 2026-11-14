import { z } from "zod";

const side = z.enum(["BRIDE", "GROOM", "BOTH"]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null);

const linkEventSchema = z.object({
  eventId: z.string().min(1).max(100),
  invitedBy: side.nullish().transform((value) => value ?? null),
  startsAt: z
    .string()
    .datetime({ offset: true })
    .nullish()
    .transform((value) => (value ? new Date(value) : null)),
});

export const linkSchema = z.object({
  type: z.enum(["SUMMARY", "SINGLE_EVENT"]),
  side,
  audienceLabel: optionalText(100),
  designId: z
    .string()
    .min(1)
    .max(100)
    .nullish()
    .transform((value) => value ?? null),
  customText: optionalText(1000),
  events: z.array(linkEventSchema).min(1).max(50),
});

export const enabledSchema = z.object({
  enabled: z.boolean(),
});
