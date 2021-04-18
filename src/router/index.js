import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import TestUser from '../views/TestUser.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home  // Home = '../views/Home.vue'
  },
    // 上边基于vue2.0,下边基于3.0(懒加载)
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
    //TestUser
  // {
  //   path: '/TestUser',
  //   component: TestUser
  // }

  {
    path: '/TestUser',
    component: () => import('../views/TestUser')
  }


]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
