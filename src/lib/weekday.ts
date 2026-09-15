import type { Weekday } from '../types/models';

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Montag',
  1: 'Dienstag',
  2: 'Mittwoch',
  3: 'Donnerstag',
  4: 'Freitag',
  5: 'Samstag',
  6: 'Sonntag',
};

export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  0: 'Mo',
  1: 'Di',
  2: 'Mi',
  3: 'Do',
  4: 'Fr',
  5: 'Sa',
  6: 'So',
};

export const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** Heutiger Wochentag als Weekday (0=Montag…6=Sonntag), aus JS' 0=Sonntag umgerechnet. */
export function currentWeekday(): Weekday {
  const jsDay = new Date().getDay();
  return ((jsDay + 6) % 7) as Weekday;
}
