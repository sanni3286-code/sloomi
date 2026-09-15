/** Dezentes haptisches Feedback, sofern vom Gerät unterstützt (Spec §32). */

function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Vibration API kann in manchen Kontexten (z.B. iOS Safari) fehlen oder blockiert sein.
  }
}

export const haptics = {
  light: () => vibrate(10),
  taskCompleted: () => vibrate([15, 40, 15]),
  skip: () => vibrate(8),
};
