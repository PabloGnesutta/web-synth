import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from '../views/Home.vue'
// import v2 from '../views/v2.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  // {
  //   path: '/v2',
  //   name: 'v2',
  //   component: v2
  // },
]

const router = new VueRouter({
  mode: 'hash',
  routes
})

export default router
