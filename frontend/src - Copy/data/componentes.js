export const filtros = [
  {
    type: "highpass",
    desc: "High Pass",
    freqValue: 20,
    minFreq: 20,
    maxFreq: 5000,
    step: 10,

    qValue: 0,
    minQ: -20,
    maxQ: 20,
    qStep: 1,
  },

  {
    type: "lowpass",
    desc: "Low Pass",
    freqValue: 5000,
    minFreq: 20,
    maxFreq: 5000,
    step: 5,

    qValue: 0,
    minQ: -50,
    maxQ: 50,
    qStep: 1,
  },

  {
    type: "notch",
    desc: "Notch",
    freqValue: 5000,
    minFreq: 20,
    maxFreq: 5000,
    step: 5,

    qValue: 1,
    minQ: 0,
    maxQ: 1,
    qStep: 0.01,
  },

  {
    type: "bandpass",
    desc: "Band Pass",
    freqValue: 5000,
    minFreq: 20,
    maxFreq: 5000,
    step: 5,

    qValue: 0,
    minQ: 0,
    maxQ: 1,
    qStep: 0.01,
  },
]

export const osciladores = [
  {
    type: "square",
    freq: 220,
    minFreq: 20,
    maxFreq: 1200
  },
  {
    type: "triangle",
    freq: 220,
    minFreq: 20,
    maxFreq: 1200
  },
  {
    type: "sawtooth",
    freq: 220,
    minFreq: 20,
    maxFreq: 1200
  }
]

