<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMoodStore } from '../store/mood';
import { Bar, Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const store = useMoodStore();
const currentDate = ref(new Date());

// 随机鼓励语录
const encouragements = [
  "一起成长，每一天都是新的开始～",
  "爱的旅程中，你们正在变得更好～",
  "小小进步，汇聚成幸福的河流～",
  "珍惜彼此的陪伴，共同成长～",
  "每一次情绪管理，都让你们更亲近～"
];
const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

// 日期格式化
const formattedDate = computed(() => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  return currentDate.value.toLocaleDateString('zh-CN', options);
});

onMounted(() => {
  store.init();
});

// 图表选项
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        boxWidth: 10,
        padding: 20,
        font: {
          size: 12
        }
      }
    }
  }
};

// 分类统计
const categoryStats = computed(() => {
  // 从分类数据计算统计信息
  const categoryCounts = store.categories.map(category => {
    return {
      name: category.name,
      count: store.moods.filter(mood => mood.category === category.id).length,
      color: category.icon === '💖' ? '#EC4899' : 
             category.icon === '🌱' ? '#10B981' : 
             category.icon === '🎁' ? '#F59E0B' : 
             category.icon === '✨' ? '#8B5CF6' : 
             category.icon === '💬' ? '#4F46E5' : 
             category.icon === '📊' ? '#059669' : 
             category.icon === '🚧' ? '#2fca09' : 
             category.icon === '🔒' ? '#59856' : 
             category.icon === '👪' ? '#C45309' : 
             category.icon === '✨' ? '#D45309' : 
             category.icon === '😤' ? '#DC2626' : '#7C3AED'
    };
  });
  
  return {
    labels: categoryCounts.map(s => s.name),
    datasets: [
      {
        data: categoryCounts.map(s => s.count),
        backgroundColor: categoryCounts.map(s => s.color),
        borderWidth: 0
      }
    ]
  };
});

// 情绪类型统计
const moodTypeStats = computed(() => {
  const positive = store.moods.filter(m => m.moodType === 'positive').length;
  const negative = store.moods.filter(m => m.moodType === 'negative').length;
  
  return {
    labels: ['积极情绪', '消极情绪'],
    datasets: [
      {
        data: [positive, negative],
        backgroundColor: ['#10B981', '#F59E0B'],
        borderWidth: 0
      }
    ]
  };
});

// 严重程度统计
const severityStats = computed(() => {
  const counts = [0, 0, 0];
  
  store.moods.forEach(mood => {
    if (mood.intensity >= 1 && mood.intensity <= 3) {
      counts[mood.intensity - 1]++;
    }
  });
  
  return {
    labels: ['轻微情绪', '中等情绪', '强烈情绪'],
    datasets: [
      {
        data: counts,
        backgroundColor: ['#FCD34D', '#FB923C', '#F87171'],
        borderWidth: 0
      }
    ]
  };
});

// 解决状态统计
const statusStats = computed(() => {
  // 在mood商店中，用resolved字段表示解决状态
  const ongoing = store.moods.filter(mood => mood.moodType === 'negative' && !mood.resolved).length;
  const resolved = store.moods.filter(mood => mood.moodType === 'negative' && mood.resolved).length;
  
  return {
    labels: ['正在面对', '已解决'],
    datasets: [
      {
        data: [ongoing, resolved],
        backgroundColor: ['#FCD34D', '#34D399'],
        borderWidth: 0
      }
    ]
  };
});

// 月度情绪统计
const monthlyStats = computed(() => {
  // 获取最近6个月的数据
  const monthsData = new Map(); // 使用Map存储每月的统计数据
  
  // 初始化最近6个月
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthsData.set(monthKey, { month: monthKey, positive: 0, negative: 0 });
  }
  
  // 统计每条记录
  store.moods.forEach(mood => {
    const date = new Date(mood.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // 只处理最近6个月的数据
    if (monthsData.has(monthKey)) {
      const monthData = monthsData.get(monthKey);
      if (mood.moodType === 'positive') {
        monthData.positive++;
      } else {
        monthData.negative++;
      }
    }
  });
  
  // 转换成数组
  const recentMonths = Array.from(monthsData.values());
  
  return {
    labels: recentMonths.map(m => {
      const [year, month] = m.month.split('-');
      return `${year}.${month}`;
    }),
    datasets: [
      {
        label: '积极情绪',
        data: recentMonths.map(m => m.positive),
        backgroundColor: '#34D399',
        borderWidth: 0
      },
      {
        label: '消极情绪',
        data: recentMonths.map(m => m.negative),
        backgroundColor: '#FB923C',
        borderWidth: 0
      }
    ]
  };
});

// 成长指数 - 计算一个0-100的指数，反映关系健康状态
const growthIndex = computed(() => {
  // 基于各种指标计算成长指数
  const resolutionRate = parseFloat(store.stats.resolvedRate || 0);
  const positiveRate = parseFloat(store.stats.positiveRate || 0);
  const recentNegativeCount = store.moods
    .filter(m => m.moodType === 'negative')
    .filter(m => {
      const moodDate = new Date(m.date);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return moodDate >= oneMonthAgo;
    }).length;
  
  // 计算指数
  let index = 50; // 基础分
  
  // 根据解决率加分
  index += resolutionRate * 0.25;
  
  // 根据积极情绪占比加分
  index += positiveRate * 0.25;
  
  // 根据最近一个月消极情绪数量减分
  index -= Math.min(recentNegativeCount * 2, 20); // 最多减20分
  
  // 确保在0-100范围内
  return Math.round(Math.max(0, Math.min(100, index)));
});

// 成长指数评价
const growthRating = computed(() => {
  const index = growthIndex.value;
  if (index >= 90) return { text: '卓越', color: 'text-emerald-600' };
  if (index >= 75) return { text: '优秀', color: 'text-teal-600' };
  if (index >= 60) return { text: '良好', color: 'text-blue-600' };
  if (index >= 40) return { text: '一般', color: 'text-amber-600' };
  return { text: '需要关注', color: 'text-orange-600' };
});
</script>

<template>
  <div class="page-container space-y-8">
    <!-- 顶部区域 -->
    <div class="page-header-indigo">
      <div class="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 class="page-title-indigo">
            <span class="text-3xl mr-3 float-animation inline-block">🌱</span>
            成长旅程
          </h1>
          <p class="text-gray-600 mt-1">{{ formattedDate }}</p>
          <p class="text-indigo-600 mt-3 italic">"{{ randomEncouragement }}"</p>
        </div>
      </div>
    </div>
    
    <!-- 成长指数 -->
    <div class="card card-indigo relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-2xl -mr-10 -mt-10"></div>
      <div class="relative z-10">
        <div class="card-title">
          <span class="card-title-icon">🌟</span>
          <h2 class="card-title-text text-indigo-700">成长指数</h2>
        </div>
        
        <div class="flex flex-col md:flex-row items-center justify-between">
          <div class="text-center mb-6 md:mb-0">
            <div class="relative inline-block">
              <svg class="w-36 h-36" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E9D5FF"
                  stroke-width="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  :stroke="growthIndex >= 75 ? '#10B981' : growthIndex >= 50 ? '#3B82F6' : '#F59E0B'"
                  stroke-width="3"
                  :stroke-dasharray="`${growthIndex}, 100`"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center flex-col">
                <span class="text-4xl font-bold text-indigo-600">{{ growthIndex }}</span>
                <span class="text-sm" :class="growthRating.color">{{ growthRating.text }}</span>
              </div>
            </div>
          </div>
          
          <div class="md:w-2/3 space-y-4">
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-600">情绪管理成功率</span>
                <span class="text-sm font-medium text-indigo-600">{{ store.stats.resolvedRate }}%</span>
              </div>
              <div class="progress-container">
                <div class="progress-bar progress-bar-teal" :style="{ width: `${store.stats.resolvedRate}%` }"></div>
              </div>
            </div>
            
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-600">积极情绪占比</span>
                <span class="text-sm font-medium text-indigo-600">{{ store.stats.positiveRate }}%</span>
              </div>
              <div class="progress-container">
                <div class="progress-bar progress-bar-emerald" :style="{ width: `${store.stats.positiveRate}%` }"></div>
              </div>
            </div>
            
            <p class="text-sm text-gray-600 mt-2">
              成长指数反映了你们关系的健康状态，综合考虑了情绪管理成功率、积极情绪占比和近期消极情绪的数量。
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图表网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 月度情绪统计 -->
      <div class="card card-blue">
        <div class="card-title">
          <span class="card-title-icon">📊</span>
          <h2 class="card-title-text text-blue-700">月度情绪变化</h2>
        </div>
        <div class="h-64">
          <Bar :data="monthlyStats" :options="chartOptions" />
        </div>
      </div>
      
      <!-- 情绪类型分布 -->
      <div class="card card-teal">
        <div class="card-title">
          <span class="card-title-icon">🎭</span>
          <h2 class="card-title-text text-teal-700">情绪类型分布</h2>
        </div>
        <div class="h-64">
          <Pie :data="moodTypeStats" :options="chartOptions" />
        </div>
      </div>
      
      <!-- 主题分布 -->
      <div class="card card-violet">
        <div class="card-title">
          <span class="card-title-icon">🏷️</span>
          <h2 class="card-title-text text-violet-700">情绪主题</h2>
        </div>
        <div class="h-64">
          <Pie :data="categoryStats" :options="chartOptions" />
        </div>
      </div>
      
      <!-- 情绪强度 -->
      <div class="card card-amber">
        <div class="card-title">
          <span class="card-title-icon">🌡️</span>
          <h2 class="card-title-text text-amber-700">情绪温度</h2>
        </div>
        <div class="h-64">
          <Pie :data="severityStats" :options="chartOptions" />
        </div>
      </div>
      
      <!-- 文字摘要 -->
      <div class="card card-purple md:col-span-2">
        <div class="card-title">
          <span class="card-title-icon">💌</span>
          <h2 class="card-title-text text-purple-700">爱的小贴士</h2>
        </div>
        <ul class="space-y-3">
          <li class="flex items-start p-2 rounded-lg hover:bg-white/80 transition-colors duration-200">
            <span class="text-lg mr-3 text-pink-500">💖</span>
            <span class="text-gray-700">
              共记录了 <span class="font-semibold text-gray-800">{{ store.moods.length }}</span> 次心情故事
            </span>
          </li>
          <li class="flex items-start p-2 rounded-lg hover:bg-white/80 transition-colors duration-200">
            <span class="text-lg mr-3 text-teal-500">🏆</span>
            <span class="text-gray-700">
              最常见的心情类型是 
              <span class="font-semibold text-gray-800">
                {{ 
                  store.categories.length > 0 
                    ? (store.categories.length > 0 ? store.categories[0].name : '无数据') 
                    : '无数据'
                }}
              </span>
            </span>
          </li>
          <li class="flex items-start p-2 rounded-lg hover:bg-white/80 transition-colors duration-200">
            <span class="text-lg mr-3 text-indigo-500">📈</span>
            <span class="text-gray-700">
              积极情绪占比 
              <span class="font-semibold text-gray-800">{{ store.stats.positiveRate }}%</span>，
              <span v-if="parseFloat(store.stats.positiveRate) >= 50" class="text-teal-600">继续保持这种积极状态!</span>
              <span v-else class="text-amber-600">试着多记录一些美好时刻吧!</span>
            </span>
          </li>
          <li class="flex items-start p-2 rounded-lg hover:bg-white/80 transition-colors duration-200">
            <span class="text-lg mr-3 text-amber-500">⚖️</span>
            <span class="text-gray-700">
              情绪管理成功率 
              <span class="font-semibold text-gray-800">{{ store.stats.resolvedRate }}%</span>，
              表明你们善于处理和转化情绪
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.float-animation {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
</style> 