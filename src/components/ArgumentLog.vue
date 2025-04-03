<script setup>
import { ref, computed, onMounted } from 'vue';
import { useArgumentStore } from '../stores/argument';
import QuickAdd from './QuickAdd.vue';

const emit = defineEmits(['navigate']);
const store = useArgumentStore();
const searchText = ref('');
const statusFilter = ref('all'); // all, ongoing, resolved
const categoryFilter = ref('all');
const sortOrder = ref('date-desc'); // date-desc, date-asc, severity-desc, severity-asc
const showForm = ref(false);
const currentDate = ref(new Date());

// 页面标题随心情变化
const pageEmojis = ['📝', '💭', '✨', '💌', '🌈'];
const pageEmoji = pageEmojis[Math.floor(Math.random() * pageEmojis.length)];

// 日期格式化
const formattedDate = computed(() => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  return currentDate.value.toLocaleDateString('zh-CN', options);
});

onMounted(() => {
  store.initializeStore();
});

const filteredArguments = computed(() => {
  let result = [...store.argumentList];
  
  // 关键词搜索
  if (searchText.value) {
    const lowerSearch = searchText.value.toLowerCase();
    result = result.filter(arg => {
      const category = store.categories.find(c => c.id === arg.category);
      return (
        (category && category.name.toLowerCase().includes(lowerSearch)) ||
        (arg.content && arg.content.toLowerCase().includes(lowerSearch)) ||
        (arg.resolution && arg.resolution.toLowerCase().includes(lowerSearch)) ||
        (arg.reflection && arg.reflection.toLowerCase().includes(lowerSearch))
      );
    });
  }
  
  // 状态筛选
  if (statusFilter.value !== 'all') {
    result = result.filter(arg => arg.status === statusFilter.value);
  }
  
  // 分类筛选
  if (categoryFilter.value !== 'all') {
    result = result.filter(arg => arg.category === categoryFilter.value);
  }
  
  // 排序
  result.sort((a, b) => {
    if (sortOrder.value === 'date-desc') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortOrder.value === 'date-asc') {
      return new Date(a.date) - new Date(b.date);
    } else if (sortOrder.value === 'severity-desc') {
      return b.severity - a.severity;
    } else if (sortOrder.value === 'severity-asc') {
      return a.severity - b.severity;
    }
    return 0;
  });
  
  return result;
});

const navigateToDetail = (id) => {
  emit('navigate', 'argument-detail', id);
};

const getSeverityLabel = (severity) => {
  return ['轻微', '中等', '严重'][severity - 1];
};

const getCategoryName = (categoryId) => {
  const category = store.categories.find(c => c.id === categoryId);
  return category ? category.name : categoryId;
};

const getStatusLabel = (status) => {
  return status === 'ongoing' ? '正在面对' : '已解决';
};

// 获取争吵内容摘要
const getContentSummary = (content) => {
  if (!content) return '无记录内容';
  return content.length > 50 ? content.substring(0, 50) + '...' : content;
};

const refreshList = () => {
  showForm.value = false;
}

// 获取状态对应的表情
const getStatusEmoji = (status) => {
  return status === 'ongoing' ? '💭' : '✨';
};
</script>

<template>
  <div class="space-y-8">
    <!-- 顶部区域 -->
    <div class="rounded-3xl bg-gradient-to-br from-blue-50/80 to-purple-50/80 p-6 shadow-sm border border-blue-100/50">
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <span class="text-3xl mr-3">{{ pageEmoji }}</span>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">心情笔记本</h1>
            <p class="text-gray-600 mt-1">{{ formattedDate }}</p>
          </div>
        </div>
        <button @click="showForm = !showForm" class="btn btn-primary group">
          <span class="mr-1 group-hover:-translate-y-1 transition-transform duration-300">{{ showForm ? '✕' : '✎' }}</span>
          {{ showForm ? '取消' : '写笔记' }}
        </button>
      </div>
    </div>
    
    <!-- 添加记录表单 -->
    <div v-if="showForm" class="card bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100/50 transform transition-all duration-500">
      <div class="flex items-center mb-4">
        <span class="text-2xl mr-2">✎</span>
        <h2 class="text-xl font-semibold text-blue-700">记录心情</h2>
      </div>
      <QuickAdd @argument-added="refreshList" />
    </div>
    
    <!-- 筛选工具栏 -->
    <div class="card border-0 p-5">
      <div class="flex items-center mb-4">
        <span class="text-xl mr-2">🔍</span>
        <h2 class="text-lg font-medium text-gray-700">寻找记忆</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div>
          <label for="search" class="block text-sm font-medium text-gray-600 mb-1">关键词</label>
          <div class="relative">
            <input
              id="search"
              type="text"
              v-model="searchText"
              placeholder="搜索关键词..."
              class="input pl-10"
            />
            <span class="absolute left-3 top-3.5 text-gray-400">🔍</span>
          </div>
        </div>
        
        <div>
          <label for="status" class="block text-sm font-medium text-gray-600 mb-1">状态</label>
          <select id="status" v-model="statusFilter" class="select">
            <option value="all">全部状态</option>
            <option value="ongoing">正在面对</option>
            <option value="resolved">已解决</option>
          </select>
        </div>
        
        <div>
          <label for="category" class="block text-sm font-medium text-gray-600 mb-1">分类</label>
          <select id="category" v-model="categoryFilter" class="select">
            <option value="all">全部分类</option>
            <option v-for="category in store.categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <div>
          <label for="sort" class="block text-sm font-medium text-gray-600 mb-1">排序方式</label>
          <select id="sort" v-model="sortOrder" class="select">
            <option value="date-desc">日期 (新→旧)</option>
            <option value="date-asc">日期 (旧→新)</option>
            <option value="severity-desc">强度 (高→低)</option>
            <option value="severity-asc">强度 (低→高)</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 记录列表 -->
    <div class="space-y-4">
      <div v-for="argument in filteredArguments" :key="argument.id" 
           class="card p-5 hover:shadow-md cursor-pointer transition-all duration-300 hover:scale-[1.01] border-l-4"
           :class="{
             'border-l-amber-300': argument.status === 'ongoing',
             'border-l-teal-300': argument.status === 'resolved'
           }"
           @click="navigateToDetail(argument.id)">
        <div class="flex justify-between">
          <div class="flex">
            <div class="mr-3 text-2xl self-start mt-1">{{ getStatusEmoji(argument.status) }}</div>
            <div>
              <div class="flex items-center space-x-3 mb-2">
                <div 
                  :style="{ backgroundColor: store.categories.find(c => c.id === argument.category)?.color || '#ccc' }" 
                  class="w-3 h-3 rounded-full"
                ></div>
                <h3 class="font-medium text-gray-800">{{ getCategoryName(argument.category) }}</h3>
                <span class="text-sm text-gray-500">{{ new Date(argument.date).toLocaleDateString() }}</span>
              </div>
              <p class="text-gray-700">{{ getContentSummary(argument.content) }}</p>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <span :class="{
              'px-3 py-1 rounded-full text-xs font-medium': true,
              'bg-amber-100 text-amber-700': argument.status === 'ongoing',
              'bg-teal-100 text-teal-700': argument.status === 'resolved'
            }">
              {{ getStatusLabel(argument.status) }}
            </span>
            <span :class="{
              'px-2 py-1 text-xs rounded-full mt-2': true,
              'bg-yellow-100 text-yellow-700': argument.severity === 1,
              'bg-orange-100 text-orange-700': argument.severity === 2,
              'bg-red-100 text-red-700': argument.severity === 3,
            }">
              {{ getSeverityLabel(argument.severity) }}
            </span>
          </div>
        </div>
      </div>
      
      <div v-if="filteredArguments.length === 0" class="card p-12 text-center">
        <p class="text-gray-500 mb-2 text-lg">没有找到符合条件的记录</p>
        <p class="text-teal-600 text-sm">调整筛选条件或添加新的心情记录吧</p>
      </div>
    </div>
  </div>
</template> 