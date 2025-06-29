<template>
  <div class="demo-container">
    <div class="demo-header">
      <h2>納入先ドラッグ＆ドロップ グループ化フィルターデモ</h2>
      <p>これは新しいドラッグ＆ドロップによるグループ化機能のデモページです</p>
    </div>

    <div class="demo-controls">
      <el-button type="primary" @click="openDialog">
        <el-icon><Van /></el-icon>
        納入先グループ選択を開く
      </el-button>

      <div class="current-selection" v-if="selectedDestinations.length > 0">
        <h3>現在選択中の納入先:</h3>
        <div class="selected-items">
          <el-tag
            v-for="dest in selectedDestinations"
            :key="dest"
            type="primary"
            class="selected-tag"
          >
            {{ dest }}
          </el-tag>
        </div>
      </div>

      <div class="groups-info" v-if="destinationGroups.length > 0">
        <h3>グループ情報:</h3>
        <div class="groups-list">
          <div v-for="(group, index) in destinationGroups" :key="index" class="group-item">
            <div class="group-header">
              <strong>{{ group.name }}</strong>
              <span class="group-count">({{ group.destinations.length }}件)</span>
            </div>
            <div class="group-destinations">
              <el-tag
                v-for="dest in group.destinations"
                :key="dest.value"
                size="small"
                class="dest-tag"
              >
                {{ dest.value }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ドラッグ＆ドロップ グループ化選択コンポーネント -->
    <DestinationDragFilter
      v-model="dialogVisible"
      :selectedDestinations="selectedDestinations"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Van } from '@element-plus/icons-vue'
import DestinationDragFilter from './DestinationDragFilter.vue'

// リアクティブデータ
const dialogVisible = ref(false)
const selectedDestinations = ref<string[]>([])
const destinationGroups = ref<any[]>([])

// ダイアログを開く
const openDialog = () => {
  dialogVisible.value = true
}

// 選択を確定する
const handleConfirm = (groups: any[], allSelected: string[]) => {
  destinationGroups.value = groups
  selectedDestinations.value = allSelected

  ElMessage.success(
    `${groups.length}個のグループ、合計${allSelected.length}個の納入先が選択されました`,
  )

  console.log('グループ情報:', groups)
  console.log('選択されたすべての納入先:', allSelected)
}
</script>

<style scoped>
.demo-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f0f4ff 0%, #e1ecff 50%, #d4e6ff 100%);
  min-height: 100vh;
}

.demo-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.demo-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 24px;
}

.demo-header p {
  color: #7f8c8d;
  margin: 0;
}

.demo-controls {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.current-selection {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.current-selection h3 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 16px;
}

.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag {
  margin: 0;
}

.groups-info {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #27ae60;
}

.groups-info h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 16px;
}

.groups-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.group-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e1e8ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #2c3e50;
}

.group-count {
  background: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.group-destinations {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dest-tag {
  margin: 0;
  font-size: 11px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-container {
    padding: 16px;
  }

  .groups-list {
    grid-template-columns: 1fr;
  }

  .selected-items,
  .group-destinations {
    gap: 4px;
  }
}
</style>
