import Vue from 'vue';
import Vuex from 'vuex';


Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    originNode: null,
    appConnecting: false,

    //click
    secondsPerBeat: 0,
    nextBeatTime: 0,
    currentBeat: 1,
    totalBeats: 4,
    tempo: 120.0,
  },

  getters: {
    //click
    tempo: (state) => {
      return state.tempo;
    },

    secondsPerBeat: (state) => {
      return state.secondsPerBeat;
    },

    nextBeatTime: (state) => {
      return state.nextBeatTime;
    },

    currentBeat: (state) => {
      return state.currentBeat;
    },

    totalBeats: (state) => {
      return state.totalBeats;
    },

    appConnecting: (state) => {
      return state.appConnecting;
    },

    originNode: (state) => {
      return state.originNode;
    }
  },

  mutations: {
    setTempo: (state, payload) => {
      state.tempo = payload;
    },

    setSecondsPerBeat: (state, payload) => {
      state.secondsPerBeat = payload;
    },

    setNextBeatTime: (state, payload) => {
      state.nextBeatTime = payload;
    },

    setCurrentBeat: (state, payload) => {
      state.currentBeat = payload;
    },

    setTotalBeats: (state, payload) => {
      state.totalBeats = payload;
    },

    setAppConnecting: (state, payload) => {
      state.appConnecting = payload;
    },

    setOriginNode: (state, payload) => {
      state.originNode = payload;
    }
  },
});
