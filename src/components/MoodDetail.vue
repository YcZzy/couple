<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMoodStore } from '../store/mood';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const store = useMoodStore();

// 初始化store
onMounted(() => {
  store.init();
});

// 获取路由参数中的ID
const moodId = computed(() => route.params.id);

// 编辑状态
const isEditing = ref(false);

// 当前心情记录
const currentMood = ref(null);

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

// 根据ID加载心情记录
const loadMood = () => {
  const mood = store.getMoodById(moodId.value);
  if (mood) {
    currentMood.value = mood;
    // 初始化表单数据
    form.value = { ...mood };
  } else {
    // 如果找不到记录，返回列表页
    router.push('/moods');
  }
};

// 当ID变化时重新加载
watch(moodId, loadMood, { immediate: true });

// 切换编辑状态
const toggleEdit = () => {
  isEditing.value = !isEditing.value;
  // 重置表单数据
  if (isEditing.value && currentMood.value) {
    form.value = { ...currentMood.value };
  }
};

// 保存编辑
const saveMood = () => {
  if (store.updateMood(moodId.value, form.value)) {
    isEditing.value = false;
    loadMood(); // 重新加载数据
  }
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
  form.value = { ...currentMood.value };
};

// 删除心情记录
const deleteMood = () => {
  if (confirm('确定要删除这条记录吗？')) {
    if (store.deleteMood(moodId.value)) {
      router.push('/moods');
    }
  }
};

// 切换解决状态（仅针对消极情绪）
const toggleResolved = () => {
  if (currentMood.value && currentMood.value.moodType === 'negative') {
    const resolved = !currentMood.value.resolved;
    store.updateMood(moodId.value, { resolved });
    loadMood(); // 重新加载数据
  }
};

// 日期格式化
const formattedDate = computed(() => {
  if (!currentMood.value) return '';
  return dayjs(`${currentMood.value.date} ${currentMood.value.time || '00:00'}`).format('YYYY年MM月DD日 HH:mm');
});

// 获取情绪类别名称
const categoryName = computed(() => {
  if (!currentMood.value) return '';
  const category = store.categories.find(c => c.id === currentMood.value.category);
  return category ? category.name : '未分类';
});

// 获取情绪图标
const categoryIcon = computed(() => {
  if (!currentMood.value) return '';
  const category = store.categories.find(c => c.id === currentMood.value.category);
  return category ? category.icon : '📝';
});

// 获取情绪强度标签
const intensityLabel = computed(() => {
  if (!currentMood.value) return '';
  if (currentMood.value.moodType === 'positive') {
    return ['微小', '温馨', '难忘'][currentMood.value.intensity - 1];
  } else {
    return ['轻微', '中等', '强烈'][currentMood.value.intensity - 1];
  }
});

// 获取情绪强度颜色
const intensityColor = computed(() => {
  if (!currentMood.value) return '';
  const colors = [
    '#4CAF50', // 轻微/微小
    '#FFC107', // 中等/温馨
    '#FF5722'  // 强烈/难忘
  ];
  return colors[currentMood.value.intensity - 1];
});

// 获取当前类别的所有可选项
const categoryOptions = computed(() => {
  if (!currentMood.value) return [];
  return store.categories.filter(cat => cat.type === currentMood.value.moodType);
});
</script>

<template>
  <div v-if="currentMood" class="max-w-2xl mx-auto p-4">
    <!-- 返回按钮 -->
    <div class="mb-6">
      <button 
        @click="router.back()" 
        class="flex items-center text-gray-600 hover:text-gray-900"
      >
        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        返回
      </button>
    </div>
    
    <!-- 标题和操作按钮 -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold flex items-center">
        <span class="mr-2 text-2xl">{{ categoryIcon }}</span>
        {{ categoryName }}
        <span 
          v-if="currentMood.moodType === 'negative'" 
          class="ml-2 text-sm px-2 py-1 rounded-full"
          :class="currentMood.resolved ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'"
        >
          {{ currentMood.resolved ? '已解决' : '待解决' }}
        </span>
      </h1>
      
      <div class="flex space-x-2">
        <button 
          v-if="!isEditing" 
          @click="toggleEdit" 
          class="btn btn-outline flex items-center"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
          </svg>
          编辑
        </button>
        <button 
          v-if="!isEditing && currentMood.moodType === 'negative'" 
          @click="toggleResolved" 
          class="btn"
          :class="currentMood.resolved ? 'btn-amber' : 'btn-teal'"
        >
          {{ currentMood.resolved ? '标记为未解决' : '标记为已解决' }}
        </button>
        <button 
          v-if="!isEditing" 
          @click="deleteMood" 
          class="btn btn-danger flex items-center"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          删除
        </button>
      </div>
    </div>
    
    <!-- 查看模式 -->
    <div v-if="!isEditing" class="space-y-6">
      <!-- 基本信息卡片 -->
      <div class="bg-white/80 p-6 rounded-lg shadow-sm border"
        :class="currentMood.moodType === 'positive' ? 'border-teal-100' : 'border-amber-100'">
        <div class="flex justify-between items-start mb-4">
          <span class="text-sm text-gray-500">{{ formattedDate }}</span>
          <span
            class="px-3 py-1 text-white rounded-full text-sm font-medium"
            :style="{ backgroundColor: intensityColor }"
          >
            {{ intensityLabel }}
          </span>
        </div>
        
        <div class="prose max-w-none">
          <p class="whitespace-pre-line">{{ currentMood.content }}</p>
        </div>
      </div>
      
      <!-- 解决方案（仅消极情绪） -->
      <div v-if="currentMood.moodType === 'negative'" class="bg-white/80 p-6 rounded-lg shadow-sm border border-blue-100">
        <h2 class="text-xl font-medium text-blue-700 mb-3 flex items-center">
          <span class="text-xl mr-2">💡</span>
          解决方案
        </h2>
        <div class="prose max-w-none">
          <p v-if="currentMood.resolution" class="whitespace-pre-line">{{ currentMood.resolution }}</p>
          <p v-else class="text-gray-500 italic">暂无解决方案，点击编辑添加</p>
        </div>
      </div>
      
      <!-- 感想与反思 -->
      <div class="bg-white/80 p-6 rounded-lg shadow-sm border border-purple-100">
        <h2 class="text-xl font-medium text-purple-700 mb-3 flex items-center">
          <span class="text-xl mr-2">✨</span>
          {{ currentMood.moodType === 'positive' ? '美好感想' : '感想与反思' }}
        </h2>
        <div class="prose max-w-none">
          <p v-if="currentMood.reflection" class="whitespace-pre-line">{{ currentMood.reflection }}</p>
          <p v-else class="text-gray-500 italic">暂无感想，点击编辑添加</p>
        </div>
      </div>
    </div>
    
    <!-- 编辑模式 -->
    <div v-else class="space-y-6">
      <form @submit.prevent="saveMood" class="space-y-4">
        <!-- 基本信息编辑 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">情绪分类</label>
            <select 
              v-model="form.category"
              class="select mt-1 w-full"
              :class="currentMood.moodType === 'positive' ? 'border-teal-200' : 'border-amber-200'"
            >
              <option 
                v-for="category in categoryOptions" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.icon }} {{ category.name }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">
              {{ currentMood.moodType === 'positive' ? '开心程度' : '情绪强度' }}
            </label>
            <div class="flex items-center mt-1">
              <input
                type="range"
                v-model="form.intensity"
                min="1"
                max="3"
                step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :class="currentMood.moodType === 'positive' ? 'accent-teal-500' : 'accent-amber-500'"
              />
              <span class="ml-2 text-sm" :class="currentMood.moodType === 'positive' ? 'text-teal-700' : 'text-amber-700'">
                {{ form.intensity === 1 ? (currentMood.moodType === 'positive' ? '微小' : '轻微') : 
                   form.intensity === 2 ? (currentMood.moodType === 'positive' ? '温馨' : '中等') : 
                   (currentMood.moodType === 'positive' ? '难忘' : '强烈') }}
              </span>
            </div>
          </div>
          
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
        
        <div>
          <label class="block text-sm font-medium text-gray-700">心情内容</label>
          <textarea
            v-model="form.content"
            rows="4"
            class="textarea mt-1 w-full"
            :placeholder="currentMood.moodType === 'positive' ? '描述这个美好时刻...' : '描述你的情绪和感受...'"
          ></textarea>
        </div>
        
        <!-- 解决方案（仅消极情绪） -->
        <div v-if="currentMood.moodType === 'negative'">
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
            {{ currentMood.moodType === 'positive' ? '美好感想' : '感想与反思' }}
          </label>
          <textarea
            v-model="form.reflection"
            rows="3"
            class="textarea mt-1 w-full"
            :placeholder="currentMood.moodType === 'positive' ? '记录下这个美好时刻带给你的感受...' : '记录下你的反思和感想...'"
          ></textarea>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button type="submit" class="btn btn-primary flex-1">保存</button>
          <button type="button" @click="cancelEdit" class="btn btn-outline flex-1">取消</button>
        </div>
      </form>
    </div>
  </div>
  
  <div v-else class="text-center py-10">
    <p class="text-gray-500">加载中...</p>
  </div>
</template>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.btn-danger {
  @apply bg-red-600 text-white hover:bg-red-700;
}

.btn-teal {
  @apply bg-teal-600 text-white hover:bg-teal-700;
}

.btn-amber {
  @apply bg-amber-600 text-white hover:bg-amber-700;
}

.input, .select, .textarea {
  @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50;
}
</style> 