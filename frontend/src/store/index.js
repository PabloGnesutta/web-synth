import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    context: null,
    appIsMapping: false,

    originNode: null,
    appConnecting: false,
  },

  getters: {
    context: (state) => {
      return state.context
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
