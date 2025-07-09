<template>
  <div>
    <h3>在庫移動履歴 (開発中)</h3>
    <p>選択された在庫情報をもとに移動履歴を表示するコンポーネントです。</p>
    <pre v-if="inventoryData">{{ JSON.stringify(inventoryData, null, 2) }}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'StockMovementHistory',
  props: {
    inventoryData: {
      type: Object as PropType<Record<string, any> | null>,
      required: false,
      default: null,
    },
  },
})
</script>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow: auto;
}
</style>
