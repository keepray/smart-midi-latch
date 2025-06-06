# MIDI Latch Script

A flexible MIDI latch script for advanced control of note and pedal behavior — especially useful for instruments with non-ending or long-sustaining sounds (e.g., drones, pads, modular synths, or reverb-heavy instruments).

## Key Use Case

This script is designed for setups where sounds do not naturally decay on their own. It allows you to *"freeze"* sounding notes at the moment you activate latch mode, regardless of whether you're still holding the keys or only the sustain pedal is keeping them alive.

**How it works:**
- You play and hold some notes.
- These notes may be physically held or just sounding via the sustain pedal.
- While the notes are still sounding, you activate *latch mode*.
- The script captures all currently sounding notes and keeps them sustained.
- Any further key or pedal input is ignored while latch is on — no new notes can sound.
- When you deactivate *latch mode*, all latched notes stop — **unless**:
  - the note is physically held again, or
  - the sustain pedal is still pressed.
