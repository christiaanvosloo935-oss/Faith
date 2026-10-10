import type { LayoutStyle, Motif, SectionKey, SermonLayout } from '../db';

export interface Palette {
  id: string;
  label: string;
  /** Page background, card surface, ink, accent. Dark variants for evening mode. */
  light: [string, string, string, string];
  dark: [string, string, string, string];
}

export const PALETTES: Palette[] = [
  { id: 'olive', label: 'Olive grove', light: ['#eef0e1', '#fafbf3', '#2f3a25', '#5b7a3a'], dark: ['#1b2015', '#252c1d', '#e6ead8', '#9cbc78'] },
  { id: 'cedar', label: 'Cedar', light: ['#f3e9da', '#fbf6ee', '#3b2a1e', '#8b5e3c'], dark: ['#211912', '#2d231a', '#efe3d1', '#d09a6c'] },
  { id: 'wheat', label: 'Wheat field', light: ['#f6eed7', '#fffaeb', '#3f3218', '#b8893b'], dark: ['#221d10', '#2e2716', '#f2e8cc', '#dcb064'] },
  { id: 'jordan', label: 'River Jordan', light: ['#e4eeec', '#f6fbfa', '#1e3434', '#3f7f7a'], dark: ['#122020', '#1a2c2c', '#d8ebe8', '#78bdb5'] },
  { id: 'stone', label: 'Hewn stone', light: ['#ebe7e1', '#f8f6f2', '#2f2b27', '#6d625a'], dark: ['#1b1917', '#262320', '#e8e3dc', '#b3a597'] },
  { id: 'vine', label: 'Wine & vine', light: ['#f2e6e4', '#fcf6f4', '#3a2023', '#7d3b46'], dark: ['#211416', '#2e1c1f', '#f0dcdd', '#d0838f'] },
];

export const MOTIFS: { id: Motif; label: string }[] = [
  { id: 'leaves', label: 'Leaves' },
  { id: 'vine', label: 'Vine' },
  { id: 'wheat', label: 'Wheat' },
  { id: 'waves', label: 'Living water' },
  { id: 'stone', label: 'Stones' },
  { id: 'stars', label: 'Stars' },
];

export const LAYOUT_STYLES: { id: LayoutStyle; label: string; hint: string }[] = [
  { id: 'scroll', label: 'Scroll', hint: 'One flowing column, like a parchment scroll' },
  { id: 'cards', label: 'Cards', hint: 'Each section on its own card in a grid' },
  { id: 'journal', label: 'Journal', hint: 'Lined pages with handwritten feel' },
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  passage: 'Passage',
  mainPoint: 'Main point',
  notes: 'Notes',
  questions: 'Discussion questions',
  application: 'This week’s step',
  followUps: 'Follow-through',
};

const ALL_SECTIONS: SectionKey[] = ['passage', 'mainPoint', 'notes', 'questions', 'application', 'followUps'];

function sections(order: SectionKey[]) {
  const rest = ALL_SECTIONS.filter((k) => !order.includes(k));
  return [...order, ...rest].map((key) => ({ key, visible: true }));
}

export interface SermonTheme {
  id: string;
  label: string;
  description: string;
  layout: SermonLayout;
}

export const SERMON_THEMES: SermonTheme[] = [
  {
    id: 'grace',
    label: 'Grace & Mercy',
    description: 'Gentle and reflective. The main point leads.',
    layout: { style: 'journal', motif: 'vine', palette: 'olive', serifBody: true, sections: sections(['mainPoint', 'passage', 'notes', 'application', 'questions', 'followUps']) },
  },
  {
    id: 'harvest',
    label: 'Harvest & Fruitfulness',
    description: 'Practical and action-first. Your step comes early.',
    layout: { style: 'cards', motif: 'wheat', palette: 'wheat', serifBody: false, sections: sections(['application', 'mainPoint', 'passage', 'questions', 'notes', 'followUps']) },
  },
  {
    id: 'water',
    label: 'Living Water',
    description: 'Flowing and Scripture-centred.',
    layout: { style: 'scroll', motif: 'waves', palette: 'jordan', serifBody: true, sections: sections(['passage', 'mainPoint', 'notes', 'questions', 'application', 'followUps']) },
  },
  {
    id: 'lament',
    label: 'Lament & Hope',
    description: 'Quiet and honest, with room to process.',
    layout: { style: 'journal', motif: 'stone', palette: 'stone', serifBody: true, sections: sections(['passage', 'notes', 'mainPoint', 'followUps', 'application', 'questions']) },
  },
  {
    id: 'kingdom',
    label: 'Kingdom & Mission',
    description: 'Bold and outward-facing. Questions for the group come first.',
    layout: { style: 'cards', motif: 'stars', palette: 'cedar', serifBody: false, sections: sections(['mainPoint', 'questions', 'application', 'passage', 'notes', 'followUps']) },
  },
  {
    id: 'shepherd',
    label: 'Shepherd & Care',
    description: 'Warm and pastoral.',
    layout: { style: 'scroll', motif: 'leaves', palette: 'olive', serifBody: true, sections: sections(['passage', 'mainPoint', 'application', 'notes', 'questions', 'followUps']) },
  },
  {
    id: 'covenant',
    label: 'Covenant & Communion',
    description: 'Rich and sacramental.',
    layout: { style: 'scroll', motif: 'vine', palette: 'vine', serifBody: true, sections: sections(['passage', 'mainPoint', 'notes', 'application', 'questions', 'followUps']) },
  },
];

export function themeById(id: string): SermonTheme {
  return SERMON_THEMES.find((t) => t.id === id) ?? SERMON_THEMES[0];
}

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export function cloneLayout(l: SermonLayout): SermonLayout {
  return { ...l, sections: l.sections.map((s) => ({ ...s })) };
}
