import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from '../views/Home.vue'
import v1 from '../views/v1.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/v1',
    name: 'v1',
    component: v1
  },
]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
