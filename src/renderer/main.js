import Vue from 'vue'
import axios from 'axios'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.css'

import { eenclient } from '../lib/eagleeye'
import App from './App'
import router from './router'
import store from './store'

Vue.use(Vuetify)
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

const { ipcMain } = require('electron').remote
ipcMain.on('een-login', (event, user, pass) => {
  eenclient.login(user, pass).then(function (data) {
    event.sender.send('een-login-response', data)
  }, function (error) {
    console.log(error)
    event.sender.send('een-login-response', error)
  })
})

ipcMain.on('een-list-devices', (event) => {
  eenclient.query('GET', '/g/list/devices?is_tags_included=1&_=1545240390445').then(function (data) {
    event.sender.send('een-list-devices-response', data)
  }, function (error) {
    console.log(error)
    event.sender.send('een-list-devices-response', error)
  })
})

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
