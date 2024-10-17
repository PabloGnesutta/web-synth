import Vue from 'vue';
import Vuex from 'vuex';


Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    originNode: null,
    secondsPerBeat: 0,
    nextBeatTime: 0,
    currentBeat: 1,
    totalBeats: 4,
    tempo: 120.0,
  },

  getters: {
    originNode: (state) => state.originNode,
    tempo: (state) => state.tempo,
    secondsPerBeat: (state) => state.secondsPerBeat,
    nextBeatTime: (state) => state.nextBeatTime,
    currentBeat: (state) => state.currentBeat,
    totalBeats: (state) => state.totalBeats,
  },

  mutations: {
    setTempo: (state, payload) => state.tempo = payload,
    setSecondsPerBeat: (state, payload) => state.secondsPerBeat = payload,
    setNextBeatTime: (state, payload) => state.nextBeatTime = payload,
    setCurrentBeat: (state, payload) => state.currentBeat = payload,
    setTotalBeats: (state, payload) => state.totalBeats = payload,
    setOriginNode: (state, payload) => state.originNode = payload,
  },
});
