import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
// import TestUser from '../views/TestUser.vue'
import App from "../App"
import Index from "../views/index"

Vue.use(VueRouter)

const routes = [

  {
    path: '/',
    name: '导航一App',
    component: Index,
    children: [
      {
        path: 'TestUser',
        name: 'TestUser',
        component: () => import('../views/TestUser')
      },
      {
        path: '/about',
        name: 'About',
        component: () => import('../views/About')
      }
    ]
  },


  {
    path: '/',
    name: 'Home',
    component: Home  // Home = '../views/Home.vue'
  },
  //  用于测试重复
  {
    path: '/',
    name: '导航二App',
    component: App,
    children: [
      {
        path: 'TestUser',
        name: 'TestUser',
        component: () => import('../views/TestUser')
      },
      {
        path: '/about',
        name: 'About',
        component: () => import('../views/About')
      }
    ]
  },
    // 上边基于vue2.0,下边基于3.0(懒加载)
  // {
  //   path: '/about',
  //   name: 'About',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  // },
    //TestUser
  // {
  //   path: '/TestUser',
  //   component: TestUser
  // }

  // {
  //   path: '/TestUser',
  //   component: () => import('../views/TestUser')
  // }


]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router