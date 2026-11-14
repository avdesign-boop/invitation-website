import { makeEventDesign } from "./eventDesign";
import { makeSummaryDesign } from "./summaryDesign";
import type { DesignComponent } from "./types";

const designs: Record<string, DesignComponent> = {
  "royal-mehendi": makeEventDesign({
    page: "bg-emerald-50 text-emerald-950",
    accent: "text-orange-600",
    card: "border border-emerald-200 bg-white/80",
    link: "text-emerald-700",
  }),
  "royal-haldi": makeEventDesign({
    page: "bg-yellow-50 text-yellow-950",
    accent: "text-amber-600",
    card: "border border-yellow-200 bg-white/80",
    link: "text-amber-700",
  }),
  "royal-sangeet": makeEventDesign({
    page: "bg-purple-950 text-purple-50",
    accent: "text-pink-300",
    card: "border border-purple-700 bg-purple-900/60",
    link: "text-pink-300",
  }),
  "royal-wedding": makeEventDesign({
    page: "bg-red-950 text-amber-50",
    accent: "text-amber-300",
    card: "border border-amber-400/40 bg-red-900/50",
    link: "text-amber-300",
  }),
  "royal-reception": makeEventDesign({
    page: "bg-stone-900 text-stone-50",
    accent: "text-amber-200",
    card: "border border-stone-600 bg-stone-800/60",
    link: "text-amber-200",
  }),
  "royal-summary-family": makeSummaryDesign({
    page: "bg-amber-50 text-stone-900",
    accent: "text-amber-700",
    card: "border border-amber-200 bg-white",
    link: "text-amber-700",
    greeting: "Join our family",
  }),
  "royal-summary-extended": makeSummaryDesign({
    page: "bg-rose-50 text-stone-900",
    accent: "text-rose-700",
    card: "border border-rose-200 bg-white",
    link: "text-rose-700",
    greeting: "You are warmly invited",
  }),
  "royal-summary-friends": makeSummaryDesign({
    page: "bg-sky-50 text-slate-900",
    accent: "text-sky-700",
    card: "border border-sky-200 bg-white",
    link: "text-sky-700",
    greeting: "Come celebrate with us",
  }),
};

export function getDesignComponent(key: string): DesignComponent | undefined {
  return designs[key];
}
