// Instruments
const Mic = require('../class/Instruments/Mic');
const Femod = require('../class/Instruments/Femod');
const Surgeon = require('../class/Instruments/Surgeon');
const Carrier = require('../class/Instruments/Carrier');
const Drumkit = require('../class/Instruments/Drumkit');
const Sampler = require('../class/Instruments/Sampler');
const WhiteNoise = require('../class/Instruments/WhiteNoise');
const instrumentsDict = new Map([
  ['Femod', Femod],
  ['Carrier', Carrier],
  ['Drumkit', Drumkit],
  ['Sampler', Sampler],
  ['Surgeon', Surgeon],
  ['WhiteNoise', WhiteNoise],
]);

// Effects
const EQ3 = require('../class/Effects/EQ3');
const Delay = require('../class/Effects/Delay');
const Distortion = require('../class/Effects/Distortion');
const Reverb = require('../class/Effects/Reverb');
const Looper = require('../class/Effects/Looper');
const Compressor = require('../class/Effects/Compressor');
const BiquadFilter = require('../class/Effects/BiquadFilter');
const effectsDict = new Map([
  ['EQ3', EQ3],
  ['Delay', Delay],
  ['Reverb', Reverb],
  ['Looper', Looper],
  ['Distortion', Distortion],
  ['Compressor', Compressor],
  ['BiquadFilter', BiquadFilter],
]);

function createInstrument(className, saveObject) {
  return new (instrumentsDict.get(className))(saveObject);
}

function createEffect(className, saveObject) {
  return new (effectsDict.get(className))(saveObject);
}

function createMic() {
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then(function (stream) {
      return new Mic(stream);
    })
    .catch(function (err) {
      console.log('err', err);
      alert("Couldn't get user media, continuing without mic input. Error: " + err);
    });
}

export {
  createInstrument,
  createEffect,
  createMic
};