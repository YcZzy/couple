<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMoodStore } from '../store/mood';
import dayjs from 'dayjs';

const router = useRouter();
const store = useMoodStore();

// 确保store初始化
onMounted(() => {
  store.init();
});

// 加载标志
const isLoading = ref(true);

// 在组件挂载后模拟加载完成
onMounted(() => {
  setTimeout(() => {
    isLoading.value = false;
  }, 500);
});

// 今天日期格式化
const today = computed(() => {
  return dayjs().format('YYYY年MM月DD日');
});

// 随机问候语
const greetings = [
  '今天是美好的一天！',
  '欢迎回来，愿你今天心情愉快～',
  '记录每一刻情绪，留住美好时光～',
  '今天有什么想分享的心情吗？',
  '一起来记录爱的点滴吧～',
  '每一天都值得珍藏～'
];

const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

// 获取最近的情绪记录
const recentMoods = computed(() => {
  return [...store.moods]
    .sort((a, b) => {
      const dateA = `${a.date} ${a.time || '00:00'}`;
      const dateB = `${b.date} ${b.time || '00:00'}`;
      return dateB.localeCompare(dateA);
    })
    .slice(0, 5);
});

// 本周情绪统计
const weekStats = computed(() => {
  const startOfWeek = dayjs().startOf('week');
  const endOfWeek = dayjs().endOf('week');
  
  // 本周的情绪记录
  const weekMoods = store.moods.filter(mood => {
    const moodDate = dayjs(mood.date);
    return moodDate.isAfter(startOfWeek) && moodDate.isBefore(endOfWeek);
  });
  
  return {
    total: weekMoods.length,
    positive: weekMoods.filter(m => m.moodType === 'positive').length,
    negative: weekMoods.filter(m => m.moodType === 'negative').length,
    resolved: weekMoods.filter(m => m.moodType === 'negative' && m.resolved).length,
  };
});

// 月度情绪趋势
const monthTrend = computed(() => {
  // 获取最近30天
  const days = [];
  for (let i = 29; i >= 0; i--) {
    days.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
  }
  
  // 获取每天的情绪记录
  return days.map(date => {
    const moodsOfDay = store.getMoodsByDate(date);
    return {
      date,
      label: dayjs(date).format('MM/DD'),
      positive: moodsOfDay.filter(m => m.moodType === 'positive').length,
      negative: moodsOfDay.filter(m => m.moodType === 'negative').length,
      total: moodsOfDay.length
    };
  });
});

// 快速导航到各页面
const navigateTo = (path) => {
  router.push(path);
};

// 格式化日期
const formatDate = (date, time) => {
  return dayjs(`${date} ${time || '00:00'}`).format('MM月DD日 HH:mm');
};

// 获取情绪类别名称
const getCategoryName = (categoryId) => {
  const category = store.categories.find(c => c.id === categoryId);
  return category ? `${category.icon} ${category.name}` : '未分类';
};

// 获取情绪摘要
const getMoodSummary = (content, maxLength = 60) => {
  if (!content) return '';
  return content.length > maxLength 
    ? content.substring(0, maxLength) + '...' 
    : content;
};

// 获取情绪记录数量
const moodCounts = computed(() => {
  return {
    total: store.moods.length,
    positive: store.moods.filter(m => m.moodType === 'positive').length,
    negative: store.moods.filter(m => m.moodType === 'negative').length,
    resolved: store.moods.filter(m => m.moodType === 'negative' && m.resolved).length,
    positiveRate: store.stats.positiveRate
  };
});

// 查看指定情绪记录详情
const viewMoodDetail = (moodId) => {
  router.push(`/moods?id=${moodId}`);
};
</script>

<template>
  <div class="p-4 max-w-4xl mx-auto">
    <!-- 欢迎区域 -->
    <div class="mb-6 bg-gradient-to-r from-indigo-100 to-purple-200 rounded-xl p-6 shadow-lg">
      <div v-if="isLoading" class="animate-pulse space-y-2">
        <div class="h-8 bg-indigo-300/40 rounded w-3/4"></div>
        <div class="h-4 bg-indigo-300/40 rounded w-1/2"></div>
      </div>
      <div v-else>
        <h1 class="text-2xl font-bold mb-2 text-indigo-900">欢迎使用心情伴侣！</h1>
        <p class="text-purple-800">{{ today }} · {{ randomGreeting }}</p>
      </div>
    </div>
    
    <!-- 核心数据概览 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white/80 rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <div v-if="isLoading" class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-16 mb-1"></div>
          <div class="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div v-else>
          <div class="text-2xl font-bold text-gray-800">{{ moodCounts.total }}</div>
          <div class="text-gray-500 text-sm">总记录数</div>
        </div>
      </div>
      
      <div class="bg-white/80 rounded-lg p-4 shadow-sm border border-teal-100 hover:shadow-md transition-shadow duration-200">
        <div v-if="isLoading" class="animate-pulse">
          <div class="h-8 bg-teal-100 rounded w-16 mb-1"></div>
          <div class="h-4 bg-teal-100 rounded w-20"></div>
        </div>
        <div v-else>
          <div class="text-2xl font-bold text-teal-700">{{ moodCounts.positive }}</div>
          <div class="text-teal-600 text-sm">美好心情</div>
        </div>
      </div>
      
      <div class="bg-white/80 rounded-lg p-4 shadow-sm border border-amber-100 hover:shadow-md transition-shadow duration-200">
        <div v-if="isLoading" class="animate-pulse">
          <div class="h-8 bg-amber-100 rounded w-16 mb-1"></div>
          <div class="h-4 bg-amber-100 rounded w-20"></div>
        </div>
        <div v-else>
          <div class="text-2xl font-bold text-amber-700">{{ moodCounts.negative }}</div>
          <div class="text-amber-600 text-sm">烦恼心情</div>
        </div>
      </div>
      
      <div class="bg-white/80 rounded-lg p-4 shadow-sm border border-indigo-100 hover:shadow-md transition-shadow duration-200">
        <div v-if="isLoading" class="animate-pulse">
          <div class="h-8 bg-indigo-100 rounded w-16 mb-1"></div>
          <div class="h-4 bg-indigo-100 rounded w-20"></div>
        </div>
        <div v-else>
          <div class="text-2xl font-bold text-indigo-700">{{ moodCounts.positiveRate }}%</div>
          <div class="text-indigo-600 text-sm">积极指数</div>
        </div>
      </div>
    </div>
    
    <!-- 功能导航卡片 -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div 
        @click="navigateTo('/moods')" 
        class="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-5 shadow-sm border border-teal-200 hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div class="flex items-center">
          <span class="text-3xl mr-3">📚</span>
          <div>
            <h2 class="font-bold text-teal-800">心情笔记1</h2>
            <p class="text-sm text-teal-600">记录和浏览所有情绪</p>
          </div>
        </div>
      </div>
      
      <div 
        @click="navigateTo('/calendar')" 
        class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 shadow-sm border border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div class="flex items-center">
          <span class="text-3xl mr-3">📅</span>
          <div>
            <h2 class="font-bold text-blue-800">美好时光</h2>
            <p class="text-sm text-blue-600">查看心情日历</p>
          </div>
        </div>
      </div>
      
      <div 
        @click="navigateTo('/rewards')" 
        class="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5 shadow-sm border border-amber-200 hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div class="flex items-center">
          <span class="text-3xl mr-3">🎁</span>
          <div>
            <h2 class="font-bold text-amber-800">甜蜜奖励</h2>
            <p class="text-sm text-amber-600">管理爱的奖惩</p>
          </div>
        </div>
      </div>
      
      <div 
        @click="navigateTo('/analytics')" 
        class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-5 shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div class="flex items-center">
          <span class="text-3xl mr-3">📊</span>
          <div>
            <h2 class="font-bold text-indigo-800">成长旅程</h2>
            <p class="text-sm text-indigo-600">查看情绪统计分析</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 最近情绪记录 -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold text-gray-800">最近心情</h2>
        <button 
          @click="navigateTo('/moods')" 
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          查看全部
        </button>
      </div>
      
      <div v-if="isLoading" class="animate-pulse space-y-3">
        <div v-for="i in 3" :key="i" class="bg-white/60 rounded-lg p-4 shadow-sm">
          <div class="flex justify-between">
            <div class="h-5 bg-gray-200 rounded w-1/3"></div>
            <div class="h-5 bg-gray-200 rounded w-1/5"></div>
          </div>
          <div class="h-4 bg-gray-200 rounded w-full mt-3"></div>
        </div>
      </div>
      
      <div v-else-if="recentMoods.length > 0" class="space-y-3">
        <div 
          v-for="mood in recentMoods" 
          :key="mood.id"
          @click="viewMoodDetail(mood.id)"
          class="bg-white/80 rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 cursor-pointer"
          :class="mood.moodType === 'positive' ? 'hover:border-teal-200' : 'hover:border-amber-200'"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center mb-1">
                <span class="font-medium text-gray-800">{{ getCategoryName(mood.category) }}</span>
                
                <span 
                  v-if="mood.moodType === 'negative'"
                  class="ml-2 px-2 py-0.5 text-xs rounded-full"
                  :class="mood.resolved ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'"
                >
                  {{ mood.resolved ? '已解决' : '待解决' }}
                </span>
              </div>
              <p class="text-gray-600 text-sm line-clamp-1">{{ getMoodSummary(mood.content) }}</p>
            </div>
            <span class="text-xs text-gray-500">{{ formatDate(mood.date, mood.time) }}</span>
          </div>
        </div>
      </div>
      
      <div v-else class="bg-white/80 rounded-lg p-6 text-center shadow-sm border border-gray-100">
        <div class="text-4xl mb-2">✨</div>
        <p class="text-gray-600">还没有记录任何心情</p>
        <button 
          @click="navigateTo('/moods')"
          class="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
        >
          去记录第一条心情
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 多行文本截断 */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 