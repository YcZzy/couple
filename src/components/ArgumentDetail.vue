<script setup>
import { ref, onMounted, computed } from 'vue';
import { useArgumentStore } from '../stores/argument';
import AIAnalysis from './AIAnalysis.vue';

const props = defineProps({
  id: String
});

const emit = defineEmits(['back']);
const store = useArgumentStore();
const editMode = ref(false);
const form = ref(null);
const showAIAnalysis = ref(false);

onMounted(() => {
  store.initializeStore();
  loadArgument();
});

const loadArgument = () => {
  const argument = store.getArgumentById(props.id);
  if (argument) {
    form.value = { ...argument };
    if (!form.value.content) {
      form.value.content = '';
    }
    // 确保有情绪类型
    if (!form.value.moodType) {
      form.value.moodType = 'negative';
    }
  }
};

const category = computed(() => {
  if (!form.value) return null;
  return store.categories.find(c => c.id === form.value.category);
});

const saveChanges = () => {
  if (!form.value) return;
  
  store.updateArgument(props.id, form.value);
  editMode.value = false;
};

const toggleStatus = () => {
  if (!form.value) return;
  
  const newStatus = form.value.status === 'ongoing' ? 'resolved' : 'ongoing';
  form.value.status = newStatus;
  saveChanges();
};

const getSeverityLabel = (severity) => {
  return form.value && form.value.moodType === 'positive' 
    ? ['一般', '温馨', '难忘'][severity - 1] 
    : ['轻微', '中等', '强烈'][severity - 1];
};

const getStatusLabel = (status) => {
  return status === 'ongoing' ? '正在面对' : '已解决';
};

const openAIAnalysis = () => {
  showAIAnalysis.value = true;
};

const closeAIAnalysis = () => {
  showAIAnalysis.value = false;
};

// 根据情绪类型获取标题
const getPageTitle = computed(() => {
  if (!form.value) return '心情详情';
  return form.value.moodType === 'positive' ? '美好时刻' : '心情记录';
});

// 根据情绪类型获取内容标签
const getContentLabel = computed(() => {
  if (!form.value) return '心情内容';
  return form.value.moodType === 'positive' ? '美好瞬间' : '心情内容';
});

// 根据情绪类型获取解决方案标签
const getResolutionLabel = computed(() => {
  if (!form.value) return '解决方案';
  return form.value.moodType === 'positive' ? '珍藏感受' : '应对方式';
});

// 根据情绪类型获取反思标签
const getReflectionLabel = computed(() => {
  if (!form.value) return '反思';
  return form.value.moodType === 'positive' ? '成长收获' : '心得体会';
});
</script>

<template>
  <div v-if="form" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <button @click="emit('back')" class="mr-2 text-gray-500 hover:text-gray-700">
          ← 返回
        </button>
        <h1 class="text-2xl font-bold text-gray-900 flex items-center">
          <span class="mr-2">{{ form.moodType === 'positive' ? '✨' : '💭' }}</span>
          {{ getPageTitle }}
        </h1>
      </div>
      <div class="flex space-x-2">
        <button 
          @click="openAIAnalysis" 
          class="btn btn-secondary"
        >
          <span class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
            </svg>
            智能分析
          </span>
        </button>
        <button 
          @click="toggleStatus()" 
          :class="[
            'btn',
            form.status === 'ongoing' ? 'btn-success' : 'btn-secondary'
          ]"
        >
          {{ form.status === 'ongoing' ? '标记为已解决' : '标记为进行中' }}
        </button>
        <button 
          v-if="!editMode" 
          @click="editMode = true" 
          class="btn btn-primary"
        >
          编辑
        </button>
        <button 
          v-else 
          @click="saveChanges()" 
          class="btn btn-primary"
        >
          保存
        </button>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6" :class="form.moodType === 'positive' ? 'bg-gradient-to-br from-teal-50/30 to-white' : 'bg-gradient-to-br from-amber-50/30 to-white'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 class="text-sm font-medium text-gray-500">日期</h3>
          <div v-if="!editMode" class="mt-1 text-gray-900">
            {{ new Date(form.date).toLocaleDateString() }}
          </div>
          <input 
            v-else
            type="date"
            v-model="form.date"
            class="input mt-1"
          />
        </div>
        
        <div>
          <h3 class="text-sm font-medium text-gray-500">分类</h3>
          <div v-if="!editMode" class="mt-1 flex items-center">
            <div 
              v-if="category" 
              :style="{ backgroundColor: category.color }" 
              class="w-3 h-3 rounded-full mr-2"
            ></div>
            <span class="text-gray-900">{{ category?.name || form.category }}</span>
          </div>
          <select
            v-else
            v-model="form.category"
            class="select mt-1"
          >
            <option 
              v-for="cat in store.categories" 
              :key="cat.id" 
              :value="cat.id"
            >
              {{ cat.name }}
            </option>
          </select>
        </div>
        
        <div>
          <h3 class="text-sm font-medium text-gray-500">
            {{ form.moodType === 'positive' ? '开心程度' : '情绪强度' }}
          </h3>
          <div v-if="!editMode" class="mt-1">
            <span :class="{
              'px-2 py-1 text-xs rounded-full': true,
              'bg-teal-100 text-teal-800': form.moodType === 'positive' && form.severity === 1,
              'bg-teal-200 text-teal-800': form.moodType === 'positive' && form.severity === 2,
              'bg-teal-300 text-teal-800': form.moodType === 'positive' && form.severity === 3,
              'bg-yellow-100 text-yellow-800': form.moodType !== 'positive' && form.severity === 1,
              'bg-orange-100 text-orange-800': form.moodType !== 'positive' && form.severity === 2,
              'bg-red-100 text-red-800': form.moodType !== 'positive' && form.severity === 3,
            }">
              {{ getSeverityLabel(form.severity) }}
            </span>
          </div>
          <div v-else class="mt-1">
            <div class="flex items-center">
              <input
                type="range"
                v-model="form.severity"
                min="1"
                max="3"
                step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                :class="form.moodType === 'positive' ? 'accent-teal-500' : 'accent-amber-500'"
              />
              <span class="ml-2 text-sm" :class="form.moodType === 'positive' ? 'text-teal-700' : 'text-amber-700'">
                {{ getSeverityLabel(form.severity) }}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="text-sm font-medium text-gray-500">状态</h3>
          <div class="mt-1">
            <span :class="{
              'px-2 py-1 text-xs rounded-full': true,
              'bg-amber-100 text-amber-800': form.status === 'ongoing',
              'bg-teal-100 text-teal-800': form.status === 'resolved',
            }">
              {{ getStatusLabel(form.status) }}
            </span>
          </div>
        </div>
        
        <div v-if="editMode" class="md:col-span-2">
          <h3 class="text-sm font-medium text-gray-500">情绪类型</h3>
          <div class="flex space-x-4 mt-1">
            <label class="flex items-center">
              <input 
                type="radio" 
                v-model="form.moodType" 
                value="positive" 
                class="mr-2"
              />
              <span class="text-sm text-teal-700">积极心情</span>
            </label>
            <label class="flex items-center">
              <input 
                type="radio" 
                v-model="form.moodType" 
                value="negative" 
                class="mr-2"
              />
              <span class="text-sm text-amber-700">消极心情</span>
            </label>
          </div>
        </div>
      </div>
      
      <div class="space-y-6">
        <div>
          <h3 class="text-sm font-medium text-gray-500 mb-2">{{ getContentLabel }}</h3>
          <div v-if="!editMode" class="prose">
            <p v-if="form.content" class="text-gray-700 whitespace-pre-line">{{ form.content }}</p>
            <p v-else class="text-gray-400 italic">尚未记录内容</p>
          </div>
          <textarea
            v-else
            v-model="form.content"
            rows="4"
            :placeholder="form.moodType === 'positive' 
              ? '记录这个美好时刻的感受...' 
              : '记录当前的心情和感受...'"
            class="textarea"
            :class="form.moodType === 'positive' ? 'focus:border-teal-300' : 'focus:border-amber-300'"
          ></textarea>
        </div>
        
        <div>
          <h3 class="text-sm font-medium text-gray-500 mb-2">{{ getResolutionLabel }}</h3>
          <div v-if="!editMode" class="prose">
            <p v-if="form.resolution" class="text-gray-700 whitespace-pre-line">{{ form.resolution }}</p>
            <p v-else class="text-gray-400 italic">
              {{ form.moodType === 'positive' ? '尚未记录珍藏感受' : '尚未记录应对方式' }}
            </p>
          </div>
          <textarea
            v-else
            v-model="form.resolution"
            rows="4"
            :placeholder="form.moodType === 'positive' 
              ? '记录这个美好时刻带给你的珍贵感受...' 
              : '记录如何应对这种情绪...'"
            class="textarea"
            :class="form.moodType === 'positive' ? 'focus:border-teal-300' : 'focus:border-amber-300'"
          ></textarea>
        </div>
        
        <div>
          <h3 class="text-sm font-medium text-gray-500 mb-2">{{ getReflectionLabel }}</h3>
          <div v-if="!editMode" class="prose">
            <p v-if="form.reflection" class="text-gray-700 whitespace-pre-line">{{ form.reflection }}</p>
            <p v-else class="text-gray-400 italic">
              {{ form.moodType === 'positive' ? '尚未记录成长收获' : '尚未记录心得体会' }}
            </p>
          </div>
          <textarea
            v-else
            v-model="form.reflection"
            rows="4"
            :placeholder="form.moodType === 'positive' 
              ? '记录从这个美好时刻中获得的成长...' 
              : '记录从这次情绪中学到的东西...'"
            class="textarea"
            :class="form.moodType === 'positive' ? 'focus:border-teal-300' : 'focus:border-amber-300'"
          ></textarea>
        </div>
      </div>
    </div>
    
    <!-- AI分析弹窗 -->
    <AIAnalysis
      :argument-id="id"
      :visible="showAIAnalysis"
      @close="closeAIAnalysis"
    />
  </div>
  <div v-else class="text-center py-12">
    <p class="text-gray-500">加载中...</p>
  </div>
</template> 