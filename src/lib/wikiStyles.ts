import type { CSSProperties } from "react";

export interface SeparadorItem {
  _id: string;
  title: string;
  description: string;
  order: number;
  imageUrl: string;
  textColor: string;
  bgColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: string;
  updatedAt?: string;
}

export interface TemaItem {
  _id: string;
  title: string;
  unit: number;
  separadorId?: string | null;
  content: string;
  imageUrl?: string;
  updatedAt?: string;
}

export const FONT_FAMILY_OPTIONS: Array<{
  value: string;
  label: string;
  css: string;
}> = [
  {
    value: "sans",
    label: "Sans-Serif Moderna (Sistema / Inter)",
    css: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    value: "serif",
    label: "Serif Clásica (Editorial)",
    css: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
  },
  {
    value: "mono",
    label: "Monospace Técnica (Código / Terminal)",
    css: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
  {
    value: "georgia",
    label: "Georgia (Académica)",
    css: "Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  },
  {
    value: "trebuchet",
    label: "Trebuchet MS (Display)",
    css: "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif",
  },
  {
    value: "verdana",
    label: "Verdana (Alta Legibilidad)",
    css: "Verdana, Geneva, Tahoma, sans-serif",
  },
  {
    value: "courier",
    label: "Courier New (Máquina de escribir)",
    css: "'Courier New', Courier, monospace",
  },
];

export const FONT_SIZE_OPTIONS: Array<{
  value: string;
  label: string;
  titleClass: string;
  bodyClass: string;
}> = [
  {
    value: "sm",
    label: "Compacto",
    titleClass: "text-lg",
    bodyClass: "text-xs leading-relaxed",
  },
  {
    value: "base",
    label: "Normal (Estándar)",
    titleClass: "text-xl",
    bodyClass: "text-sm leading-relaxed",
  },
  {
    value: "lg",
    label: "Grande (Destacado)",
    titleClass: "text-2xl",
    bodyClass: "text-base leading-relaxed",
  },
];

export function getFontFamilyCss(fontKey: string): string {
  const found = FONT_FAMILY_OPTIONS.find((f) => f.value === fontKey);
  return found ? found.css : FONT_FAMILY_OPTIONS[0].css;
}

export function getFontSizeClasses(sizeKey: string) {
  const found = FONT_SIZE_OPTIONS.find((s) => s.value === sizeKey);
  return found || FONT_SIZE_OPTIONS[1];
}

export function getSeparadorCardStyle(sep: Partial<SeparadorItem>): CSSProperties {
  return {
    fontFamily: getFontFamilyCss(sep.fontFamily || "sans"),
    color: sep.textColor || "#f8fafc",
    backgroundColor: sep.bgColor || "#0f172a",
    borderColor: sep.accentColor || "#10b981",
  };
}
