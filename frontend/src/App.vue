<template>

  <router-view />

</template>

<script setup lang="ts">
// App 根组件，直接渲染路由页面
import { onMounted } from 'vue';
import { useMainStore } from '@/store/main';

// 创建store实例
const store = useMainStore();

// 应用加载时检查token
onMounted(() => {
  // 如果Pinia中没有token但localStorage有备份，则恢复
  if (!store.token && localStorage.getItem('token_backup')) {
    console.log('从备份恢复token');
    store.setToken(localStorage.getItem('token_backup') || '');
  }
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: "游ゴシック,Noto Sans JP", sans-serif;
  background-color: #f4f8fb;
}
</style>
