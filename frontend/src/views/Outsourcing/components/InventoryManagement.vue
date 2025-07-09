<template>
  <div class="inventory-management">
    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card>
        <el-form :model="searchForm" inline size="small">
          <el-form-item label="仕入先">
            <el-select
              v-model="searchForm.supplier_id"
              placeholder="仕入先を選択"
              clearable
              filterable
              style="width: 200px"
            >
              <el-option
                v-for="supplier in supplierList"
                :key="supplier.id"
                :label="supplier.supplier_name"
                :value="supplier.id"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="材料">
            <el-select
              v-model="searchForm.material_cd"
              placeholder="材料を選択"
              clearable
              filterable
              style="width: 200px"
            >
              <el-option
                v-for="material in materialList"
                :key="material.material_cd"
                :label="material.material_name"
                :value="material.material_cd"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="在庫状態">
            <el-select
              v-model="searchForm.stock_status"
              placeholder="状態を選択"
              clearable
              style="width: 150px"
            >
              <el-option label="正常" value="normal"></el-option>
              <el-option label="不足" value="shortage"></el-option>
              <el-option label="過剰" value="excess"></el-option>
              <el-option label="期限切れ" value="expired"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="loadInventoryData">検索</el-button>
            <el-button @click="resetSearch">リセット</el-button>
            <el-button type="success" @click="exportInventory">エクスポート</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 统计概览 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <i class="el-icon-box"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ inventoryStats.total_items }}</div>
              <div class="stat-label">総アイテム数</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-card value">
            <div class="stat-icon">
              <i class="el-icon-money"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ formatNumber(inventoryStats.total_value) }}</div>
              <div class="stat-label">総在庫価値</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-card shortage">
            <div class="stat-icon">
              <i class="el-icon-warning"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ inventoryStats.shortage_items }}</div>
              <div class="stat-label">不足アイテム</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-card suppliers">
            <div class="stat-icon">
              <i class="el-icon-office-building"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ inventoryStats.active_suppliers }}</div>
              <div class="stat-label">活動仕入先数</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 库存列表 -->
    <div class="inventory-table">
      <el-card>
        <div slot="header" class="table-header">
          <span>外注仮想在庫一覧</span>
          <div class="table-actions">
            <el-button size="small" type="primary" @click="showStockAdjustment">在庫調整</el-button>
            <el-button size="small" @click="showStockMovement">在庫移動履歴</el-button>
          </div>
        </div>

        <el-table
          :data="inventoryList"
          v-loading="loading"
          border
          stripe
          style="width: 100%"
          :row-class-name="getRowClassName"
        >
          <el-table-column type="expand">
            <template #default="props">
              <div class="expand-content">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <h4>在庫詳細</h4>
                    <p><strong>最小在庫:</strong> {{ props.row.min_stock }}</p>
                    <p><strong>最大在庫:</strong> {{ props.row.max_stock }}</p>
                    <p><strong>安全在庫:</strong> {{ props.row.safety_stock }}</p>
                    <p><strong>発注点:</strong> {{ props.row.reorder_point }}</p>
                    <p><strong>最終更新:</strong> {{ formatDateTime(props.row.last_updated) }}</p>
                  </el-col>
                  <el-col :span="12">
                    <h4>最近の動き</h4>
                    <div class="recent-movements">
                      <div v-for="movement in props.row.recent_movements" :key="movement.id" class="movement-item">
                        <span class="movement-date">{{ formatDate(movement.movement_date) }}</span>
                        <span class="movement-type" :class="movement.movement_type">
                          {{ getMovementTypeText(movement.movement_type) }}
                        </span>
                        <span class="movement-quantity">{{ movement.quantity }}</span>
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="supplier_name" label="仕入先" width="150" fixed="left"></el-table-column>

          <el-table-column prop="material_cd" label="材料CD" width="120"></el-table-column>

          <el-table-column prop="material_name" label="材料名" width="200" show-overflow-tooltip></el-table-column>

          <el-table-column prop="current_stock" label="現在庫" width="100" align="right">
            <template #default="scope">
              <span :class="getStockClass(scope.row)">
                {{ formatNumber(scope.row.current_stock) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="unit" label="単位" width="80" align="center"></el-table-column>

          <el-table-column prop="unit_cost" label="単価" width="100" align="right">
            <template #default="scope">
              ¥{{ formatNumber(scope.row.unit_cost) }}
            </template>
          </el-table-column>

          <el-table-column prop="total_value" label="在庫価値" width="120" align="right">
            <template #default="scope">
              ¥{{ formatNumber(scope.row.total_value) }}
            </template>
          </el-table-column>

          <el-table-column prop="safety_stock" label="安全在庫" width="100" align="right"></el-table-column>

          <el-table-column prop="reorder_point" label="発注点" width="100" align="right"></el-table-column>

          <el-table-column label="在庫状態" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.stock_status)" size="small">
                {{ getStatusText(scope.row.stock_status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="last_movement_date" label="最終移動" width="120">
            <template #default="scope">
              {{ formatDate(scope.row.last_movement_date) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="viewMovementHistory(scope.row)">履歴</el-button>
              <el-button size="small" type="primary" @click="adjustStock(scope.row)">調整</el-button>
              <el-button size="small" type="warning" @click="transferStock(scope.row)">移動</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="pagination.current"
            :page-sizes="[20, 50, 100, 200]"
            :page-size="pagination.size"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
          ></el-pagination>
        </div>
      </el-card>
    </div>

    <!-- 库存调整对话框 -->
    <el-dialog
      title="在庫調整"
      :visible.sync="adjustmentDialogVisible"
      width="50%"
    >
      <stock-adjustment-form
        v-if="adjustmentDialogVisible"
        :inventory-data="currentInventory"
        @save="handleAdjustmentSave"
        @cancel="adjustmentDialogVisible = false"
      ></stock-adjustment-form>
    </el-dialog>

    <!-- 库存移动对话框 -->
    <el-dialog
      title="在庫移動"
      :visible.sync="transferDialogVisible"
      width="50%"
    >
      <stock-transfer-form
        v-if="transferDialogVisible"
        :inventory-data="currentInventory"
        @save="handleTransferSave"
        @cancel="transferDialogVisible = false"
      ></stock-transfer-form>
    </el-dialog>

    <!-- 移动历史对话框 -->
    <el-dialog
      title="在庫移動履歴"
      :visible.sync="historyDialogVisible"
      width="80%"
    >
      <stock-movement-history
        v-if="historyDialogVisible"
        :inventory-data="currentInventory"
      ></stock-movement-history>
    </el-dialog>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'
import StockAdjustmentForm from './StockAdjustmentForm.vue'
import StockTransferForm from './StockTransferForm.vue'
import StockMovementHistory from './StockMovementHistory.vue'

export default {
  name: 'InventoryManagement',
  components: {
    StockAdjustmentForm,
    StockTransferForm,
    StockMovementHistory
  },
  data() {
    return {
      loading: false,
      searchForm: {
        supplier_id: '',
        material_cd: '',
        stock_status: ''
      },
      inventoryList: [],
      supplierList: [],
      materialList: [],
      inventoryStats: {
        total_items: 0,
        total_value: 0,
        shortage_items: 0,
        active_suppliers: 0
      },
      pagination: {
        current: 1,
        size: 20,
        total: 0
      },
      adjustmentDialogVisible: false,
      transferDialogVisible: false,
      historyDialogVisible: false,
      currentInventory: null
    }
  },
  mounted() {
    this.loadSupplierList()
    this.loadMaterialList()
    this.loadInventoryData()
    this.loadInventoryStats()
  },
  methods: {
    async loadSupplierList() {
      try {
        const response = await outsourcingApi.getSupplierList()
        if (response.success) {
          this.supplierList = response.data
        }
      } catch (error) {
        console.error('仕入先リスト取得エラー:', error)
      }
    },

    async loadMaterialList() {
      try {
        const response = await outsourcingApi.getMaterialList()
        if (response.success) {
          this.materialList = response.data
        }
      } catch (error) {
        console.error('材料リスト取得エラー:', error)
      }
    },

    async loadInventoryData() {
      this.loading = true
      try {
        const params = {
          ...this.searchForm,
          page: this.pagination.current,
          size: this.pagination.size
        }

        const response = await outsourcingApi.getVirtualInventory(params)
        if (response.success) {
          this.inventoryList = response.data.items
          this.pagination.total = response.data.total
        }
      } catch (error) {
        console.error('在庫データ取得エラー:', error)
        this.$message.error('在庫データの取得に失敗しました')
      } finally {
        this.loading = false
      }
    },

    async loadInventoryStats() {
      try {
        const response = await outsourcingApi.getInventoryStats()
        if (response.success) {
          this.inventoryStats = response.data
        }
      } catch (error) {
        console.error('在庫統計取得エラー:', error)
      }
    },

    resetSearch() {
      this.searchForm = {
        supplier_id: '',
        material_cd: '',
        stock_status: ''
      }
      this.pagination.current = 1
      this.loadInventoryData()
    },

    handleSizeChange(size) {
      this.pagination.size = size
      this.pagination.current = 1
      this.loadInventoryData()
    },

    handleCurrentChange(current) {
      this.pagination.current = current
      this.loadInventoryData()
    },

    showStockAdjustment() {
      this.currentInventory = null
      this.adjustmentDialogVisible = true
    },

    showStockMovement() {
      this.historyDialogVisible = true
    },

    adjustStock(inventory) {
      this.currentInventory = { ...inventory }
      this.adjustmentDialogVisible = true
    },

    transferStock(inventory) {
      this.currentInventory = { ...inventory }
      this.transferDialogVisible = true
    },

    viewMovementHistory(inventory) {
      this.currentInventory = { ...inventory }
      this.historyDialogVisible = true
    },

    async handleAdjustmentSave(adjustmentData) {
      try {
        const response = await outsourcingApi.adjustInventoryStock(adjustmentData)
        if (response.success) {
          this.$message.success('在庫調整を完了しました')
          this.adjustmentDialogVisible = false
          this.loadInventoryData()
          this.loadInventoryStats()
        } else {
          this.$message.error(response.message || '在庫調整に失敗しました')
        }
      } catch (error) {
        console.error('在庫調整エラー:', error)
        this.$message.error('在庫調整に失敗しました')
      }
    },

    async handleTransferSave(transferData) {
      try {
        const response = await outsourcingApi.transferInventoryStock(transferData)
        if (response.success) {
          this.$message.success('在庫移動を完了しました')
          this.transferDialogVisible = false
          this.loadInventoryData()
          this.loadInventoryStats()
        } else {
          this.$message.error(response.message || '在庫移動に失敗しました')
        }
      } catch (error) {
        console.error('在庫移動エラー:', error)
        this.$message.error('在庫移動に失敗しました')
      }
    },

    exportInventory() {
      this.$message.info('エクスポート機能は開発中です')
    },

    getRowClassName({ row }) {
      if (row.stock_status === 'shortage') {
        return 'shortage-row'
      } else if (row.stock_status === 'excess') {
        return 'excess-row'
      } else if (row.stock_status === 'expired') {
        return 'expired-row'
      }
      return ''
    },

    getStockClass(row) {
      if (row.current_stock <= row.safety_stock) {
        return 'stock-low'
      } else if (row.current_stock <= row.reorder_point) {
        return 'stock-warning'
      }
      return 'stock-normal'
    },

    getStatusType(status) {
      switch (status) {
        case 'normal': return 'success'
        case 'shortage': return 'danger'
        case 'excess': return 'warning'
        case 'expired': return 'info'
        default: return 'info'
      }
    },

    getStatusText(status) {
      switch (status) {
        case 'normal': return '正常'
        case 'shortage': return '不足'
        case 'excess': return '過剰'
        case 'expired': return '期限切れ'
        default: return '不明'
      }
    },

    getMovementTypeText(type) {
      switch (type) {
        case 'in': return '入庫'
        case 'out': return '出庫'
        case 'adjustment': return '調整'
        case 'transfer': return '移動'
        default: return type
      }
    },

    formatNumber(value) {
      if (value == null) return '0'
      return Number(value).toLocaleString()
    },

    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('ja-JP')
    },

    formatDateTime(date) {
      if (!date) return ''
      return new Date(date).toLocaleString('ja-JP')
    }
  }
}
</script>

<style scoped>
.inventory-management {
  padding: 0;
}

.search-section {
  margin-bottom: 20px;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.value .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-card.shortage .stat-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-card.suppliers .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
}

.inventory-table {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.expand-content {
  padding: 20px;
  background-color: #f8f9fa;
}

.expand-content h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 14px;
}

.expand-content p {
  margin: 8px 0;
  font-size: 13px;
  color: #5a6c7d;
}

.recent-movements {
  max-height: 150px;
  overflow-y: auto;
}

.movement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e4e7ed;
  font-size: 12px;
}

.movement-date {
  color: #909399;
  width: 80px;
}

.movement-type {
  width: 60px;
  text-align: center;
}

.movement-type.in {
  color: #67c23a;
}

.movement-type.out {
  color: #f56c6c;
}

.movement-type.adjustment {
  color: #e6a23c;
}

.movement-type.transfer {
  color: #409eff;
}

.movement-quantity {
  width: 80px;
  text-align: right;
  font-weight: 600;
}

/* 库存状态行样式 */
.el-table .shortage-row {
  background-color: #fef0f0;
}

.el-table .excess-row {
  background-color: #fdf6ec;
}

.el-table .expired-row {
  background-color: #f4f4f5;
}

/* 库存数量颜色 */
.stock-low {
  color: #f56c6c;
  font-weight: 600;
}

.stock-warning {
  color: #e6a23c;
  font-weight: 600;
}

.stock-normal {
  color: #67c23a;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .stats-section .el-col {
    margin-bottom: 20px;
  }
}
</style>
