import Vue from 'vue'
import './plugins/axios'
import App from './App.vue'
import router from './router'
import './plugins/element.js'
// 添加全局变量 -- 1/2
import testUserVariable from './api/testuser/testuser_global_variable.js'

//添加全局变量 -- 2/2
Vue.prototype.TESTUSERGLOBAL = testUserVariable

// 省略axios还需要输入BASEHOST
axios.defaults.baseURL = testUserVariable.BASEHOST

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
