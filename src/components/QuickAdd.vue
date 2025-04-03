<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMoodStore } from '../store/mood';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';

const emit = defineEmits(['mood-added']);
const store = useMoodStore();

// 确保store初始化
onMounted(() => {
  store.init();
});

const form = ref({
  category: '',
  intensity: 2,
  date: dayjs().format('YYYY-MM-DD'),
  time: dayjs().format('HH:mm'),
  content: '',
  moodType: 'negative', // 默认情绪类型为消极
});

const resetForm = () => {
  form.value = {
    category: '',
    intensity: 2,
    date: dayjs().format('YYYY-MM-DD'),
    time: dayjs().format('HH:mm'),
    content: '',
    moodType: 'negative',
  };
};

const addMood = () => {
  if (!form.value.category) {
    alert('请选择一个分类');
    return;
  }

  const newMood = {
    id: nanoid(),
    date: form.value.date,
    time: form.value.time,
    category: form.value.category,
    intensity: form.value.intensity,
    content: form.value.content,
    moodType: form.value.moodType,
    resolved: false, // 对于消极情绪，初始状态为未解决
    resolution: '',
    reflection: '',
    createdAt: Date.now()
  };

  store.addMood(newMood);
  resetForm();
  emit('mood-added');
};

// 根据情绪类型筛选类别
const filteredCategories = computed(() => {
  return store.categories.filter(cat => cat.type === form.value.moodType);
});

// 获取情绪强度标签
const getIntensityLabel = () => {
  if (form.value.moodType === 'positive') {
    return ['微小', '温馨', '难忘'][form.value.intensity - 1];
  } else {
    return ['轻微', '中等', '强烈'][form.value.intensity - 1];
  }
};

// 当情绪类型改变时重置分类
const handleMoodTypeChange = (type) => {
  form.value.moodType = type;
  form.value.category = ''; // 重置分类
};
</script>

<template>
  <form @submit.prevent="addMood" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700">情绪类型</label>
      <div class="flex space-x-2 mt-1">
        <button 
          type="button"
          class="flex-1 py-2 px-3 rounded-lg border transition-all duration-200 flex items-center justify-center"
          :class="form.moodType === 'positive' 
            ? 'bg-teal-50 border-teal-200 text-teal-700' 
            : 'bg-white border-gray-200 text-gray-500 hover:bg-teal-50'"
          @click="handleMoodTypeChange('positive')"
        >
          <span class="mr-2">✨</span>美好心情
        </button>
        <button 
          type="button"
          class="flex-1 py-2 px-3 rounded-lg border transition-all duration-200 flex items-center justify-center"
          :class="form.moodType === 'negative' 
            ? 'bg-amber-50 border-amber-200 text-amber-700' 
            : 'bg-white border-gray-200 text-gray-500 hover:bg-amber-50'"
          @click="handleMoodTypeChange('negative')"
        >
          <span class="mr-2">💭</span>烦恼心情
        </button>
      </div>
    </div>
    
    <div>
      <label for="category" class="block text-sm font-medium text-gray-700">情绪分类</label>
      <select 
        id="category" 
        v-model="form.category"
        class="select mt-1 w-full"
        :class="form.moodType === 'positive' ? 'border-teal-200 focus:border-teal-300' : 'border-amber-200 focus:border-amber-300'"
      >
        <option value="" disabled>选择一个分类</option>
        <option 
          v-for="category in filteredCategories" 
          :key="category.id" 
          :value="category.id"
        >
          {{ category.icon }} {{ category.name }}
        </option>
      </select>
    </div>
    
    <div>
      <label for="intensity" class="block text-sm font-medium text-gray-700">
        {{ form.moodType === 'positive' ? '开心程度' : '情绪强度' }}
      </label>
      <div class="flex items-center mt-1">
        <input
          type="range"
          id="intensity"
          v-model="form.intensity"
          min="1"
          max="3"
          step="1"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          :class="form.moodType === 'positive' ? 'accent-teal-500' : 'accent-amber-500'"
        />
        <span class="ml-2 text-sm" :class="form.moodType === 'positive' ? 'text-teal-700' : 'text-amber-700'">
          {{ getIntensityLabel() }}
        </span>
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="date" class="block text-sm font-medium text-gray-700">日期</label>
        <input
          type="date"
          id="date"
          v-model="form.date"
          class="input mt-1 w-full"
          :class="form.moodType === 'positive' ? 'border-teal-200 focus:border-teal-300' : 'border-amber-200 focus:border-amber-300'"
        />
      </div>
      <div>
        <label for="time" class="block text-sm font-medium text-gray-700">时间</label>
        <input
          type="time"
          id="time"
          v-model="form.time"
          class="input mt-1 w-full"
          :class="form.moodType === 'positive' ? 'border-teal-200 focus:border-teal-300' : 'border-amber-200 focus:border-amber-300'"
        />
      </div>
    </div>
    
    <div>
      <label for="content" class="block text-sm font-medium text-gray-700">心情记录</label>
      <textarea
        id="content"
        v-model="form.content"
        rows="3"
        :placeholder="form.moodType === 'positive' 
          ? '描述这个美好时刻，记录下你的感受...' 
          : '描述当前的心情与烦恼，记录下你的感受...'"
        class="textarea mt-1 w-full"
        :class="form.moodType === 'positive' ? 'border-teal-200 focus:border-teal-300' : 'border-amber-200 focus:border-amber-300'"
      ></textarea>
    </div>
    
    <button 
      type="submit" 
      class="btn w-full flex items-center justify-center transition-all duration-200"
      :class="form.moodType === 'positive' 
        ? 'bg-teal-500 hover:bg-teal-600 text-white' 
        : 'bg-amber-500 hover:bg-amber-600 text-white'"
    >
      <span class="mr-2">{{ form.moodType === 'positive' ? '✨' : '📝' }}</span>
      {{ form.moodType === 'positive' ? '记录美好时光' : '记录心情感受' }}
    </button>
  </form>
</template> 