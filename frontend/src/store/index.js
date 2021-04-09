import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    appIsMapping: false
  },

  getters: {
    appIsMapping: (state) => {
      return state.appIsMapping
    }
  },

  mutations: {
    setAppIsMapping: (state, payload) => {
      state.appIsMapping = payload
    }
  },
  actions: {
  },
  modules: {
  }
})
