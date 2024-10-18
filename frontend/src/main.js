import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './registerServiceWorker';
import './assets/css/variables.css';
import './assets/css/utils.css';
import './assets/css/main.css';

Vue.config.productionTip = false;

// TODO: Delete store (vuex), and maybe router too

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
