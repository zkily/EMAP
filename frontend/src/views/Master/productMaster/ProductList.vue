<template>
  <div class="product-master-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="main-title">
            <el-icon class="title-icon">
              <Box />
            </el-icon>
            製品マスタ管理
          </h1>
          <p class="subtitle">製品情報の登録・編集・管理を行います</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <div class="stat-number">{{ allProducts?.length || 0 }}</div>
            <div class="stat-label">総製品数</div>
          </div>
          <div class="stat-card" v-for="(count, type) in productTypeStats" :key="type">
            <div class="stat-number">{{ count }}</div>
            <div class="stat-label">{{ type }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能操作区域 -->
    <div class="action-section">
      <!-- 筛选标题 -->
      <div class="filter-header">
        <div class="filter-title">
          <el-icon class="filter-icon">
            <Filter />
          </el-icon>
          <span>検索・絞り込み</span>
        </div>
        <div class="filter-actions">
          <el-button text @click="handleReset" :icon="Refresh" class="clear-btn">
            リセット
          </el-button>
          <el-button type="success" @click="handleExport" :icon="Download" class="export-btn">
            エクスポート
          </el-button>
          <el-button type="primary" @click="handleAdd" :icon="Plus" class="add-product-btn">
            製品追加
          </el-button>
        </div>
      </div>

      <!-- 筛选内容 -->
      <div class="filters-grid">
        <el-row :gutter="16">
          <el-col :lg="6" :md="12">
            <!-- 搜索关键词 -->
            <el-form-item label="🔍 キーワード">
              <el-input v-model="filters.keyword" placeholder="製品名 / 納入先名" clearable style="width: 100%" />
            </el-form-item>
          </el-col>
          <!-- 类别 -->
          <el-col :lg="6" :md="12">
            <el-form-item label="📁 カテゴリ">
              <el-select v-model="filters.category" clearable placeholder="選択" style="min-width: 100px;width: 100%">
                <el-option label="一般" value="一般" />
                <el-option label="一般溶接" value="一般溶接" />
                <el-option label="メカ溶接" value="メカ溶接" />
                <el-option label="自動車" value="自動車" />
                <el-option label="その他" value="その他" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 状态 -->
          <el-col :lg="6" :md="12">
            <el-form-item label="🔖 状態">
              <el-select v-model="filters.status" clearable placeholder="選択" style="min-width: 100px;width: 100%">
                <el-option label="現行" value="active" />
                <el-option label="終息" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 产品种别 -->
          <el-col :lg="6" :md="12">
            <el-form-item label="🏷️ 製品種別">
              <el-select v-model="filters.product_type" clearable placeholder="選択" style="min-width: 100px;width: 100%">
                <el-option label="量産品" value="量産品" />
                <el-option label="試作品" value="試作品" />
                <el-option label="補給品" value="補給品" />
                <el-option label="その他" value="その他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 产品CD -->
        <el-row :gutter="16">
          <el-col :lg="6" :md="12">
            <el-form-item label="🆔 製品CD">
              <el-select v-model="filters.product_cd" filterable clearable placeholder="選択" style="width: 100%">
                <el-option v-for="item in productCdOptions" :key="item.cd" :label="`${item.cd}｜${item.name}`"
                  :value="item.cd" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 材料CD -->
          <el-col :lg="6" :md="12">
            <el-form-item label="🧱 材料CD">
              <el-select v-model="filters.material_cd" filterable clearable placeholder="選択" style="width: 100%">
                <el-option v-for="item in materialOptions" :key="item.cd" :label="`${item.cd}｜${item.name}`"
                  :value="item.cd" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 工程ルートCD -->
          <el-col :lg="6" :md="12">
            <el-form-item label="🛠️ 工程ルートCD">
              <el-select v-model="filters.route_cd" filterable clearable placeholder="選択" style="width: 100%">
                <el-option v-for="item in routeOptions" :key="item.cd" :label="`${item.cd}｜${item.name}`"
                  :value="item.cd" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 搜索按钮 -->
          <el-col :lg="6" :md="12" class="button-col">
            <el-form-item>
              <el-button type="primary" @click="fetchList"><el-icon>
                  <Search />
                </el-icon> 検索</el-button>
              <el-button @click="handleReset">リセット</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 筛选结果摘要 -->
      <div class="filter-summary" v-if="hasActiveFilters">
        <div class="summary-text">
          <el-icon class="summary-icon">
            <InfoFilled />
          </el-icon>
          <span>{{ productList.length }}件中を表示</span>
        </div>
        <div class="active-filters">
          <el-tag v-if="filters.keyword" closable @close="filters.keyword = ''; fetchList()" type="primary"
            size="small">
            検索: {{ filters.keyword }}
          </el-tag>
          <el-tag v-if="filters.category" closable @close="filters.category = ''; fetchList()" type="warning"
            size="small">
            カテゴリ: {{ filters.category }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table :data="productList" v-loading="loading" stripe border highlight-current-row style="width: 100%"
      height="600" :header-cell-style="{ background: '#f5f7fa', fontWeight: 'bold' }"
      :cell-style="{ padding: '8px 10px' }" :default-sort="{ prop: 'product_name', order: 'ascending' }"
      :scrollbar-always-on="true">
      <el-table-column fixed prop="product_cd" label="製品CD" min-width="85" />
      <el-table-column prop="product_name" label="製品名称" min-width="155" />
      <el-table-column label="納入先名" min-width="195">
        <template #default="{ row }">
          {{ row.destination_name || '—' }}
        </template>
      </el-table-column>
      <el-table-column prop="product_type" label="製品種別" width="100" />
      <el-table-column prop="category" label="カテゴリ" min-width="101" align="center" />
      <el-table-column prop="box_type" label="箱種" min-width="101" align="center" />
      <el-table-column prop="unit_per_box" label="入数" width="70" align="center" />
      <el-table-column prop="process_count" label="工程数" width="68" align="center" />
      <el-table-column prop="status" label="状態" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? '現行' : '終息' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleEdit(row)">
            <el-icon>
              <Edit />
            </el-icon> 編集
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">
            <el-icon>
              <Delete />
            </el-icon> 削除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination v-model:current-page="pagination.page" :page-size="pagination.pageSize" :total="pagination.total"
      layout="prev, pager, next" class="pagination" @current-change="fetchList" />

    <!-- 编辑弹窗 -->
    <ProductEditDialog v-model:visible="dialogVisible" :editData="selectedRow" @saved="fetchList" />
  </div>
</template>

<script setup lang="ts">
/**
 * 製品マスタ一覧
 * 功能：
 * - 筛选+分页+CRUD
 * - 支持导出Excel
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Box,
  Filter,
  Refresh,
  Download,
  Plus,
  Search,
  InfoFilled,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import { getProductList, deleteProduct } from '@/api/master/productMaster'
import { getProductOptions, getMaterialOptions, getRouteOptions } from '@/api/options'
import ProductEditDialog from './ProductEditDialog.vue'
import type { Product, OptionItem } from '@/types/master'
import * as XLSX from 'xlsx'
import { useMainStore } from '@/store/main'

// 筛选条件
const filters = reactive({
  keyword: '',
  category: '',
  product_cd: '',
  product_type: '',
  material_cd: '',
  route_cd: '',
  status: '',
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0
})

// 数据
const productList = ref<Product[]>([])
const allProducts = ref<Product[]>([]) // 新增：用于统计全部产品
const productCdOptions = ref<OptionItem[]>([])
const materialOptions = ref<OptionItem[]>([])
const routeOptions = ref<OptionItem[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const selectedRow = ref<Product | null>(null)

// 権限制御
const store = useMainStore()
const isAdmin = computed(() => store.userInfo?.role === 'admin')

// 计算属性 - 基于全部产品数据统计
const activeProductsCount = computed(() =>
  allProducts.value ? allProducts.value.filter(product => product.status === 'active').length : 0
)

const categoryCount = computed(() => {
  if (!allProducts.value) return 0
  const categories = new Set(allProducts.value.map(p => p.category).filter(Boolean))
  return categories.size
})

// 新增：各製品種別件数统计
const productTypeStats = computed(() => {
  const stats: Record<string, number> = {
    '量産品': 0,
    '試作品': 0,
    '補給品': 0,
    'その他': 0
  }
  if (allProducts.value) {
    allProducts.value.forEach(p => {
      const type = p.product_type as string
      if (type && Object.prototype.hasOwnProperty.call(stats, type)) {
        stats[type]++
      } else {
        stats['その他']++
      }
    })
  }
  return stats
})

const hasActiveFilters = computed(() => {
  return filters.keyword ||
    filters.category ||
    filters.product_cd ||
    filters.product_type ||
    filters.material_cd ||
    filters.route_cd ||
    filters.status
})

// 获取列表
const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...filters,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const response = await getProductList(params)

    // 处理API响应结构 {success: true, data: {list: [], total: number}}
    if (response.success && response.data) {
      productList.value = response.data.list || []
      pagination.total = response.data.total || 0
    } else {
      // 兼容直接返回数据的情况
      productList.value = response.list || []
      pagination.total = response.total || 0
    }
  } catch (e) {
    console.error('製品一覧取得失敗', e)
    ElMessage.error('製品一覧取得失敗')
    productList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 新增
const handleAdd = () => {
  selectedRow.value = null
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Product) => {
  selectedRow.value = { ...row }
  dialogVisible.value = true
}

// 重置
const handleReset = () => {
  Object.assign(filters, {
    keyword: '',
    category: '',
    product_cd: '',
    product_type: '',
    material_cd: '',
    route_cd: '',
    status: '',
  })
  pagination.page = 1
  fetchList()
}

// 削除
const handleDelete = async (row: Product) => {
  const confirmed = await ElMessageBox.confirm(
    `本当に製品「${row.product_name}」を削除しますか？`,
    '削除確認',
    {
      confirmButtonText: '削除',
      cancelButtonText: 'キャンセル',
      type: 'warning',
    }
  ).catch(() => false)

  if (!confirmed) return

  try {
    // 确保在请求中包含访问令牌
    const token = localStorage.getItem('access_token');
    if (!token) {
      ElMessage.error('アクセストークンが見つかりません。再度ログインしてください。');
      return;
    }
    // 由于 deleteProduct 方法只接收一个参数，我们需要在 API 调用中处理令牌
    // 暂时移除令牌参数，等待 API 更新
    await deleteProduct(row.id!)
    ElMessage.success('削除しました')
    fetchList()
  } catch (e) {
    console.error('削除失敗', e)
    ElMessage.error('削除に失敗しました')
  }
}

// 导出Excel
const handleExport = () => {
  const exportData = productList.value.map((item) => ({
    製品CD: item.product_cd,
    製品名称: item.product_name,
    製品種別: item.product_type,
    カテゴリ: item.category,
    箱種: item.box_type,
    入数: item.unit_per_box,
    工程数: item.process_count,
    状態: item.status,
  }))
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '製品マスタ')
  XLSX.writeFile(workbook, '製品マスタ一覧.xlsx')
}

// 初始化
onMounted(async () => {
  try {
    await fetchList()
    // 获取全部产品数据用于统计
    const allDataResponse = await getProductList({ page: 1, pageSize: 999999 })

    // 处理API响应结构
    if (allDataResponse.success && allDataResponse.data) {
      allProducts.value = allDataResponse.data.list || []
    } else {
      // 兼容直接返回数据的情况
      allProducts.value = allDataResponse.list || []
    }

    // 获取选项数据
    const [productOptions, materialOpts, routeOpts] = await Promise.all([
      getProductOptions(),
      getMaterialOptions(),
      getRouteOptions()
    ])

    productCdOptions.value = productOptions || []
    materialOptions.value = materialOpts || []
    routeOptions.value = routeOpts || []
  } catch (error) {
    console.error('初期化エラー', error)
    ElMessage.error('データ読み込み中にエラーが発生しました')
    // 确保即使出错也初始化为空数组
    allProducts.value = []
    productCdOptions.value = []
    materialOptions.value = []
    routeOptions.value = []
  }
})
</script>

<style scoped>
.product-master-container {
  padding: 20px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  background: white;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.title-section {
  flex: 1;
}

.main-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 1.8rem;
  color: #3498db;
}

.subtitle {
  color: #7f8c8d;
  margin: 0;
  font-size: 1rem;
}

.header-stats {
  display: flex;
  gap: 16px;
}

.stat-card {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  padding: 20px;
  border-radius: 16px;
  text-align: center;
  min-width: 120px;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 4px;
}

/* 操作区域 */
.action-section {
  background: white;
  border-radius: 20px;
  padding: 0;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
}

.filter-icon {
  font-size: 1.3rem;
  color: #3498db;
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.clear-btn {
  color: #718096;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  color: #3498db;
  transform: scale(1.05);
}

.export-btn {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
  transition: all 0.3s ease;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(39, 174, 96, 0.4);
}

.add-product-btn {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  transition: all 0.3s ease;
}

.add-product-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
}

.filters-grid {
  padding: 32px;
  background: white;
}

.filter-summary {
  padding: 20px 32px;
  background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
  border-top: 1px solid #e2e8f0;
}

.summary-text {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: 500;
}

.summary-icon {
  color: #3498db;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .header-stats {
    align-self: stretch;
    justify-content: space-around;
  }
}

@media (max-width: 768px) {
  .product-master-container {
    padding: 16px;
  }

  .page-header {
    padding: 24px 20px;
  }

  .main-title {
    font-size: 1.6rem;
  }

  .filter-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 20px 24px;
  }

  .filter-actions {
    justify-content: stretch;
  }

  .filter-actions>* {
    flex: 1;
  }

  .stat-card {
    min-width: auto;
    flex: 1;
  }
}

/* 动画效果 */
.page-header,
.action-section {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
