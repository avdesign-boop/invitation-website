import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null);

export const eventSchema = z.object({
  name: z.string().trim().min(1).max(100),
  side: z.enum(["BRIDE", "GROOM", "BOTH"]),
  venue: z.string().trim().min(1).max(200),
  address: optionalText(300),
  mapUrl: optionalText(500).refine((value) => value === null || /^https?:\/\//.test(value)),
  startsAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
  dressCode: optionalText(100),
  note: optionalText(300),
  designId: z.string().min(1).max(100),
});

export const weddingCreateSchema = z.object({
  brideName: z.string().trim().min(1).max(100),
  groomName: z.string().trim().min(1).max(100),
  slug: z.string().trim().toLowerCase().max(60),
  packageId: z.string().min(1).max(100),
});

export const weddingUpdateSchema = z.object({
  brideName: z.string().trim().min(1).max(100),
  groomName: z.string().trim().min(1).max(100),
  slug: z.string().trim().toLowerCase().max(60),
  showDefaultPageWhenOff: z.boolean(),
});

export const reorderSchema = z.object({
  eventIds: z.array(z.string().min(1)).max(100),
});

export const slugCheckSchema = z.object({
  slug: z.string().trim().toLowerCase().min(1),
});
