import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    /*
    {
      path: '/',
      name: 'welcome-view',
      component: require('@/components/WelcomeView').default
    },
    */
    {
      path: '/dashboard',
      name: 'dashboard',
      component: require('@/components/DashboardView').default
    },
    {
      path: '/login',
      name: 'login',
      component: require('@/components/LoginView').default
    },
    {
      path: '/',
      redirect: '/login'
    }
  ]
})
