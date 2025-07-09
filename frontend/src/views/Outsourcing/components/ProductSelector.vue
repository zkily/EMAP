<template>
  <div class="product-selector">
    <!-- 搜索筛选 -->
    <div class="search-section">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchForm.keyword"
            placeholder="製品コード・名称で検索"
            prefix-icon="el-icon-search"
            @input="handleSearch"
            clearable>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="searchForm.category"
            placeholder="カテゴリ選択"
            @change="handleSearch"
            clearable>
            <el-option
              v-for="category in categoryList"
              :key="category.id"
              :label="category.name"
              :value="category.id">
            </el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="searchForm.status"
            placeholder="ステータス"
            @change="handleSearch">
            <el-option label="全て" value=""></el-option>
            <el-option label="有効" value="active"></el-option>
            <el-option label="無効" value="inactive"></el-option>
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch" :loading="loading">
            検索
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 产品列表 -->
    <div class="product-list">
      <el-table
        :data="productList"
        v-loading="loading"
        height="400"
        @row-click="selectProduct"
        highlight-current-row
        size="small">
        <el-table-column prop="code" label="製品コード" width="120" fixed="left">
          <template slot-scope="scope">
            <span class="product-code">{{ scope.row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="製品名" min-width="200">
          <template slot-scope="scope">
            <div class="product-info">
              <div class="product-name">{{ scope.row.name }}</div>
              <div class="product-spec" v-if="scope.row.specification">
                {{ scope.row.specification }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category_name" label="カテゴリ" width="120">
          <template slot-scope="scope">
            <el-tag size="small" type="info">{{ scope.row.category_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="単位" width="80" align="center"></el-table-column>
        <el-table-column prop="unit_price" label="単価" width="100" align="right">
          <template slot-scope="scope">
            <span class="price">¥{{ formatNumber(scope.row.unit_price) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lead_time" label="リードタイム" width="100" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.lead_time">
              {{ scope.row.lead_time }}日
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock_quantity" label="在庫" width="80" align="right">
          <template slot-scope="scope">
            <span :class="getStockClass(scope.row.stock_quantity, scope.row.safety_stock)">
              {{ formatNumber(scope.row.stock_quantity) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="ステータス" width="80" align="center">
          <template slot-scope="scope">
            <el-tag
              :type="scope.row.status === 'active' ? 'success' : 'danger'"
              size="small">
              {{ scope.row.status === 'active' ? '有効' : '無効' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="primary"
              size="small"
              @click.stop="selectProduct(scope.row)">
              選択
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.current"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total">
      </el-pagination>
    </div>

    <!-- 产品详情预览 -->
    <div class="product-preview" v-if="selectedProduct">
      <h4>製品詳細</h4>
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="製品コード">
          {{ selectedProduct.code }}
        </el-descriptions-item>
        <el-descriptions-item label="製品名">
          {{ selectedProduct.name }}
        </el-descriptions-item>
        <el-descriptions-item label="仕様">
          {{ selectedProduct.specification || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="カテゴリ">
          {{ selectedProduct.category_name }}
        </el-descriptions-item>
        <el-descriptions-item label="単位">
          {{ selectedProduct.unit }}
        </el-descriptions-item>
        <el-descriptions-item label="単価">
          ¥{{ formatNumber(selectedProduct.unit_price) }}
        </el-descriptions-item>
        <el-descriptions-item label="リードタイム">
          {{ selectedProduct.lead_time ? selectedProduct.lead_time + '日' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="在庫数量">
          {{ formatNumber(selectedProduct.stock_quantity) }}
        </el-descriptions-item>
        <el-descriptions-item label="安全在庫">
          {{ formatNumber(selectedProduct.safety_stock) }}
        </el-descriptions-item>
        <el-descriptions-item label="最小注文数">
          {{ formatNumber(selectedProduct.min_order_qty) }}
        </el-descriptions-item>
        <el-descriptions-item label="備考" :span="2">
          {{ selectedProduct.remarks || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 操作按钮 -->
    <div class="action-section">
      <el-button @click="$emit('cancel')">キャンセル</el-button>
      <el-button
        type="primary"
        @click="confirmSelect"
        :disabled="!selectedProduct">
        選択確定
      </el-button>
    </div>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'
import { debounce } from 'lodash'

export default {
  name: 'ProductSelector',
  props: {
    supplierId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      loading: false,
      searchForm: {
        keyword: '',
        category: '',
        status: 'active'
      },
      productList: [],
      categoryList: [],
      selectedProduct: null,
      pagination: {
        current: 1,
        size: 20,
        total: 0
      }
    }
  },
  mounted() {
    this.loadCategoryList()
    this.loadProductList()

    // 创建防抖搜索函数
    this.debouncedSearch = debounce(this.loadProductList, 300)
  },
  methods: {
    async loadCategoryList() {
      try {
        const response = await outsourcingApi.getProductCategories()
        if (response.success) {
          this.categoryList = response.data
        }
      } catch (error) {
        console.error('カテゴリリスト取得エラー:', error)
      }
    },

    async loadProductList() {
      this.loading = true
      try {
        const params = {
          supplier_id: this.supplierId,
          ...this.searchForm,
          page: this.pagination.current,
          size: this.pagination.size
        }

        const response = await outsourcingApi.getSupplierProducts(params)
        if (response.success) {
          this.productList = response.data.items
          this.pagination.total = response.data.total
        }
      } catch (error) {
        console.error('製品リスト取得エラー:', error)
        this.$message.error('製品リストの取得に失敗しました')
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.pagination.current = 1
      this.selectedProduct = null
      this.debouncedSearch()
    },

    handleSizeChange(size) {
      this.pagination.size = size
      this.pagination.current = 1
      this.loadProductList()
    },

    handleCurrentChange(page) {
      this.pagination.current = page
      this.loadProductList()
    },

    selectProduct(product) {
      this.selectedProduct = product
    },

    confirmSelect() {
      if (!this.selectedProduct) {
        this.$message.warning('製品を選択してください')
        return
      }

      this.$emit('select', this.selectedProduct)
    },

    getStockClass(stock, safetyStock) {
      if (stock <= 0) return 'stock-out'
      if (stock <= safetyStock) return 'stock-low'
      return 'stock-normal'
    },

    formatNumber(value) {
      if (value == null) return '0'
      return Number(value).toLocaleString()
    }
  }
}
</script>

<style scoped>
.product-selector {
  padding: 20px;
}

.search-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.product-list {
  margin-bottom: 20px;
}

.product-code {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #409eff;
}

.product-info {
  line-height: 1.4;
}

.product-name {
  font-weight: 600;
  color: #2c3e50;
}

.product-spec {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.price {
  font-weight: 600;
  color: #67c23a;
}

.stock-normal {
  color: #67c23a;
  font-weight: 600;
}

.stock-low {
  color: #e6a23c;
  font-weight: 600;
}

.stock-out {
  color: #f56c6c;
  font-weight: 600;
}

.text-muted {
  color: #909399;
}

.pagination-section {
  text-align: center;
  margin-bottom: 20px;
}

.product-preview {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #409eff;
}

.product-preview h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
}

.action-section {
  text-align: right;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
}

.action-section .el-button {
  margin-left: 10px;
}

.el-select {
  width: 100%;
}

.el-table {
  border-radius: 6px;
  overflow: hidden;
}

.el-table th {
  background-color: #f8f9fa;
  color: #2c3e50;
  font-weight: 600;
}

.el-table tbody tr:hover {
  background-color: #f0f9ff;
}

.el-table tbody tr.current-row {
  background-color: #e6f7ff;
}

.el-descriptions {
  margin-top: 10px;
}

.el-descriptions-item__label {
  font-weight: 600;
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-section .el-col {
    margin-bottom: 10px;
  }

  .product-preview {
    padding: 15px;
  }

  .el-descriptions {
    font-size: 12px;
  }
}
</style>
