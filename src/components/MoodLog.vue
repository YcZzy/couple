<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useMoodStore } from '../store/mood';
import dayjs from 'dayjs';
import AIAnalysis from './AIAnalysis.vue';
import { useRoute, useRouter } from 'vue-router';

const store = useMoodStore();
const route = useRoute();
const router = useRouter();

// 确保store初始化
onMounted(() => {
  store.init();
  
  // 如果URL中有ID参数，自动打开对应的侧边栏详情
  if (route.query.id) {
    const mood = store.getMoodById(route.query.id);
    if (mood) {
      handleMoodClick(mood);
      
      // 清除URL中的参数，避免刷新页面时重复打开
      if (history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('id');
        history.replaceState({}, '', url);
      }
    }
  }
});

// 搜索和筛选
const searchTerm = ref('');
const selectedDate = ref('');
const selectedCategory = ref('');
const selectedType = ref('all'); // 'all', 'positive', 'negative'

// 自定义情绪排序规则
const sortBy = ref('date-desc');

// 侧边栏详情相关状态
const showDetailSidebar = ref(false);
const selectedMood = ref(null);
const isEditing = ref(false);
const showAIAnalysis = ref(false);

// 编辑表单
const form = ref({
  category: '',
  intensity: 1,
  date: '',
  time: '',
  content: '',
  moodType: 'negative',
  resolved: false,
  resolution: '',
  reflection: ''
});

// 处理点击记录的事件
const handleMoodClick = (mood) => {
  selectedMood.value = mood;
  form.value = { ...mood };
  isEditing.value = false;
  showDetailSidebar.value = true;
};

// 关闭侧边栏
const closeSidebar = () => {
  showDetailSidebar.value = false;
  selectedMood.value = null;
  isEditing.value = false;
};

// 切换编辑状态
const toggleEdit = () => {
  isEditing.value = !isEditing.value;
  // 重置表单数据
  if (isEditing.value && selectedMood.value) {
    form.value = { ...selectedMood.value };
  }
};

// 保存编辑
const saveMood = () => {
  if (store.updateMood(selectedMood.value.id, form.value)) {
    isEditing.value = false;
    selectedMood.value = store.getMoodById(selectedMood.value.id);
  }
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
  form.value = { ...selectedMood.value };
};

// 删除心情记录
const deleteMood = () => {
  if (confirm('确定要删除这条记录吗？')) {
    if (store.deleteMood(selectedMood.value.id)) {
      closeSidebar();
    }
  }
};

// 切换解决状态（仅针对消极情绪）
const toggleResolved = () => {
  if (selectedMood.value && selectedMood.value.moodType === 'negative') {
    const resolved = !selectedMood.value.resolved;
    store.updateMood(selectedMood.value.id, { resolved });
    selectedMood.value = store.getMoodById(selectedMood.value.id);
  }
};

// 格式化日期显示
const formatDate = (date, time) => {
  return dayjs(`${date} ${time || '00:00'}`).format('MM月DD日 HH:mm');
};

// 获取情绪类别名称和图标
const getCategoryInfo = (categoryId) => {
  const category = store.categories.find(c => c.id === categoryId);
  return {
    name: category ? category.name : '未分类',
    icon: category ? category.icon : '📝'
  };
};

// 获取情绪强度标签和颜色
const getIntensityInfo = (intensity, type) => {
  let label = '';
  let color = '';
  
  if (type === 'positive') {
    label = ['微小', '温馨', '难忘'][intensity - 1];
  } else {
    label = ['轻微', '中等', '强烈'][intensity - 1];
  }
  
  switch (intensity) {
    case 1: color = '#4CAF50'; break;
    case 2: color = '#FFC107'; break;
    case 3: color = '#FF5722'; break;
    default: color = '#9E9E9E';
  }
  
  return { label, color };
};

// 获取当前类别的所有可选项
const moodCategoryOptions = computed(() => {
  if (!selectedMood.value) return [];
  return store.categories.filter(cat => cat.type === selectedMood.value.moodType);
});

// 日期选项
const dateOptions = computed(() => {
  const uniqueDates = [...new Set(store.moods.map(m => m.date))];
  uniqueDates.sort((a, b) => b.localeCompare(a)); // 降序排序
  return uniqueDates;
});

// 分类选项，按类型分组
const groupedCategoryOptions = computed(() => {
  const positiveCats = store.categories.filter(c => c.type === 'positive');
  const negativeCats = store.categories.filter(c => c.type === 'negative');
  
  return {
    positive: positiveCats,
    negative: negativeCats
  };
});

// 应用筛选和排序后的情绪记录
const filteredMoods = computed(() => {
  let result = [...store.moods];
  
  // 应用筛选
  if (selectedDate.value) {
    result = result.filter(m => m.date === selectedDate.value);
  }
  
  if (selectedCategory.value) {
    result = result.filter(m => m.category === selectedCategory.value);
  }
  
  if (selectedType.value !== 'all') {
    result = result.filter(m => m.moodType === selectedType.value);
  }
  
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    result = result.filter(m => 
      m.content.toLowerCase().includes(term) || 
      getCategoryInfo(m.category).name.toLowerCase().includes(term)
    );
  }
  
  // 应用排序
  switch (sortBy.value) {
    case 'date-desc':
      result.sort((a, b) => {
        const dateA = `${a.date} ${a.time || '00:00'}`;
        const dateB = `${b.date} ${b.time || '00:00'}`;
        return dateB.localeCompare(dateA);
      });
      break;
    case 'date-asc':
      result.sort((a, b) => {
        const dateA = `${a.date} ${a.time || '00:00'}`;
        const dateB = `${b.date} ${b.time || '00:00'}`;
        return dateA.localeCompare(dateB);
      });
      break;
    case 'intensity-desc':
      result.sort((a, b) => b.intensity - a.intensity);
      break;
    case 'intensity-asc':
      result.sort((a, b) => a.intensity - b.intensity);
      break;
  }
  
  return result;
});

// 复位筛选条件
const resetFilters = () => {
  searchTerm.value = '';
  selectedDate.value = '';
  selectedCategory.value = '';
  selectedType.value = 'all';
};

// 获取情绪摘要（限制长度）
const getMoodSummary = (content, maxLength = 80) => {
  if (!content) return '';
  return content.length > maxLength 
    ? content.substring(0, maxLength) + '...' 
    : content;
};

// 获取每种类型的记录数量
const moodCounts = computed(() => {
  return {
    total: store.moods.length,
    positive: store.moods.filter(m => m.moodType === 'positive').length,
    negative: store.moods.filter(m => m.moodType === 'negative').length,
    resolved: store.moods.filter(m => m.moodType === 'negative' && m.resolved).length
  };
});

// 计算记录为空的状态
const isEmpty = computed(() => {
  return filteredMoods.value.length === 0;
});

// 获取指定日期下记录的总数
const getDayCount = (date) => {
  return store.moods.filter(m => m.date === date).length;
};

// 打开AI分析对话框
const openAIAnalysis = () => {
  if (selectedMood.value) {
    showAIAnalysis.value = true;
  }
};

// 关闭AI分析对话框
const closeAIAnalysis = () => {
  showAIAnalysis.value = false;
};

// 分享心情记录
const shareMood = () => {
  if (!selectedMood.value) return;
  
  // 生成带有ID参数的URL
  const url = new URL(window.location.href);
  url.pathname = '/mood/' + selectedMood.value.id;
  
  // 如果支持navigator.clipboard API
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        alert('链接已复制到剪贴板！');
      })
      .catch(err => {
        console.error('复制链接失败:', err);
        prompt('请手动复制以下链接:', url.toString());
      });
  } else {
    // 后备方法
    prompt('请手动复制以下链接:', url.toString());
  }
};
</script>

<template>
  <div class="p-4 max-w-4xl mx-auto">
    <!-- 页面标题 -->
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800 flex items-center">
        <span class="text-3xl mr-2">📚</span>心情笔记本
      </h1>
    </div>
    
    <!-- 心情统计卡片 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white/80 rounded-lg p-4 shadow-sm border border-gray-100">
        <div class="text-2xl font-bold text-gray-800">{{ moodCounts.total }}</div>
        <div class="text-gray-500 text-sm">总记录数</div>
      </div>
      
      <div class="bg-white/80 rounded-lg p-4 shadow-sm border border-teal-100">
        <div class="text-2xl font-bold text-teal-700">{{ moodCounts.positive }}</div>
        <div class="text-teal-600 text-sm">美好时刻</div>
      </div>
      
      <div class="bg-white/80 rounded-lg p-4 shadow-sm border border-amber-100">
        <div class="text-2xl font-bold text-amber-700">{{ moodCounts.negative }}</div>
        <div class="text-amber-600 text-sm">烦恼心情</div>
      </div>
      
      <div class="bg-white/80 rounded-lg p-4 shadow-sm border border-green-100">
        <div class="text-2xl font-bold text-green-700">{{ moodCounts.resolved }}</div>
        <div class="text-green-600 text-sm">已解决</div>
      </div>
    </div>
    
    <!-- 搜索和筛选区域 -->
    <div class="bg-white/80 rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <!-- 搜索框 -->
        <div class="relative">
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="搜索记录内容..." 
            class="input search-input w-full"
          />
          <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        
        <!-- 日期筛选 -->
        <div>
          <select v-model="selectedDate" class="select w-full">
            <option value="">所有日期</option>
            <option v-for="date in dateOptions" :key="date" :value="date">
              {{ dayjs(date).format('YYYY年MM月DD日') }} ({{ getDayCount(date) }})
            </option>
          </select>
        </div>
        
        <!-- 心情类型筛选 -->
        <div>
          <div class="flex space-x-2">
            <button 
              @click="selectedType = 'all'" 
              class="flex-1 py-2 px-1 rounded-lg transition-all duration-200 flex items-center justify-center text-sm"
              :class="selectedType === 'all' 
                ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                : 'border border-gray-200 text-gray-500 hover:bg-gray-50'"
            >
              全部
            </button>
            <button 
              @click="selectedType = 'positive'" 
              class="flex-1 py-2 px-1 rounded-lg transition-all duration-200 flex items-center justify-center text-sm"
              :class="selectedType === 'positive' 
                ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                : 'border border-gray-200 text-gray-500 hover:bg-teal-50'"
            >
              <span class="mr-1">✨</span>美好
            </button>
            <button 
              @click="selectedType = 'negative'" 
              class="flex-1 py-2 px-1 rounded-lg transition-all duration-200 flex items-center justify-center text-sm"
              :class="selectedType === 'negative' 
                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                : 'border border-gray-200 text-gray-500 hover:bg-amber-50'"
            >
              <span class="mr-1">💭</span>烦恼
            </button>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 分类筛选 -->
        <div>
          <select v-model="selectedCategory" class="select w-full">
            <option value="">所有分类</option>
            <optgroup label="美好心情">
              <option 
                v-for="category in groupedCategoryOptions.positive" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.icon }} {{ category.name }}
              </option>
            </optgroup>
            <optgroup label="烦恼心情">
              <option 
                v-for="category in groupedCategoryOptions.negative" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.icon }} {{ category.name }}
              </option>
            </optgroup>
          </select>
        </div>
        
        <!-- 排序选项 -->
        <div>
          <select v-model="sortBy" class="select w-full">
            <option value="date-desc">最新记录优先</option>
            <option value="date-asc">最早记录优先</option>
            <option value="intensity-desc">强烈情绪优先</option>
            <option value="intensity-asc">轻微情绪优先</option>
          </select>
        </div>
        
        <!-- 重置按钮 -->
        <div class="flex justify-end">
          <button 
            @click="resetFilters" 
            class="btn btn-outline flex items-center"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            重置筛选
          </button>
        </div>
      </div>
    </div>
    
    <!-- 情绪记录列表 -->
    <div v-if="!isEmpty" class="space-y-4">
      <div 
        v-for="mood in filteredMoods" 
        :key="mood.id"
        @click="handleMoodClick(mood)"
        class="bg-white/80 rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 cursor-pointer"
        :class="mood.moodType === 'positive' ? 'hover:border-teal-200' : 'hover:border-amber-200'"
      >
        <div class="flex justify-between items-start">
          <!-- 左侧：情绪类别和内容 -->
          <div class="flex-1">
            <div class="flex items-center mb-2">
              <span class="text-xl mr-2">{{ getCategoryInfo(mood.category).icon }}</span>
              <span class="font-medium text-gray-800">{{ getCategoryInfo(mood.category).name }}</span>
              
              <span 
                v-if="mood.moodType === 'negative'"
                class="ml-2 px-2 py-0.5 text-xs rounded-full"
                :class="mood.resolved ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'"
              >
                {{ mood.resolved ? '已解决' : '待解决' }}
              </span>
            </div>
            
            <p class="text-gray-700 line-clamp-2">{{ getMoodSummary(mood.content) }}</p>
          </div>
          
          <!-- 右侧：日期和情绪强度 -->
          <div class="ml-4 flex flex-col items-end">
            <span class="text-sm text-gray-500 mb-1">{{ formatDate(mood.date, mood.time) }}</span>
            <span
              class="px-2 py-0.5 text-xs text-white rounded-full"
              :style="{ backgroundColor: getIntensityInfo(mood.intensity, mood.moodType).color }"
            >
              {{ getIntensityInfo(mood.intensity, mood.moodType).label }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="bg-white/80 rounded-lg p-8 shadow-sm border border-gray-100 text-center">
      <div class="text-5xl mb-4">{{ selectedType === 'negative' ? '😌' : '✨' }}</div>
      <h3 class="text-xl font-medium text-gray-700 mb-2">
        {{ searchTerm || selectedDate || selectedCategory || selectedType !== 'all' 
          ? '没有找到匹配的记录' 
          : '还没有任何心情记录' }}
      </h3>
      <p class="text-gray-500 mb-4">
        {{ searchTerm || selectedDate || selectedCategory || selectedType !== 'all' 
          ? '尝试调整筛选条件，或添加新记录' 
          : '可以点击导航栏的心情笔记来添加第一条记录！' }}
      </p>
      
      <div class="flex justify-center">
        <button 
          v-if="searchTerm || selectedDate || selectedCategory || selectedType !== 'all'"
          @click="resetFilters" 
          class="btn btn-outline mr-2"
        >
          清除筛选
        </button>
      </div>
    </div>
    
    <!-- 侧边栏心情详情 -->
    <div 
      v-if="showDetailSidebar" 
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end transition-all duration-300"
      @click.self="closeSidebar"
    >
      <div 
        class="bg-gray-50/95 w-full max-w-xl overflow-y-auto animate-slideIn shadow-2xl"
        style="height: 100vh;"
      >
        <div class="p-8">
          <!-- 关闭按钮和标题 -->
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-2xl font-bold flex items-center">
              <span v-if="selectedMood" class="mr-3 text-3xl">
                {{ getCategoryInfo(selectedMood.category).icon }}
              </span>
              <span v-if="selectedMood" class="text-gray-800">{{ getCategoryInfo(selectedMood.category).name }}</span>
              <span 
                v-if="selectedMood && selectedMood.moodType === 'negative'" 
                class="ml-3 text-sm px-3 py-1 rounded-full"
                :class="selectedMood.resolved ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'"
              >
                {{ selectedMood.resolved ? '已解決' : '待解決' }}
              </span>
            </h2>
            <button @click="closeSidebar" class="text-gray-400 hover:text-gray-600 transition-colors">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <!-- 操作按钮 -->
          <div v-if="selectedMood" class="flex flex-wrap gap-3 mb-8">
            <button 
              v-if="!isEditing" 
              @click="toggleEdit" 
              class="btn btn-outline flex items-center min-w-[120px] justify-center"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              編輯
            </button>
            <button 
              v-if="!isEditing && selectedMood.moodType === 'negative'" 
              @click="toggleResolved" 
              class="btn min-w-[120px] justify-center"
              :class="selectedMood.resolved ? 'btn-amber' : 'btn-teal'"
            >
              {{ selectedMood.resolved ? '標記為未解決' : '標記為已解決' }}
            </button>
            <button 
              v-if="!isEditing" 
              @click="openAIAnalysis" 
              class="btn btn-primary flex items-center min-w-[120px] justify-center"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              AI分析
            </button>
            <button 
              v-if="!isEditing" 
              @click="shareMood" 
              class="btn btn-outline flex items-center min-w-[120px] justify-center"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
              </svg>
              分享
            </button>
            <button 
              v-if="!isEditing" 
              @click="deleteMood" 
              class="btn btn-danger flex items-center min-w-[120px] justify-center"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              刪除
            </button>
          </div>
          
          <!-- 查看模式 -->
          <div v-if="selectedMood && !isEditing" class="space-y-8">
            <!-- 基本信息卡片 -->
            <div class="bg-white p-6 rounded-lg shadow-lg border-2"
              :class="selectedMood.moodType === 'positive' ? 'border-teal-200' : 'border-amber-200'">
              <div class="flex justify-between items-start mb-5">
                <span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{{ formatDate(selectedMood.date, selectedMood.time) }}</span>
                <span
                  class="px-4 py-1.5 text-white rounded-full text-sm font-medium shadow-sm"
                  :style="{ backgroundColor: getIntensityInfo(selectedMood.intensity, selectedMood.moodType).color }"
                >
                  {{ getIntensityInfo(selectedMood.intensity, selectedMood.moodType).label }}
                </span>
              </div>
              
              <div class="prose max-w-none">
                <p class="whitespace-pre-line text-gray-700 leading-relaxed">{{ selectedMood.content }}</p>
              </div>
            </div>
            
            <!-- 解决方案（仅消极情绪） -->
            <div v-if="selectedMood.moodType === 'negative'" class="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-200">
              <h2 class="text-xl font-bold text-blue-700 mb-4 flex items-center">
                <span class="text-2xl mr-3">💡</span>
                解決方案
              </h2>
              <div class="prose max-w-none">
                <p v-if="selectedMood.resolution" class="whitespace-pre-line text-gray-700 leading-relaxed">{{ selectedMood.resolution }}</p>
                <p v-else class="text-gray-400 italic">暫無解決方案，點擊編輯添加</p>
              </div>
            </div>
            
            <!-- 感想与反思 -->
            <div class="bg-white p-6 rounded-lg shadow-lg border-2 border-purple-200">
              <h2 class="text-xl font-bold text-purple-700 mb-4 flex items-center">
                <span class="text-2xl mr-3">✨</span>
                {{ selectedMood.moodType === 'positive' ? '美好感想' : '感想與反思' }}
              </h2>
              <div class="prose max-w-none">
                <p v-if="selectedMood.reflection" class="whitespace-pre-line text-gray-700 leading-relaxed">{{ selectedMood.reflection }}</p>
                <p v-else class="text-gray-400 italic">暫無感想，點擊編輯添加</p>
              </div>
            </div>
          </div>
          
          <!-- 编辑模式 -->
          <div v-if="selectedMood && isEditing" class="space-y-6">
            <form @submit.prevent="saveMood" class="space-y-4">
              <!-- 基本信息编辑 -->
              <div class="grid grid-cols-1 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">情绪分类</label>
                  <select 
                    v-model="form.category"
                    class="select mt-1 w-full"
                    :class="selectedMood.moodType === 'positive' ? 'border-teal-200' : 'border-amber-200'"
                  >
                    <option 
                      v-for="category in moodCategoryOptions" 
                      :key="category.id" 
                      :value="category.id"
                    >
                      {{ category.icon }} {{ category.name }}
                    </option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700">
                    {{ selectedMood.moodType === 'positive' ? '开心程度' : '情绪强度' }}
                  </label>
                  <div class="flex items-center mt-1">
                    <input
                      type="range"
                      v-model="form.intensity"
                      min="1"
                      max="3"
                      step="1"
                      class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      :class="selectedMood.moodType === 'positive' ? 'accent-teal-500' : 'accent-amber-500'"
                    />
                    <span class="ml-2 text-sm" :class="selectedMood.moodType === 'positive' ? 'text-teal-700' : 'text-amber-700'">
                      {{ form.intensity === 1 ? (selectedMood.moodType === 'positive' ? '微小' : '轻微') : 
                         form.intensity === 2 ? (selectedMood.moodType === 'positive' ? '温馨' : '中等') : 
                         (selectedMood.moodType === 'positive' ? '难忘' : '强烈') }}
                    </span>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">日期</label>
                    <input
                      type="date"
                      v-model="form.date"
                      class="input mt-1 w-full"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700">时间</label>
                    <input
                      type="time"
                      v-model="form.time"
                      class="input mt-1 w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">心情内容</label>
                <textarea
                  v-model="form.content"
                  rows="4"
                  class="textarea mt-1 w-full"
                  :placeholder="selectedMood.moodType === 'positive' ? '描述这个美好时刻...' : '描述你的情绪和感受...'"
                ></textarea>
              </div>
              
              <!-- 解决方案（仅消极情绪） -->
              <div v-if="selectedMood.moodType === 'negative'">
                <div class="flex items-center justify-between">
                  <label class="block text-sm font-medium text-gray-700">解决方案</label>
                  <div class="flex items-center">
                    <input 
                      type="checkbox" 
                      id="resolved" 
                      v-model="form.resolved"
                      class="mr-2"
                    />
                    <label for="resolved" class="text-sm text-gray-700">标记为已解决</label>
                  </div>
                </div>
                <textarea
                  v-model="form.resolution"
                  rows="3"
                  class="textarea mt-1 w-full"
                  placeholder="描述你是如何解决或计划如何解决这个问题..."
                ></textarea>
              </div>
              
              <!-- 感想与反思 -->
              <div>
                <label class="block text-sm font-medium text-gray-700">
                  {{ selectedMood.moodType === 'positive' ? '美好感想' : '感想与反思' }}
                </label>
                <textarea
                  v-model="form.reflection"
                  rows="3"
                  class="textarea mt-1 w-full"
                  :placeholder="selectedMood.moodType === 'positive' ? '记录下这个美好时刻带给你的感受...' : '记录下你的反思和感想...'"
                ></textarea>
              </div>
              
              <div class="flex space-x-3 mt-6">
                <button type="submit" class="btn btn-primary flex-1">保存</button>
                <button type="button" @click="cancelEdit" class="btn btn-outline flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- AI分析组件 -->
    <AIAnalysis 
      v-if="selectedMood" 
      :argumentId="selectedMood.id" 
      :visible="showAIAnalysis" 
      @close="closeAIAnalysis"
    />
  </div>
</template>

<style scoped>
.btn {
  @apply px-6 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md;
}

.btn-outline {
  @apply border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.btn-danger {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.btn-teal {
  @apply bg-teal-500 text-white hover:bg-teal-600;
}

.btn-amber {
  @apply bg-amber-500 text-white hover:bg-amber-600;
}

.input, .select, .textarea {
  @apply block w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50;
}

.search-input {
  @apply pl-10;
}

.animate-slideIn {
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style> 
