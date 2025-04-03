<script setup>
import { ref } from 'vue';
import { useArgumentStore } from '../stores/argument';
import { v4 as uuidv4 } from 'uuid';

const store = useArgumentStore();
const showForm = ref(false);
const editingId = ref(null);

const form = ref({
  name: '',
  color: '#4F46E5'
});

const resetForm = () => {
  form.value = {
    name: '',
    color: '#4F46E5'
  };
  editingId.value = null;
};

const addCategory = () => {
  if (!form.value.name.trim()) {
    alert('请输入分类名称');
    return;
  }

  if (editingId.value) {
    store.updateCategory(editingId.value, form.value);
  } else {
    store.addCategory({
      id: uuidv4(),
      ...form.value
    });
  }

  resetForm();
  showForm.value = false;
};

const editCategory = (category) => {
  form.value = {
    name: category.name,
    color: category.color
  };
  editingId.value = category.id;
  showForm.value = true;
};

const deleteCategory = (id) => {
  if (confirm('确定要删除此分类吗？这可能会影响已经使用此分类的争吵记录。')) {
    store.deleteCategory(id);
  }
};

const colors = [
  '#4F46E5', // 蓝色
  '#059669', // 绿色
  '#B45309', // 棕色
  '#7C3AED', // 紫色
  '#DC2626', // 红色
  '#DB2777', // 粉色
  '#0891B2', // 青色
  '#4B5563'  // 灰色
];
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">分类管理</h2>
      <button 
        v-if="!showForm" 
        @click="showForm = true" 
        class="btn btn-primary text-sm"
      >
        添加分类
      </button>
    </div>

    <!-- 添加/编辑表单 -->
    <div v-if="showForm" class="mb-4 bg-gray-50 p-4 rounded">
      <form @submit.prevent="addCategory" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">名称</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="input mt-1"
            placeholder="输入分类名称"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">颜色</label>
          <div class="flex flex-wrap gap-2 mt-1">
            <div
              v-for="color in colors"
              :key="color"
              :style="{ backgroundColor: color }"
              class="w-6 h-6 rounded-full cursor-pointer"
              :class="{ 'ring-2 ring-offset-2 ring-blue-500': form.color === color }"
              @click="form.color = color"
            ></div>
          </div>
        </div>

        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary flex-1">
            {{ editingId ? '更新' : '添加' }}
          </button>
          <button type="button" @click="showForm = false; resetForm();" class="btn btn-secondary">
            取消
          </button>
        </div>
      </form>
    </div>

    <!-- 分类列表 -->
    <div class="space-y-2">
      <div v-for="category in store.categories" :key="category.id" 
           class="flex items-center justify-between p-2 bg-gray-50 rounded">
        <div class="flex items-center">
          <div 
            :style="{ backgroundColor: category.color }" 
            class="w-4 h-4 rounded-full mr-2"
          ></div>
          <span>{{ category.name }}</span>
        </div>
        <div class="flex gap-2">
          <button 
            @click="editCategory(category)" 
            class="text-sm text-blue-600 hover:text-blue-800"
          >
            编辑
          </button>
          <button 
            @click="deleteCategory(category.id)" 
            class="text-sm text-red-600 hover:text-red-800"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template> 