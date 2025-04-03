<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMoodStore } from '../store/mood';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekday);
dayjs.extend(weekOfYear);

const router = useRouter();
const store = useMoodStore();

// 确保store初始化
onMounted(() => {
  store.init();
});

// 当前显示的月份
const currentMonth = ref(dayjs());

// 日期格式化
const formatMonth = computed(() => {
  return currentMonth.value.format('YYYY年M月');
});

// 当前日期
const today = dayjs().format('YYYY-MM-DD');

// 随机问候语
const greetings = [
  '今天的心情如何呢？',
  '记录下此刻的情绪吧～',
  '每一天都值得珍藏～',
  '一起留下美好回忆～',
  '分享你的喜怒哀乐～',
  '让心情有处安放～'
];

const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

// 随机情绪图标
const moodEmojis = ['💭', '✨', '💖', '🌈', '🌱', '☀️', '🌙'];
const randomEmoji = ref(moodEmojis[Math.floor(Math.random() * moodEmojis.length)]);

// 生成日历数据
const calendarDays = computed(() => {
  // 当前月的第一天
  const firstDayOfMonth = currentMonth.value.startOf('month');
  
  // 当前月的最后一天
  const lastDayOfMonth = currentMonth.value.endOf('month');
  
  // 日历开始日期（当前月第一天所在周的周一）
  const startDate = firstDayOfMonth.weekday(0);
  
  // 日历结束日期（当前月最后一天所在周的周日）
  const endDate = lastDayOfMonth.weekday(6);
  
  const days = [];
  let day = startDate;
  
  while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
    const formattedDate = day.format('YYYY-MM-DD');
    
    // 获取当天的情绪记录
    const moodsOfDay = store.getMoodsByDate(formattedDate);
    
    days.push({
      date: formattedDate,
      dayOfMonth: day.date(),
      isCurrentMonth: day.month() === currentMonth.value.month(),
      isToday: formattedDate === today,
      moods: moodsOfDay,
      positiveCount: moodsOfDay.filter(m => m.moodType === 'positive').length,
      negativeCount: moodsOfDay.filter(m => m.moodType === 'negative').length,
      totalCount: moodsOfDay.length,
      hasUnresolved: moodsOfDay.some(m => m.moodType === 'negative' && !m.resolved),
      highestIntensity: moodsOfDay.length > 0 ? Math.max(...moodsOfDay.map(m => m.intensity)) : 0
    });
    
    day = day.add(1, 'day');
  }
  
  return days;
});

// 生成星期标题
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

// 获取该月中带有情绪记录的天数
const daysWithMoods = computed(() => {
  return calendarDays.value
    .filter(day => day.isCurrentMonth && day.totalCount > 0)
    .length;
});

// 获取该月的总记录数
const totalMoodsCount = computed(() => {
  return calendarDays.value
    .filter(day => day.isCurrentMonth)
    .reduce((sum, day) => sum + day.totalCount, 0);
});

// 导航到上个月
const goToPrevMonth = () => {
  currentMonth.value = currentMonth.value.subtract(1, 'month');
};

// 导航到下个月
const goToNextMonth = () => {
  currentMonth.value = currentMonth.value.add(1, 'month');
};

// 导航到今天所在的月份
const goToToday = () => {
  currentMonth.value = dayjs();
};

// 导航到指定日期的情绪详情
const goToDateMoods = (date) => {
  router.push({
    path: '/moods',
    query: { date }
  });
};

// 根据情绪记录获取背景样式
const getMoodBackground = (day) => {
  if (day.totalCount === 0) return {};
  
  // 有未解决的负面情绪
  if (day.hasUnresolved) {
    return {
      backgroundColor: `rgba(251, 191, 36, ${Math.min(0.1 + day.highestIntensity * 0.1, 0.35)})`,
      borderLeft: '3px solid #F59E0B'
    };
  }
  
  // 只有正面情绪或已解决的负面情绪
  if (day.positiveCount > 0) {
    return {
      backgroundColor: `rgba(20, 184, 166, ${Math.min(0.1 + day.highestIntensity * 0.1, 0.35)})`,
      borderLeft: day.positiveCount > day.negativeCount ? '3px solid #14B8A6' : 'none'
    };
  }
  
  // 只有已解决的负面情绪
  return {
    backgroundColor: `rgba(107, 114, 128, ${Math.min(0.1 + day.highestIntensity * 0.05, 0.2)})`,
  };
};

// 获取情绪指示器的图标
const getMoodIndicator = (day) => {
  if (day.totalCount === 0) return null;
  
  if (day.positiveCount > 0 && day.negativeCount === 0) {
    return { icon: '✨', color: 'text-teal-500' };
  }
  
  if (day.positiveCount === 0 && day.negativeCount > 0) {
    return day.hasUnresolved 
      ? { icon: '💭', color: 'text-amber-500' }
      : { icon: '🌱', color: 'text-green-500' };
  }
  
  // 混合情绪
  return { icon: '🔄', color: 'text-indigo-500' };
};

// 根据情绪记录获取悬停提示
const getMoodTooltip = (day) => {
  if (day.totalCount === 0) return '';
  
  let tooltip = `${day.totalCount}条记录：`;
  
  if (day.positiveCount > 0) {
    tooltip += `${day.positiveCount}条美好心情`;
  }
  
  if (day.positiveCount > 0 && day.negativeCount > 0) {
    tooltip += '，';
  }
  
  if (day.negativeCount > 0) {
    const resolvedCount = day.negativeCount - (day.hasUnresolved ? 1 : 0);
    tooltip += `${day.negativeCount}条烦恼心情`;
    if (resolvedCount > 0) {
      tooltip += `(${resolvedCount}已解决)`;
    }
  }
  
  return tooltip;
};
</script>

<template>
  <div class="p-4 max-w-4xl mx-auto">
    <!-- 页面标题 -->
    <div class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 flex items-center mb-2">
          <span class="text-3xl mr-2 animate-float">{{ randomEmoji }}</span>
          美好时光
        </h1>
        <p class="text-gray-600 text-sm">{{ randomGreeting }}</p>
      </div>
      
      <div class="text-right">
        <div class="text-gray-500 text-sm">
          {{ formatMonth }}
        </div>
        <div class="text-xs text-gray-400 mt-1">
          {{ daysWithMoods }}天有记录，共{{ totalMoodsCount }}条
        </div>
      </div>
    </div>
    
    <!-- 日历导航 -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-4 flex justify-between items-center">
      <button 
        @click="goToPrevMonth" 
        class="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-white/50"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>
      
      <div class="font-medium text-gray-800">{{ formatMonth }}</div>
      
      <button 
        @click="goToNextMonth" 
        class="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-white/50"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    </div>
    
    <!-- 回到今天按钮 -->
    <div class="flex justify-center mb-4">
      <button 
        @click="goToToday" 
        class="text-sm text-blue-600 hover:text-blue-800 flex items-center px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-50"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        回到今天
      </button>
    </div>
    
    <!-- 日历表格 -->
    <div class="bg-white/80 rounded-lg overflow-hidden shadow-sm border border-gray-100">
      <!-- 星期标题行 -->
      <div class="grid grid-cols-7 bg-gray-50">
        <div 
          v-for="(day, index) in weekdays" 
          :key="index"
          class="py-2 text-center text-sm font-medium"
          :class="index === 0 || index === 6 ? 'text-red-400' : 'text-gray-600'"
        >
          {{ day }}
        </div>
      </div>
      
      <!-- 日历单元格 -->
      <div class="grid grid-cols-7">
        <div 
          v-for="day in calendarDays" 
          :key="day.date"
          class="min-h-[90px] border-t border-r border-gray-100 p-1 relative transition-all duration-200"
          :class="{
            'opacity-40': !day.isCurrentMonth,
            'hover:bg-blue-50/50': day.isCurrentMonth && day.totalCount === 0,
            'cursor-pointer': day.totalCount > 0
          }"
          :style="getMoodBackground(day)"
          @click="day.totalCount > 0 ? goToDateMoods(day.date) : null"
          :title="getMoodTooltip(day)"
        >
          <!-- 日期数字 -->
          <div 
            class="text-right p-1 font-medium"
            :class="{
              'text-gray-400': !day.isCurrentMonth,
              'text-gray-800': day.isCurrentMonth && !day.isToday,
              'bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center ml-auto': day.isToday
            }"
          >
            {{ day.dayOfMonth }}
          </div>
          
          <!-- 情绪指示器 -->
          <div v-if="day.totalCount > 0" class="absolute top-1 left-1">
            <span 
              :class="getMoodIndicator(day).color"
              class="text-lg"
            >
              {{ getMoodIndicator(day).icon }}
            </span>
          </div>
          
          <!-- 情绪记录列表 -->
          <div v-if="day.totalCount > 0" class="mt-1 space-y-1 text-xs">
            <div 
              v-for="(mood, index) in day.moods.slice(0, 2)" 
              :key="mood.id"
              class="px-2 py-1 rounded truncate"
              :class="{
                'bg-teal-50 text-teal-700': mood.moodType === 'positive',
                'bg-amber-50 text-amber-700': mood.moodType === 'negative' && !mood.resolved,
                'bg-green-50 text-green-700': mood.moodType === 'negative' && mood.resolved
              }"
            >
              {{ store.categories.find(c => c.id === mood.category)?.name || '未分类' }}
            </div>
            
            <!-- 更多记录提示 -->
            <div v-if="day.totalCount > 2" class="text-xs text-center text-gray-500">
              还有 {{ day.totalCount - 2 }} 条记录
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 情绪类型图例 -->
    <div class="mt-4 bg-white/80 rounded-lg p-3 shadow-sm border border-gray-100">
      <h3 class="text-sm font-medium text-gray-700 mb-2">情绪类型图例：</h3>
      <div class="flex flex-wrap gap-3">
        <div class="flex items-center">
          <span class="text-lg text-teal-500 mr-1">✨</span>
          <span class="text-xs text-gray-600">美好心情</span>
        </div>
        <div class="flex items-center">
          <span class="text-lg text-amber-500 mr-1">💭</span>
          <span class="text-xs text-gray-600">待解决烦恼</span>
        </div>
        <div class="flex items-center">
          <span class="text-lg text-green-500 mr-1">🌱</span>
          <span class="text-xs text-gray-600">已解决烦恼</span>
        </div>
        <div class="flex items-center">
          <span class="text-lg text-indigo-500 mr-1">🔄</span>
          <span class="text-xs text-gray-600">混合情绪</span>
        </div>
        <div class="flex items-center">
          <div class="w-4 h-4 bg-blue-500 rounded-full mr-1"></div>
          <span class="text-xs text-gray-600">今天</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0px);
  }
}
</style> 