import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    context: null,
    appIsMapping: false,

    originNode: null,
    appConnecting: false,

    //click
    secondsPerBeat: 0,
    nextBeatTime: 0,
    currentBeat: 1,
    totalBeats: 4,
    tempo: 60.0,
  },

  getters: {
    context: (state) => {
      return state.context
    },

    //click
    tempo: (state) => {
      return state.tempo
    },

    secondsPerBeat: (state) => {
      return state.secondsPerBeat
    },

    nextBeatTime: (state) => {
      return state.nextBeatTime
    },

    currentBeat: (state) => {
      return state.currentBeat
    },

    totalBeats: (state) => {
      return state.totalBeats
    },

    appIsMapping: (state) => {
      return state.appIsMapping
    },

    appConnecting: (state) => {
      return state.appConnecting
    },

    originNode: (state) => {
      return state.originNode
    }
  },

  mutations: {
    setContext: (state, payload) => {
      state.context = payload
    },

    //click
    setTempo: (state, payload) => {
      state.tempo = payload
    },

    setSecondsPerBeat: (state, payload) => {
      state.secondsPerBeat = payload
    },

    setNextBeatTime: (state, payload) => {
      state.nextBeatTime = payload
    },

    setCurrentBeat: (state, payload) => {
      state.currentBeat = payload
    },

    setTotalBeats: (state, payload) => {
      state.totalBeats = payload
    },

    setAppIsMapping: (state, payload) => {
      state.appIsMapping = payload
    },

    setAppConnecting: (state, payload) => {
      state.appConnecting = payload
    },

    setOriginNode: (state, payload) => {
      state.originNode = payload
    }
  },
  actions: {
  },
  modules: {
  }
})
