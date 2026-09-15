import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DEFAULT_ICON } from './iconMatcher';

const IconMap = Icons as unknown as Record<string, LucideIcon>;

export function getIconComponent(name: string | null | undefined): LucideIcon {
  if (name && IconMap[name]) return IconMap[name];
  return IconMap[DEFAULT_ICON];
}

export interface IconCategory {
  label: string;
  icons: string[];
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    label: 'Körperpflege',
    icons: ['ShowerHead', 'Bath', 'Toothbrush', 'Sparkles', 'Shirt', 'Droplets'],
  },
  {
    label: 'Essen & Trinken',
    icons: ['Coffee', 'CookingPot', 'Utensils', 'UtensilsCrossed', 'Soup', 'Salad', 'Pizza', 'GlassWater', 'Milk'],
  },
  {
    label: 'Haushalt',
    icons: ['WashingMachine', 'BrushCleaning', 'SprayCan', 'House', 'Trash2', 'Sofa', 'Refrigerator'],
  },
  {
    label: 'Einkaufen',
    icons: ['ShoppingBasket', 'ShoppingCart', 'ShoppingBag'],
  },
  {
    label: 'Arbeit',
    icons: ['Laptop', 'Briefcase', 'Mail', 'Phone', 'Users', 'PenLine', 'ClipboardList', 'StickyNote'],
  },
  {
    label: 'Lernen',
    icons: ['BookOpen', 'GraduationCap', 'School'],
  },
  {
    label: 'Sport & Bewegung',
    icons: ['Dumbbell', 'Footprints', 'Bike', 'PersonStanding'],
  },
  {
    label: 'Mobilität',
    icons: ['Car', 'Bus', 'TrainFront', 'Fuel', 'Plane', 'ParkingCircle'],
  },
  {
    label: 'Termine & Pausen',
    icons: ['CalendarClock', 'Clock', 'AlarmClock', 'Armchair', 'Bed', 'Brain'],
  },
  {
    label: 'Tiere & Pflanzen',
    icons: ['Dog', 'Cat', 'Sprout', 'Flower2'],
  },
  {
    label: 'Gesundheit',
    icons: ['Stethoscope', 'Pill', 'HeartPulse', 'HeartHandshake'],
  },
  {
    label: 'Sonstiges',
    icons: ['Backpack', 'ListTodo', 'CircleDot', 'Timer', 'Music', 'Camera', 'Wrench', 'Palette', 'Smile'],
  },
];

export const ALL_PICKER_ICONS: string[] = Array.from(
  new Set(ICON_CATEGORIES.flatMap((c) => c.icons)),
);
