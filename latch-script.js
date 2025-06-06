// MIDI-Latch script by Felix Gabel
// Verson 2.0

var physicalNotesCurrentlyHeldDown = new Set()
var physicalPedalIsHeldDown = false
var notesCurrentlySustainedWithPedal = new Set()
var currentlyLatchedNotes = new Set()

var PluginParameters = [
    {
        name: "Latch",
        type: "menu",
        valueStrings: ["Off", "On"],
        defaultValue: 0,
        numberOfSteps: 1
    }
]

function HandleMIDI(event) {
    const mode = GetParameter("Latch")

    // Note On
    if (event instanceof NoteOn) {
        if (mode === 0 && !notesCurrentlySustainedWithPedal.has(event.pitch)) { // Remove " && !notesCurrentlySustainedWithPedal.has(event.pitch)" to allow retriggering notes held by the pedal. But I recommend keeping it if you’re using a pad sound, because it usually sounds better that way.
            event.send()
        }

        physicalNotesCurrentlyHeldDown.add(event.pitch)

        if (physicalPedalIsHeldDown) {
            notesCurrentlySustainedWithPedal.add(event.pitch)
        }

        return
    }

    // Note Off
    if (event instanceof NoteOff) {
        if (mode === 0 && (!physicalPedalIsHeldDown || !notesCurrentlySustainedWithPedal.has(event.pitch))) {
            event.send()
        }

        physicalNotesCurrentlyHeldDown.delete(event.pitch)
        
        return
    }

    // Sustain Pedal On/Off
    if (event instanceof ControlChange && event.number === 64) {
        physicalPedalIsHeldDown = event.value >= 64

        if (physicalPedalIsHeldDown) {
            for (const pitch of physicalNotesCurrentlyHeldDown) {
                notesCurrentlySustainedWithPedal.add(pitch)
            }
        } else {
            if (mode === 0) {
                for (const pitch of notesCurrentlySustainedWithPedal) {
                    if (!physicalNotesCurrentlyHeldDown.has(pitch)) {
                        const noteOff = new NoteOff()
                        noteOff.pitch = pitch
                        noteOff.send()
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
    const mode = GetParameter("Latch")

    // Latch ON
    if (mode === 1) {
        currentlyLatchedNotes = physicalPedalIsHeldDown ? new Set(notesCurrentlySustainedWithPedal) : new Set(physicalNotesCurrentlyHeldDown)
    }

    // Latch OFF
    if (mode === 0) {
        if (physicalPedalIsHeldDown) {
            notesCurrentlySustainedWithPedal = new Set(currentlyLatchedNotes)
        }
        
        for (const pitch of currentlyLatchedNotes) {
            if (!physicalNotesCurrentlyHeldDown.has(pitch) && !notesCurrentlySustainedWithPedal.has(pitch)) {
                const noteOff = new NoteOff()
                noteOff.pitch = pitch
                noteOff.send()
            }
        }
        
        currentlyLatchedNotes.clear()
    }
}
