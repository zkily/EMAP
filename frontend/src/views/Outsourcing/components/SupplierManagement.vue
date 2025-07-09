<template>
  <div class="supplier-management">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-left">
        <el-input
          v-model="searchForm.keyword"
          placeholder="仕入先CD、名称で検索"
          prefix-icon="el-icon-search"
          style="width: 300px"
          @keyup.enter="handleSearch"
        ></el-input>

        <el-select v-model="searchForm.status" placeholder="状態" style="width: 120px" clearable>
          <el-option label="全て" value=""></el-option>
          <el-option label="有効" value="active"></el-option>
          <el-option label="無効" value="inactive"></el-option>
        </el-select>

        <el-select v-model="searchForm.rating" placeholder="評価" style="width: 120px" clearable>
          <el-option label="全て" value=""></el-option>
          <el-option label="S" value="S"></el-option>
          <el-option label="A" value="A"></el-option>
          <el-option label="B" value="B"></el-option>
          <el-option label="C" value="C"></el-option>
          <el-option label="D" value="D"></el-option>
        </el-select>

        <el-button type="primary" icon="el-icon-search" @click="handleSearch">検索</el-button>
        <el-button icon="el-icon-refresh" @click="handleReset">リセット</el-button>
      </div>

      <div class="search-right">
        <el-button type="primary" icon="el-icon-plus" @click="handleCreate">新規仕入先</el-button>
        <el-button type="success" icon="el-icon-download" @click="handleExport"
          >エクスポート</el-button
        >
      </div>
    </div>

    <!-- 供应商列表 -->
    <div class="table-container">
      <el-table
        :data="supplierList"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>

        <el-table-column prop="supplier_cd" label="仕入先CD" width="120" fixed="left">
          <template #default="scope">
            <el-link type="primary" @click="handleView(scope.row)">
              {{ scope.row.supplier_cd }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column
          prop="supplier_name"
          label="仕入先名"
          width="200"
          show-overflow-tooltip
        ></el-table-column>

        <el-table-column prop="contact_person" label="担当者" width="100"></el-table-column>

        <el-table-column prop="phone" label="電話番号" width="120"></el-table-column>

        <el-table-column
          prop="email"
          label="メール"
          width="180"
          show-overflow-tooltip
        ></el-table-column>

        <el-table-column label="能力" width="150">
          <template #default="scope">
            <div class="capability-tags">
              <el-tag
                v-for="capability in scope.row.capabilities"
                :key="capability"
                size="small"
                style="margin-right: 4px; margin-bottom: 2px"
              >
                {{ capability }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="パフォーマンス" width="200">
          <template #default="scope">
            <div class="performance-info">
              <div class="performance-item">
                <span class="label">OTD:</span>
                <span class="value">{{ scope.row.otd_rate }}%</span>
              </div>
              <div class="performance-item">
                <span class="label">PPM:</span>
                <span class="value">{{ scope.row.quality_ppm }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="overall_rating" label="総合評価" width="100">
          <template #default="scope">
            <el-tag :type="getRatingType(scope.row.overall_rating)" size="small">
              {{ scope.row.overall_rating }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状態" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ scope.row.status === 'active' ? '有効' : '無効' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">詳細</el-button>
            <el-button size="small" type="primary" @click="handleEdit(scope.row)">編集</el-button>
            <el-dropdown @command="handleCommand" trigger="click">
              <el-button size="small" type="link">
                その他<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item :command="{ action: 'capability', row: scope.row }"
                  >能力管理</el-dropdown-item
                >
                <el-dropdown-item :command="{ action: 'performance', row: scope.row }"
                  >パフォーマンス</el-dropdown-item
                >
                <el-dropdown-item :command="{ action: 'contract', row: scope.row }"
                  >価格契約</el-dropdown-item
                >
                <el-dropdown-item :command="{ action: 'toggle', row: scope.row }">
                  {{ scope.row.status === 'active' ? '無効化' : '有効化' }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.size"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        ></el-pagination>
      </div>
    </div>

    <!-- 供应商详情/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="70%"
      :close-on-click-modal="false"
    >
      <supplier-form
        v-if="dialogVisible"
        :supplier-data="currentSupplier"
        :mode="dialogMode"
        @save="handleSave"
        @cancel="handleCancel"
      ></supplier-form>
    </el-dialog>

    <!-- 能力矩阵管理对话框 -->
    <el-dialog title="能力マトリックス管理" :visible.sync="capabilityDialogVisible" width="60%">
      <capability-matrix
        v-if="capabilityDialogVisible"
        :supplier-data="currentSupplier"
        @save="handleCapabilitySave"
        @cancel="capabilityDialogVisible = false"
      ></capability-matrix>
    </el-dialog>

    <!-- 绩效管理对话框 -->
    <el-dialog title="パフォーマンス管理" :visible.sync="performanceDialogVisible" width="80%">
      <performance-management
        v-if="performanceDialogVisible"
        :supplier-data="currentSupplier"
        @cancel="performanceDialogVisible = false"
      ></performance-management>
    </el-dialog>

    <!-- 价格合同管理对话框 -->
    <el-dialog title="価格契約管理" :visible.sync="contractDialogVisible" width="80%">
      <p>価格契約管理機能は現在開発中です。</p>
    </el-dialog>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'
import SupplierForm from './SupplierForm.vue'
import CapabilityMatrix from './CapabilityMatrix.vue'
import PerformanceManagement from './PerformanceManagement.vue'
// import ContractManagement from './ContractManagement.vue'

export default {
  name: 'SupplierManagement',
  components: {
    SupplierForm,
    CapabilityMatrix,
    PerformanceManagement,
    // ContractManagement
  },
  data() {
    return {
      loading: false,
      supplierList: [],
      selectedSuppliers: [],
      searchForm: {
        keyword: '',
        status: '',
        rating: '',
      },
      pagination: {
        page: 1,
        size: 20,
        total: 0,
      },
      dialogVisible: false,
      dialogMode: 'view', // view, create, edit
      currentSupplier: null,
      capabilityDialogVisible: false,
      performanceDialogVisible: false,
      contractDialogVisible: false,
    }
  },
  computed: {
    dialogTitle() {
      const titleMap = {
        view: '仕入先詳細',
        create: '新規仕入先',
        edit: '仕入先編集',
      }
      return titleMap[this.dialogMode] || '仕入先'
    },
  },
  mounted() {
    this.loadSupplierList()
  },
  methods: {
    async loadSupplierList() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          size: this.pagination.size,
          keyword: this.searchForm.keyword,
          status: this.searchForm.status,
          rating: this.searchForm.rating,
        }

        const response = await outsourcingApi.getSuppliers(params)
        if (response.success) {
          // 处理供应商数据，添加能力和绩效信息
          this.supplierList = response.data.map((supplier) => ({
            ...supplier,
            capabilities: supplier.capabilities || ['電鍍', '熱処理'],
            otd_rate: supplier.otd_rate || 95.5,
            quality_ppm: supplier.quality_ppm || 120,
            overall_rating: supplier.overall_rating || 'A',
          }))
          this.pagination.total = response.total || response.data.length
        } else {
          this.$message.error(response.message || '仕入先リストの取得に失敗しました')
        }
      } catch (error) {
        console.error('仕入先リスト取得エラー:', error)
        this.$message.error('仕入先リストの取得に失敗しました')
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.pagination.page = 1
      this.loadSupplierList()
    },

    handleReset() {
      this.searchForm = {
        keyword: '',
        status: '',
        rating: '',
      }
      this.pagination.page = 1
      this.loadSupplierList()
    },

    handleCreate() {
      this.currentSupplier = null
      this.dialogMode = 'create'
      this.dialogVisible = true
    },

    handleView(row) {
      this.currentSupplier = { ...row }
      this.dialogMode = 'view'
      this.dialogVisible = true
    },

    handleEdit(row) {
      this.currentSupplier = { ...row }
      this.dialogMode = 'edit'
      this.dialogVisible = true
    },

    handleCommand(command) {
      const { action, row } = command
      this.currentSupplier = { ...row }

      switch (action) {
        case 'capability':
          this.capabilityDialogVisible = true
          break
        case 'performance':
          this.performanceDialogVisible = true
          break
        case 'contract':
          this.contractDialogVisible = true
          break
        case 'toggle':
          this.handleToggleStatus(row)
          break
      }
    },

    async handleToggleStatus(row) {
      try {
        const newStatus = row.status === 'active' ? 'inactive' : 'active'
        const action = newStatus === 'active' ? '有効化' : '無効化'

        await this.$confirm(`この仕入先を${action}しますか？`, '確認', {
          confirmButtonText: 'はい',
          cancelButtonText: 'いいえ',
          type: 'warning',
        })

        const response = await outsourcingApi.updateSupplier(row.id, {
          status: newStatus,
        })

        if (response.success) {
          this.$message.success(`仕入先を${action}しました`)
          this.loadSupplierList()
        } else {
          this.$message.error(response.message || `${action}に失敗しました`)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('状態変更エラー:', error)
          this.$message.error('状態変更に失敗しました')
        }
      }
    },

    async handleSave(supplierData) {
      try {
        let response
        if (this.dialogMode === 'create') {
          response = await outsourcingApi.createSupplier(supplierData)
        } else {
          response = await outsourcingApi.updateSupplier(this.currentSupplier.id, supplierData)
        }

        if (response.success) {
          this.$message.success(
            this.dialogMode === 'create' ? '仕入先を作成しました' : '仕入先を更新しました',
          )
          this.dialogVisible = false
          this.loadSupplierList()
        } else {
          this.$message.error(response.message || '保存に失敗しました')
        }
      } catch (error) {
        console.error('仕入先保存エラー:', error)
        this.$message.error('保存に失敗しました')
      }
    },

    handleCancel() {
      this.dialogVisible = false
    },

    async handleCapabilitySave(capabilityData) {
      try {
        const response = await outsourcingApi.updateSupplierCapability(
          this.currentSupplier.id,
          capabilityData,
        )

        if (response.success) {
          this.$message.success('能力マトリックスを更新しました')
          this.capabilityDialogVisible = false
          this.loadSupplierList()
        } else {
          this.$message.error(response.message || '更新に失敗しました')
        }
      } catch (error) {
        console.error('能力マトリックス更新エラー:', error)
        this.$message.error('更新に失敗しました')
      }
    },

    handleExport() {
      this.$message.info('エクスポート機能は開発中です')
    },

    handleSelectionChange(selection) {
      this.selectedSuppliers = selection
    },

    handleSizeChange(size) {
      this.pagination.size = size
      this.pagination.page = 1
      this.loadSupplierList()
    },

    handleCurrentChange(page) {
      this.pagination.page = page
      this.loadSupplierList()
    },

    getRatingType(rating) {
      const ratingMap = {
        S: 'success',
        A: 'primary',
        B: 'warning',
        C: 'info',
        D: 'danger',
      }
      return ratingMap[rating] || 'info'
    },
  },
}
</script>

<style scoped>
.supplier-management {
  padding: 0;
}

.search-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.search-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-right {
  display: flex;
  gap: 12px;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.pagination-container {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}

.capability-tags {
  display: flex;
  flex-wrap: wrap;
}

.performance-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.performance-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.performance-item .label {
  color: #909399;
  font-weight: 500;
}

.performance-item .value {
  color: #303133;
  font-weight: 600;
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-left {
    justify-content: center;
  }

  .search-right {
    justify-content: center;
  }
}
</style>
