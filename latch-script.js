// MIDI-Latch script by Felix Gabel
// Version 1.0

var physicalNotesCurrentlyHeldDown = []
var physicalPedalIsHeldDown = false
var notesCurrentlySustainedWithPedal = []
var currentlyLatchedNotes = []

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
    var mode = GetParameter("Latch")

    // note on
    if (event instanceof NoteOn) {
        if (mode === 0 && !notesCurrentlySustainedWithPedal.includes(event.pitch)) { // Remove " && !notesCurrentlySustainedWithPedal.includes(event.pitch)" to allow retriggering notes held by the pedal. But I recommend keeping it if you’re using a pad sound, because it usually sounds better that way.
            event.send()
        }

        if (!physicalNotesCurrentlyHeldDown.includes(event.pitch)) {
            physicalNotesCurrentlyHeldDown.push(event.pitch)
        }

        if (physicalPedalIsHeldDown && !notesCurrentlySustainedWithPedal.includes(event.pitch)) {
            notesCurrentlySustainedWithPedal.push(event.pitch)
        }

        return
    }

    // note off
    if (event instanceof NoteOff) {
        if (mode === 0 && (!physicalPedalIsHeldDown || !notesCurrentlySustainedWithPedal.includes(event.pitch))) {
        		event.send()
    		}

        var index = physicalNotesCurrentlyHeldDown.indexOf(event.pitch)
        if (index !== -1) {
            physicalNotesCurrentlyHeldDown.splice(index, 1)
        }

        return
    }

    // sustain pedal on/off
    if (event instanceof ControlChange && event.number === 64) {
        physicalPedalIsHeldDown = event.value >= 64

		if (event.value >= 64) { // pedal was pressed
        		for (var i = 0; i < physicalNotesCurrentlyHeldDown.length; i++) {
            		var pitch = physicalNotesCurrentlyHeldDown[i]
            		if (!notesCurrentlySustainedWithPedal.includes(pitch)) {
                		notesCurrentlySustainedWithPedal.push(pitch)
            		}
        		}
    		}

        if (event.value < 64) { // pedal was released
            if (mode === 0) {
                for (var i = 0; i < notesCurrentlySustainedWithPedal.length; i++) {
                    var pitch = notesCurrentlySustainedWithPedal[i]
                    if (!physicalNotesCurrentlyHeldDown.includes(pitch)) {
                        var noteOff = new NoteOff()
                        noteOff.pitch = pitch
                        noteOff.send()
                    }
                }
            }

            notesCurrentlySustainedWithPedal = []
        }

        return
    }

    // sending all remaining events
    event.send()
}

function ParameterChanged(param) {
    var mode = GetParameter("Latch")

    // latch ON
    if (mode === 1) {
        currentlyLatchedNotes = physicalPedalIsHeldDown ? notesCurrentlySustainedWithPedal.slice() : physicalNotesCurrentlyHeldDown.slice()
    }

    // latch OFF
    if (mode === 0) {
    		if (physicalPedalIsHeldDown) {
        		notesCurrentlySustainedWithPedal = currentlyLatchedNotes.slice()
    		}
    
        for (var i = 0; i < currentlyLatchedNotes.length; i++) {
            var pitch = currentlyLatchedNotes[i]
            if (!physicalNotesCurrentlyHeldDown.includes(pitch) && !notesCurrentlySustainedWithPedal.includes(pitch)) {
                var noteOff = new NoteOff()
                noteOff.pitch = pitch
                noteOff.send()
            }
        }
        
        currentlyLatchedNotes = []
    }
}
