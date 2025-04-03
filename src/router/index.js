import { createRouter, createWebHashHistory } from 'vue-router';

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../components/Dashboard.vue')
  },
  {
    path: '/moods',
    name: 'MoodLog',
    component: () => import('../components/MoodLog.vue')
  },
  {
    path: '/mood/:id',
    name: 'MoodDetail',
    redirect: to => {
      // 重定向到心情列表页，同时保留ID参数
      return { path: '/moods', query: { id: to.params.id } };
    }
  },
  {
    path: '/rewards',
    name: 'Rewards',
    component: () => import('../components/Rewards.vue')
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('../components/Analytics.vue')
  },
  {
    path: '/calendar',
    name: 'MoodCalendar',
    component: () => import('../components/MoodCalendar.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../components/Settings.vue')
  },
  // 重定向匹配不到的路由到首页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router; 