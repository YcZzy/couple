<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMoodStore } from './store/mood';

// 导入组件
import Dashboard from './components/Dashboard.vue';
import MoodLog from './components/MoodLog.vue';
import MoodDetail from './components/MoodDetail.vue';
import Rewards from './components/Rewards.vue';
import Analytics from './components/Analytics.vue';
import MoodCalendar from './components/MoodCalendar.vue';
import Settings from './components/Settings.vue';
import QuickAdd from './components/QuickAdd.vue';

const route = useRoute();
const router = useRouter();
const store = useMoodStore();

// 初始化存储
onMounted(() => {
  store.init();
});

// 展示快速添加表单
const showQuickAdd = ref(false);

// 根据路由确定当前激活的标签
const activeTab = computed(() => {
  const path = route.path;
  if (path === '/') return 'dashboard';
  if (path === '/moods') return 'moods';
  if (path.startsWith('/mood/')) return 'moods';
  if (path === '/rewards') return 'rewards';
  if (path === '/analytics') return 'analytics';
  if (path === '/calendar') return 'calendar';
  if (path === '/settings') return 'settings';
  return '';
});

// 处理添加心情记录的事件
const handleMoodAdded = () => {
  showQuickAdd.value = false;
};

// 关闭快速添加表单
const closeQuickAdd = () => {
  showQuickAdd.value = false;
};

// 处理标签切换事件
const handleTabClick = (tabName) => {
  // 这里可以添加标签切换的逻辑
};

// 应用标题和版本
const appTitle = '心情伴侣';
const appVersion = 'v1.0.0';

// 标签项配置
const tabs = [
  { name: 'dashboard', label: '首页', icon: '🏠' },
  { name: 'moods', label: '心情笔记', icon: '📚' },
  { name: 'rewards', label: '甜蜜奖励', icon: '🎁' },
  { name: 'analytics', label: '成长旅程', icon: '📊' },
  { name: 'calendar', label: '美好时光', icon: '📅' }
  // { name: 'settings', label: '设置', icon: '⚙️' }
];
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <!-- 应用标题栏 -->
    <header class="bg-white/80 backdrop-blur-sm shadow-sm py-3 px-4 sticky top-0 z-10">
      <div class="max-w-4xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-bold text-indigo-700 flex items-center">
          <span class="mr-2 text-2xl">💞</span>{{ appTitle }}
        </h1>
        
        <button 
          v-if="activeTab !== 'settings'"
          @click="showQuickAdd = true"
          class="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 flex items-center"
        >
          <span class="mr-1">+</span>
          记录心情
        </button>
      </div>
    </header>
    
    <!-- 主内容区域 -->
    <main class="pb-20">
      <!-- 使用Router View渲染页面 -->
      <router-view></router-view>
    </main>
    
    <!-- 底部导航栏 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-md py-2 px-4 border-t border-gray-200">
      <div class="max-w-4xl mx-auto flex justify-between">
        <router-link 
          v-for="tab in tabs" 
          :key="tab.name"
          :to="tab.name === 'dashboard' ? '/' : `/${tab.name}`"
          :class="{
            'text-indigo-600': activeTab === tab.name,
            'text-gray-500 hover:text-gray-800': activeTab !== tab.name
          }"
          class="flex flex-col items-center px-3 py-1 transition-colors duration-200"
          @click="handleTabClick(tab.name)"
        >
          <span class="text-xl">{{ tab.icon }}</span>
          <span class="text-xs mt-1">{{ tab.label }}</span>
        </router-link>
      </div>
    </nav>
    
    <!-- 快速添加心情记录的弹窗 -->
    <div 
      v-if="showQuickAdd" 
      class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      @click.self="closeQuickAdd"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-zoomIn">
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-lg font-bold text-gray-800">记录新心情</h2>
          <button @click="closeQuickAdd" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="p-4">
          <QuickAdd @mood-added="handleMoodAdded" />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* 全局样式 */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #333;
  line-height: 1.5;
}

/* 动画效果 */
.animate-zoomIn {
  animation: zoomIn 0.3s ease-out;
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
