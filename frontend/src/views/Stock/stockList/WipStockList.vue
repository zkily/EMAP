<template>
  <div class="wip-stock-list-page">
    <div class="header">
      <h2 class="title">⚙️ 仕掛品在庫一覧</h2>
    </div>

    <!-- フィルター -->
    <el-form :inline="false" :model="filters" class="filter-form vertical-form" @submit.prevent>
      <!-- 製品選択 -->
      <el-form-item label="製品CD">
        <div class="product-select-box">
          <el-input v-model="selectedProductText" placeholder="製品を選択" readonly class="product-input"
            @click="productDialogVisible = true" />
          <el-button icon="Search" class="product-btn" @click="productDialogVisible = true" />
          <el-button icon="Close" class="product-btn" @click="clearSelectedProduct" />
        </div>
      </el-form-item>

      <!-- 工程選択 -->
      <el-form-item label="工程CD">
        <el-select v-model="filters.process_cd" placeholder="工程を選択" clearable filterable style="width: 180px">
          <el-option v-for="item in processOptions" :key="item.cd" :label="`${item.cd} - ${item.name}`"
            :value="item.cd" />
        </el-select>
      </el-form-item>

      <!-- 操作ボタン -->
      <el-form-item>
        <div class="filter-buttons">
          <el-button type="primary" @click="fetchList">検索</el-button>
          <el-button @click="clearFilter">クリア</el-button>
          <el-button type="warning" :loading="loading" @click="handleRecalculate">再計算を実行</el-button>
          <el-button type="info" plain @click="showMatrixDialog = true">📊 マトリクス表示</el-button>
        </div>
      </el-form-item>
    </el-form>

    <!-- 一覧テーブル -->
    <el-table :data="filteredData" border stripe highlight-current-row style="margin-top: 10px">
      <el-table-column prop="product_cd" label="製品CD" width="120" />
      <el-table-column prop="product_name" label="製品名" min-width="160" />
      <el-table-column prop="process_cd" label="工程CD" width="120" />
      <el-table-column prop="process_name" label="工程名" min-width="140" />
      <el-table-column prop="step_no" label="工程順" width="80" align="center" />
      <el-table-column prop="quantity" label="数量" width="120" align="right">
        <template #default="{ row }">
          {{ formatNumber(row.quantity) }}
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新日時" width="180">
        <template #default="{ row }">
          {{ formatDate(row.updated_at) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- マトリクス表示 -->
    <WipMatrixDialog v-model="showMatrixDialog" />

    <!-- 製品選択ダイアログ -->
    <ProductSelectDialog v-model="productDialogVisible" @select="handleProductSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import { debounce } from 'lodash-es';

import { fetchWipStock, recalculateWipStock } from '@/api/stock/stockWip';
import { getProcessOptions, OptionItem } from '@/api/options';
import { formatNumber } from '@/utils/format';

import WipMatrixDialog from './WipMatrixDialog.vue';
import ProductSelectDialog from '../../../views/components/ProductSelectDialog.vue';

// 类型定义
interface WipStockItem {
  product_cd: string;
  product_name: string;
  process_cd: string;
  process_name: string;
  step_no: number;
  quantity: number;
  updated_at: string;
}

interface FilterState {
  product_cd: string;
  process_cd: string;
}

interface ProductItem {
  product_cd: string;
  product_name: string;
}

// 🔹 工程選択肢
const processOptions = ref<OptionItem[]>([]);
const loadProcessOptions = async () => {
  try {
    processOptions.value = await getProcessOptions();
  } catch (e) {
    console.error('工程選択肢の取得に失敗しました:', e);
    ElMessage.error('工程選択肢の取得に失敗しました');
  }
};

// 🔹 製品選択
const productDialogVisible = ref(false);
const selectedProduct = ref<any>(null);
const selectedProductText = ref('');
const handleProductSelect = (products: any[] | string[]) => {
  if (!products || products.length === 0) return;

  const first = products[0];

  // 如果是字符串数组（兼容旧的）
  if (typeof first === 'string') {
    selectedProduct.value = { product_cd: first, product_name: '' };
    selectedProductText.value = first;
    filters.value.product_cd = first;
  } else {
    // 对象数组（推荐的）
    selectedProduct.value = first;
    selectedProductText.value = `${first.product_cd} - ${first.product_name}`;
    filters.value.product_cd = first.product_cd;
  }

  productDialogVisible.value = false;
};

const clearSelectedProduct = () => {
  selectedProduct.value = null;
  selectedProductText.value = '';
  filters.value.product_cd = '';
};

// 🔹 フィルター＆再計算
const filters = ref({
  product_cd: '',
  process_cd: '',
});
const allData = ref<any[]>([]);
const loading = ref(false);
const showMatrixDialog = ref(false);

const formatDate = (val: string | Date) => {
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss');
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await fetchWipStock();
    allData.value = res;
  } catch (e) {
    console.error('在庫データの取得に失敗しました:', e);
    ElMessage.error('在庫データの取得に失敗しました');
  } finally {
    loading.value = false;
  }
};

const clearFilter = () => {
  filters.value = { product_cd: '', process_cd: '' };
  selectedProduct.value = null;
  selectedProductText.value = '';
  fetchList();
};

const handleRecalculate = async () => {
  loading.value = true;
  try {
    await recalculateWipStock();
    await fetchList();
    ElMessage.success('再計算が完了しました');
  } catch (e) {
    console.error('再計算エラー:', e);
    ElMessage.error('再計算に失敗しました');
  } finally {
    loading.value = false;
  }
};

// 🔹 フィルター適用
const filteredData = computed(() => {
  return allData.value.filter(item => {
    return (!filters.value.product_cd || item.product_cd.includes(filters.value.product_cd)) &&
      (!filters.value.process_cd || item.process_cd.includes(filters.value.process_cd));
  });
});

// 防抖处理
const debouncedFilter = debounce(() => {
  fetchList();
}, 300);

// 监听筛选条件变化
watch([() => filters.value.product_cd, () => filters.value.process_cd], () => {
  debouncedFilter();
});

// 初期ロード
onMounted(() => {
  fetchList();
  loadProcessOptions();
});
</script>

<style scoped>
.wip-stock-list-page {
  padding: 24px;
  background-color: #fafafa;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
}

.filter-form {
  margin-bottom: 16px;
  background: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.product-select-box {
  display: flex;
  align-items: center;
}

.product-input {
  width: 220px;
  margin-right: 6px;
}

.product-btn {
  margin-left: 2px;
}

.filter-buttons>.el-button {
  margin-right: 6px;
}

.el-table {
  font-size: 13px;
}

.vertical-form .el-form-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 12px;
}

.vertical-form .el-form-item__label {
  margin-bottom: 4px;
  font-weight: 500;
}
</style>
