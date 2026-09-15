# FlowTime

Eine mobile-first Task-Timer-PWA nach dem Prinzip „Was mache ich jetzt, wie lange dauert es, wann bin ich fertig?" — Aufgabenplanung, geschätzte Dauer, Countdown-Timer und automatische Live-Endzeitberechnung in einem.

## Architektur

- **`src/lib/scheduleEngine.ts`** — reine Zeitplan-Berechnung (Aufgabe + Restzeit → Start-/Endzeiten, Gesamtdauer, Zielabgleich)
- **`src/lib/timerEngine.ts`** — Timer-Logik auf Basis von `startedAt`/`expectedEndAt` statt Sekunden-Countdown, inkl. Wiederherstellung nach Reload/Hintergrund (§22)
- **`src/lib/iconMatcher.ts`** / **`iconLibrary.ts`** — lokale Keyword-Icon-Erkennung, keine externe KI-Anfrage nötig
- **`src/store/`** — Zustand-Stores für Pläne (Templates), Session (Laufzeit, strikt getrennt von Templates), Einstellungen, gelernte Präferenzen
- **`src/lib/db.ts`** — Dexie/IndexedDB, komplett offline-fähig
- **`src/components/`**, **`src/pages/`** — UI (Heute, Pläne, Einstellungen, Timer-Vollbild, Faultier-Maskottchen)

## Entwicklung

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Erzeugt eine installierbare PWA (Service Worker, Manifest, App-Icons in `public/`, generiert via `scripts/generate-icons.cjs`).

## Bekannte nächste Schritte

- Bundle-Größe optimieren (aktuell wird das komplette Lucide-Icon-Set geladen; für Produktion ggf. auf eine kuratierte Icon-Teilmenge oder dynamische Imports umstellen)
- Echte Push-Notification-Actions (Start/Überspringen direkt aus der Benachrichtigung) erfordern einen Service-Worker mit `notificationclick`-Handling — aktuell bewusst auf einfache Titel/Text-Benachrichtigungen beschränkt (iOS-Grenzen, siehe `src/lib/notifications.ts`)
- Optionale Cloud-Synchronisation (App funktioniert vollständig ohne Konto)
