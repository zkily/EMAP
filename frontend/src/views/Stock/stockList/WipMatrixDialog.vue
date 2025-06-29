<template>
  <el-dialog v-model="visible" title="📊 仕掛品マトリクス" width="80%" top="5vh" :close-on-click-modal="false">
    <!-- 製品選択 -->
    <div class="top-controls">
      <el-input v-model="selectedProductDisplay" placeholder="📦 製品を選択" readonly class="product-input"
        @click="productDialogVisible = true">
        <template #append>
          <el-button icon="Search" @click="productDialogVisible = true" />
          <el-button icon="Close" @click="selectedProduct = null" style="margin-left: 10px" />
        </template>
      </el-input>
    </div>

    <!-- 工程ボタン群 -->
    <div class="process-button-group">
      <el-button size="large" round type="primary" plain @click="selectAllProcesses"
        :class="{ active: activeProcessList.length === 0 }" class="full-button">
        全て表示
      </el-button>

      <draggable v-model="customProcessOrder" item-key="code" tag="div" class="draggable-buttons" :animation="150">
        <template #item="{ element }">
          <el-button size="default" round type="default" plain :key="element" @click="toggleProcess(element)"
            :class="{ active: activeProcessList.includes(element) }">
            {{ processNameMap[element] || element }}
          </el-button>
        </template>
      </draggable>
    </div>

    <!-- 表格 -->
    <el-table :data="filteredMatrix" border stripe height="60vh" show-summary :summary-method="getSummary">
      <el-table-column prop="product_name" label="製品名" fixed width="200">
        <template #default="{ row }">
          <el-tooltip :content="row.product_cd">
            <span>{{ row.product_name || row.product_cd }}</span>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column v-for="process in displayedProcesses" :key="process" :prop="process"
        :label="processNameMap[process] || process" align="right" width="100">
        <template #default="{ row }">
          {{ formatNumber(row[process] || 0) }}
        </template>
      </el-table-column>

      <el-table-column prop="合計" label="合計" align="right" width="100">
        <template #default="{ row }">
          {{ formatNumber(row.合計 || 0) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 製品選択ダイアログ -->
    <el-dialog v-model="productDialogVisible" title="📦 製品を選択" width="30%">
      <el-table :data="productList" @row-click="selectProduct" highlight-current-row
        style="max-height: 400px; overflow: auto">
        <el-table-column prop="product_cd" label="製品CD" width="140" />
        <el-table-column prop="product_name" label="製品名" />
      </el-table>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import draggable from 'vuedraggable';
import { fetchWipStock, getProcessOrder } from '@/api/stock/stockWip';
import { formatNumber } from '@/utils/format';

interface WipStockItem {
  product_cd: string
  product_name: string
  process_cd: string
  process_name: string
  quantity: number
}

interface MatrixItem {
  product_cd: string
  product_name: string
  合計: number
  [key: string]: string | number
}

interface ProcessOrderItem {
  process_cd: string
  step_no: number
}

interface ProductItem {
  product_cd: string
  product_name: string
}

interface TableColumn {
  property: string
}

interface SummaryParams {
  columns: TableColumn[]
  data: MatrixItem[]
}

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
});

const rawData = ref<WipStockItem[]>([]);
const matrixData = ref<MatrixItem[]>([]);

const allProcesses = ref<string[]>([]);
const customProcessOrder = ref<string[]>([]);
const processNameMap = ref<Record<string, string>>({});

const activeProcessList = ref<string[]>(
  JSON.parse(localStorage.getItem('matrix_process_list') || '[]')
);

// 製品選択
const selectedProduct = ref<ProductItem | null>(null);
const productDialogVisible = ref(false);

const selectedProductDisplay = computed(() =>
  selectedProduct.value
    ? `${selectedProduct.value.product_cd} - ${selectedProduct.value.product_name}`
    : ''
);

// 工程取得 + 順序
const loadProcessOrder = async () => {
  const res = await getProcessOrder(); // [{ process_cd, step_no }]
  allProcesses.value = res.map((r: ProcessOrderItem) => r.process_cd);
  customProcessOrder.value = [...allProcesses.value];
};

// データ読み込み
const loadData = async () => {
  const res = await fetchWipStock();
  rawData.value = res;

  // 工程名Map作成
  processNameMap.value = {};
  for (const r of res) {
    if (r.process_cd && r.process_name) {
      processNameMap.value[r.process_cd] = r.process_name;
    }
  }

  const grouped = new Map<string, MatrixItem>();
  for (const row of res) {
    const key = row.product_cd;
    if (!grouped.has(key)) {
      grouped.set(key, {
        product_cd: row.product_cd,
        product_name: row.product_name,
        合計: 0
      });
    }
    const entry = grouped.get(key)!;
    entry[row.process_cd] = row.quantity;
    entry.合計 += row.quantity;
  }

  matrixData.value = Array.from(grouped.values());
};

// 工程表示切り替え
const toggleProcess = (proc: string) => {
  const list = activeProcessList.value;
  const idx = list.indexOf(proc);
  if (idx === -1) {
    list.push(proc);
  } else {
    list.splice(idx, 1);
  }
  localStorage.setItem('matrix_process_list', JSON.stringify(list));
};

const selectAllProcesses = () => {
  activeProcessList.value = [];
  localStorage.removeItem('matrix_process_list');
};

const displayedProcesses = computed(() =>
  activeProcessList.value.length > 0
    ? customProcessOrder.value.filter(p => activeProcessList.value.includes(p))
    : customProcessOrder.value
);

const productList = computed(() => {
  const seen = new Map<string, ProductItem>();
  rawData.value.forEach(r => {
    if (!seen.has(r.product_cd)) {
      seen.set(r.product_cd, { product_cd: r.product_cd, product_name: r.product_name });
    }
  });
  return Array.from(seen.values());
});

const filteredMatrix = computed(() =>
  matrixData.value.filter(r =>
    !selectedProduct.value || r.product_cd === selectedProduct.value.product_cd
  )
);

const selectProduct = (row: ProductItem) => {
  selectedProduct.value = { product_cd: row.product_cd, product_name: row.product_name };
  productDialogVisible.value = false;

  // 🔍 自動取得該製品使用工程
  const processSet = new Set<string>();
  rawData.value.forEach(r => {
    if (r.product_cd === row.product_cd) {
      processSet.add(r.process_cd);
    }
  });

  // 設定為當前表示字段
  activeProcessList.value = Array.from(processSet);
  localStorage.setItem('matrix_process_list', JSON.stringify(activeProcessList.value));
};


const getSummary = ({ columns, data }: SummaryParams) => {
  const summary: string[] = [];
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const prop = col.property;
    if (prop === 'product_name') {
      summary[i] = '合計';
    } else if (prop && prop !== '合計') {
      const total = data.reduce((sum: number, row: MatrixItem) => sum + (Number(row[prop]) || 0), 0);
      summary[i] = formatNumber(total);
    } else if (prop === '合計') {
      const total = data.reduce((sum: number, row: MatrixItem) => sum + (row.合計 || 0), 0);
      summary[i] = formatNumber(total);
    } else {
      summary[i] = '';
    }
  }
  return summary;
};

// 開いたら初期読み込み
watch(visible, async (val) => {
  if (val) {
    try {
      await loadProcessOrder();
      await loadData();
    } catch (err) {
      console.error('[WipMatrixDialog] データ取得エラー:', err);
    }
  }
});
</script>

<style scoped>
.top-controls {
  margin-bottom: 10px;
}

.product-input {
  width: 280px;
}

.process-button-group {
  margin-bottom: 12px;
}

.draggable-buttons {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.process-button-group .el-button.active {
  background-color: #409eff;
  color: white;
  font-weight: bold;
}

.process-button-group .el-button {
  font-size: 15px;
  padding: 10px 18px;
}

.full-button {
  margin-right: 16px;
}

.process-button-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.full-button {
  margin-right: 16px;
}

.draggable-buttons {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
