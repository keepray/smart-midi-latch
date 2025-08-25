// MIDI-Latch script by Felix Gabel
// Verson 2.1

var physicalNotesCurrentlyHeldDown = new Set()
var physicalPedalIsHeldDown = false
var notesCurrentlySustainedWithPedal = new Set()
var currentlyLatchedNotes = new Set()

var PluginParameters = [
  {
    name: 'Latch',
    type: 'menu',
    valueStrings: ['Off', 'On'],
    defaultValue: 0,
    numberOfSteps: 1
  }
]

function getNoteKey(event) {
  return event.channel + ':' + event.pitch
}

function sendNoteOffFromNoteKey(key) {
  const [channel, pitch] = key.split(':').map(Number)
  const noteOff = new NoteOff()
  noteOff.pitch = pitch
  noteOff.channel = channel
  noteOff.send()
}

function HandleMIDI(event) {
  const mode = GetParameter('Latch')
  const noteKey = getNoteKey(event)

  // Note On
  if (event instanceof NoteOn) {
    if (mode === 0 && !notesCurrentlySustainedWithPedal.has(noteKey)) {
      // Remove " && !notesCurrentlySustainedWithPedal.has(noteKey)" to allow retriggering notes held by the pedal. But I recommend keeping it if you’re using a pad sound, because it usually sounds better that way.
      event.send()
    }

    physicalNotesCurrentlyHeldDown.add(noteKey)

    if (physicalPedalIsHeldDown) {
      notesCurrentlySustainedWithPedal.add(noteKey)
    }

    return
  }

  // Note Off
  if (event instanceof NoteOff) {
    if (
      mode === 0 &&
      (!physicalPedalIsHeldDown ||
        !notesCurrentlySustainedWithPedal.has(noteKey))
    ) {
      event.send()
    }

    physicalNotesCurrentlyHeldDown.delete(noteKey)

    return
  }

  // Sustain Pedal On/Off
  if (event instanceof ControlChange && event.number === 64) {
    physicalPedalIsHeldDown = event.value >= 64

    if (physicalPedalIsHeldDown) {
      for (const noteKey of physicalNotesCurrentlyHeldDown) {
        notesCurrentlySustainedWithPedal.add(noteKey)
      }
    } else {
      if (mode === 0) {
        for (const noteKey of notesCurrentlySustainedWithPedal) {
          if (!physicalNotesCurrentlyHeldDown.has(noteKey)) {
            sendNoteOffFromNoteKey(noteKey)
          }
        }
      }

      notesCurrentlySustainedWithPedal.clear()
    }

    return
  }

  // Sending all remaining events
  event.send()
}

function ParameterChanged(param) {
  const mode = GetParameter('Latch')

  // Latch ON
  if (mode === 1) {
    currentlyLatchedNotes = physicalPedalIsHeldDown
      ? new Set(notesCurrentlySustainedWithPedal)
      : new Set(physicalNotesCurrentlyHeldDown)
  }

  // Latch OFF
  if (mode === 0) {
    if (physicalPedalIsHeldDown) {
      notesCurrentlySustainedWithPedal = new Set(currentlyLatchedNotes)
    }

    for (const noteKey of currentlyLatchedNotes) {
      if (
        !physicalNotesCurrentlyHeldDown.has(noteKey) &&
        !notesCurrentlySustainedWithPedal.has(noteKey)
      ) {
        sendNoteOffFromNoteKey(noteKey)
      }
    }

    currentlyLatchedNotes.clear()
  }
}
