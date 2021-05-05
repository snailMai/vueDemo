import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Menu from "../views/Menu"
import GetTestUser  from "../views/GetTestUser";
import AddTestUser  from "../views/AddTestUser";
import UpdateTestUser  from "../views/UpdateTestUser";
import About from "../views/About"

Vue.use(VueRouter)

const routes = [

  {
    path: '/',
    name: 'TestUser',
    component: Menu,
    show:true,
    redirect:"/About",   // 默认渠道/TestUser
    children: [
      {
        path: '/About',
        name: '首页',
        component: About
      },
      {
        path: '/GetTestUser',
        name: 'GetTestUser',
        component: GetTestUser
      },
      {
        path: '/AddTestUser',
        name: '注册TestUser',
        component: AddTestUser
      }
    ]
  },

  {
    path: '/Home',
    name: 'Home',
    show:false,
    component: Home  // Home = '../views/Home.vue'
  },
  //  用于测试重复
  {
    path: '/',
    name: '导航二,用于测试重复',
    show:false,
    component: Menu,
    children: [
      {
        path: 'TestUser',
        name: 'TestUser',
        component: () => import('../views/TestUser')
      },
      {
        path: '/about',
        name: 'About',
        component: About
      },
      {
        path: '/UpdateTestUser',
        name: '更新TestUser',
        component: UpdateTestUser
      },
      {
        path: '/TestUser',
        name: 'getAllTestUser',
        show:true,
        component: () => import('../views/TestUser')
      },
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
