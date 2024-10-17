const { midiState } = require("../state/vueInstance.js");
const { keypressListeners } = require("./keyboard.js");


function requestMidiAccess() {
  if (navigator.requestMIDIAccess) {
    navigator
      .requestMIDIAccess()
      .then(onMIDISuccess, onMIDIFailure);
  }
  else {
    console.warn('No MIDI access')
  }
}

function onMidiMap() {
  if (midiState.refBeignMapped) {
    midiState.refBeignMapped.setKnobMappingStatus(false);
    midiState.refBeignMapped = null;
  }
  midiState.mapping = !midiState.mapping;
  return midiState;
}

function knobClicked(knobRef) {
  if (!midiState.mapping) {
    return;
  }
  if (midiState.refBeignMapped) {
    midiState.refBeignMapped.setKnobMappingStatus(false);
    midiState.refBeignMapped = null;
  }
  midiState.refBeignMapped = knobRef;
  knobRef.setKnobMappingStatus(true);
}

function onMIDISuccess(midiAccess) {
  midiState.midiInputs = midiAccess.inputs || [];
  midiState.midiOutputs = midiAccess.outputs || [];
  midiState.midiMappings = []
  midiState.mapping = false
  midiState.refBeignMapped = null;

  for (var input of midiState.midiInputs.values()) {
    input.onmidimessage = onMIDIMessage;
  }
}

function onMIDIFailure(e = {}) {
  console.warn('MIDI Failure', JSON.stringify(e, null, 2))
}

function onMIDIMessage(e) {
  if (midiState.mapping) {
    mapMidiCmdToApp(e.data)
  } else {
    triggerMidiCmd(e.data)
  }
}

function mapMidiCmdToApp(data) {
  const ref = midiState.refBeignMapped;
  if (!ref) {
    return
  }
  const status = data[0];
  const note = data[1];

  const refName = ref.$vnode.data.ref;
  const existingMap = midiState.midiMappings.find(m => m.refName === refName);
  if (!existingMap) {
    midiState.midiMappings.push({
      ref,
      refName,
      note,
      cmd: status,
    });
  } else {
    existingMap.cmd = status;
    existingMap.note = note;
  }
  ref.assignMap(status, note);
}

function triggerMidiCmd(data) {
  const status = data[0];
  const note = data[1];
  const value = data[2];
  const binary = status.toString(2);
  const command = binary.substr(0, 4);
  const channel = parseInt(binary.substr(4, 4), 2) + 1;

  if (command === '1001') {
    // note on
    triggerNoteOn(note, channel);
  } else if (command === '1000') {
    // note off
    triggerNoteOff(note, channel);
  } else if (command === '1011') {
    // knob
    const mappedItem = midiState.midiMappings.find(m => m.cmd === status && m.note === note);
    if (!mappedItem) {
      return;
    }
    mappedItem.ref.receiveMidi(value);
  } else {
    console.info('MIDI command', command)
  }
}

// todo: maybe these two belong elsewhere
function triggerNoteOn(note, _channel) {
  keypressListeners.forEach(scaleInterface => scaleInterface.instrument.playNote(note));
}
function triggerNoteOff(note, _channel) {
  keypressListeners.forEach(scaleInterface => scaleInterface.instrument.stopNote(note));
}


module.exports = {
  requestMidiAccess,
  onMidiMap,
  knobClicked,
}