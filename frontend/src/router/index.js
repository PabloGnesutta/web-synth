import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Home1 from '../views/Home1.vue'
import MIDI from '../views/MIDI.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },

  {
    path: '/midi',
    name: 'MIDI',
    component: MIDI
  },

  {
    path: '/1',
    name: 'Home1',
    component: Home1
  },
]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
