<template>
  <div class="order-management">
    <!-- 搜索和操作栏 -->
    <div class="search-bar">
      <div class="search-left">
        <el-input
          v-model="searchForm.keyword"
          placeholder="注文番号、製品CD、仕入先名で検索"
          prefix-icon="el-icon-search"
          style="width: 300px"
          @keyup.enter="handleSearch"
        ></el-input>

        <el-select v-model="searchForm.status" placeholder="状態" style="width: 120px" clearable>
          <el-option label="全て" value=""></el-option>
          <el-option label="作成済" value="created"></el-option>
          <el-option label="送信済" value="sent"></el-option>
          <el-option label="確認済" value="confirmed"></el-option>
          <el-option label="生産中" value="in_production"></el-option>
          <el-option label="完了" value="completed"></el-option>
          <el-option label="キャンセル" value="cancelled"></el-option>
        </el-select>

        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="～"
          start-placeholder="開始日"
          end-placeholder="終了日"
          style="width: 240px"
        ></el-date-picker>

        <el-button type="primary" icon="el-icon-search" @click="handleSearch">検索</el-button>
        <el-button icon="el-icon-refresh" @click="handleReset">リセット</el-button>
      </div>

      <div class="search-right">
        <el-button type="primary" icon="el-icon-plus" @click="handleCreate">新規注文</el-button>
        <el-button type="success" icon="el-icon-download" @click="handleExport"
          >エクスポート</el-button
        >
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="table-container">
      <el-table
        :data="orderList"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>

        <el-table-column prop="order_no" label="注文番号" width="140" fixed="left">
          <template #default="scope">
            <el-link type="primary" @click="handleView(scope.row)">
              {{ scope.row.order_no }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="supplier_name" label="仕入先" width="120"></el-table-column>

        <el-table-column prop="product_cd" label="製品CD" width="100"></el-table-column>

        <el-table-column
          prop="product_name"
          label="製品名"
          width="150"
          show-overflow-tooltip
        ></el-table-column>

        <el-table-column prop="process_name" label="工序" width="100"></el-table-column>

        <el-table-column prop="quantity" label="数量" width="80" align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.quantity) }}
          </template>
        </el-table-column>

        <el-table-column prop="unit_price" label="単価" width="100" align="right">
          <template #default="scope"> ¥{{ formatNumber(scope.row.unit_price) }} </template>
        </el-table-column>

        <el-table-column prop="total_amount" label="総額" width="120" align="right">
          <template #default="scope"> ¥{{ formatNumber(scope.row.total_amount) }} </template>
        </el-table-column>

        <el-table-column prop="order_date" label="注文日" width="100">
          <template #default="scope">
            {{ formatDate(scope.row.order_date) }}
          </template>
        </el-table-column>

        <el-table-column prop="delivery_date" label="納期" width="100">
          <template #default="scope">
            {{ formatDate(scope.row.delivery_date) }}
          </template>
        </el-table-column>

        <el-table-column prop="order_status" label="状態" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.order_status)" size="small">
              {{ getStatusText(scope.row.order_status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="handleView(scope.row)"
              >詳細</el-button
            >
            <el-button size="small" type="primary" link @click="handleEdit(scope.row)"
              >編集</el-button
            >
            <el-button size="small" type="primary" link @click="handlePrint(scope.row)"
              >印刷</el-button
            >
            <el-dropdown @command="handleCommand" trigger="click">
              <el-button size="small" type="primary" link>
                その他<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item :command="{ action: 'approve', row: scope.row }"
                  >承認</el-dropdown-item
                >
                <el-dropdown-item :command="{ action: 'copy', row: scope.row }"
                  >複製</el-dropdown-item
                >
                <el-dropdown-item
                  :command="{ action: 'cancel', row: scope.row }"
                  :disabled="!canCancel(scope.row)"
                  >キャンセル</el-dropdown-item
                >
                <el-dropdown-item
                  :command="{ action: 'delete', row: scope.row }"
                  :disabled="!canDelete(scope.row)"
                  >削除</el-dropdown-item
                >
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

    <!-- 订单详情对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="80%"
      :close-on-click-modal="false"
    >
      <order-form
        v-if="dialogVisible"
        :order-data="currentOrder"
        :mode="dialogMode"
        @save="handleSave"
        @cancel="handleCancel"
      ></order-form>
    </el-dialog>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'
import OrderForm from './OrderForm.vue'

export default {
  name: 'OrderManagement',
  components: {
    OrderForm,
  },
  data() {
    return {
      loading: false,
      orderList: [],
      selectedOrders: [],
      searchForm: {
        keyword: '',
        status: '',
        dateRange: [],
      },
      pagination: {
        page: 1,
        size: 20,
        total: 0,
      },
      dialogVisible: false,
      dialogMode: 'view', // view, create, edit
      currentOrder: null,
    }
  },
  computed: {
    dialogTitle() {
      const titleMap = {
        view: '注文詳細',
        create: '新規注文',
        edit: '注文編集',
      }
      return titleMap[this.dialogMode] || '注文'
    },
  },
  mounted() {
    this.loadOrderList()
  },
  methods: {
    async loadOrderList() {
      this.loading = true
      try {
        const params = {
          ...this.searchForm,
          page: this.pagination.page,
          size: this.pagination.size,
        }

        const response = await outsourcingApi.getOrders(params)
        if (response.success) {
          this.orderList = response.data.items
          this.pagination.total = response.data.total
        } else {
          this.$message.error(response.message || '注文リストの取得に失敗しました')
        }
      } catch (error) {
        console.error('注文リスト取得エラー:', error)
        this.$message.error('注文リストの取得に失敗しました')
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.pagination.page = 1
      this.loadOrderList()
    },

    handleReset() {
      this.searchForm = {
        keyword: '',
        status: '',
        dateRange: [],
      }
      this.pagination.page = 1
      this.loadOrderList()
    },

    handleCreate() {
      this.currentOrder = null
      this.dialogMode = 'create'
      this.dialogVisible = true
    },

    handleView(row) {
      this.currentOrder = { ...row }
      this.dialogMode = 'view'
      this.dialogVisible = true
    },

    handleEdit(row) {
      this.currentOrder = { ...row }
      this.dialogMode = 'edit'
      this.dialogVisible = true
    },

    handleCommand(command) {
      const { action, row } = command
      switch (action) {
        case 'copy':
          this.handleCopy(row)
          break
        case 'cancel':
          this.handleCancelOrder(row)
          break
        case 'delete':
          this.handleDelete(row)
          break
      }
    },

    handleCopy(row) {
      this.currentOrder = {
        ...row,
        id: null,
        order_no: '',
        order_status: 'created',
        order_date: new Date().toISOString().split('T')[0],
      }
      this.dialogMode = 'create'
      this.dialogVisible = true
    },

    async handleCancelOrder(row) {
      try {
        await this.$confirm('この注文をキャンセルしますか？', '確認', {
          confirmButtonText: 'はい',
          cancelButtonText: 'いいえ',
          type: 'warning',
        })

        const response = await outsourcingApi.updateOrder(row.id, {
          order_status: 'cancelled',
        })

        if (response.success) {
          this.$message.success('注文をキャンセルしました')
          this.loadOrderList()
        } else {
          this.$message.error(response.message || 'キャンセルに失敗しました')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('注文キャンセルエラー:', error)
          this.$message.error('キャンセルに失敗しました')
        }
      }
    },

    async handleDelete(row) {
      try {
        await this.$confirm('この注文を削除しますか？', '確認', {
          confirmButtonText: 'はい',
          cancelButtonText: 'いいえ',
          type: 'warning',
        })

        const response = await outsourcingApi.deleteOrder(row.id)
        if (response.success) {
          this.$message.success('注文を削除しました')
          this.loadOrderList()
        } else {
          this.$message.error(response.message || '削除に失敗しました')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('注文削除エラー:', error)
          this.$message.error('削除に失敗しました')
        }
      }
    },

    async handleSave(orderData) {
      try {
        let response
        if (this.dialogMode === 'create') {
          response = await outsourcingApi.createOrder(orderData)
        } else {
          response = await outsourcingApi.updateOrder(this.currentOrder.id, orderData)
        }

        if (response.success) {
          this.$message.success(
            this.dialogMode === 'create' ? '注文を作成しました' : '注文を更新しました',
          )
          this.dialogVisible = false
          this.loadOrderList()
        } else {
          this.$message.error(response.message || '保存に失敗しました')
        }
      } catch (error) {
        console.error('注文保存エラー:', error)
        this.$message.error('保存に失敗しました')
      }
    },

    handleCancel() {
      this.dialogVisible = false
    },

    handleExport() {
      // 导出功能实现
      this.$message.info('エクスポート機能は開発中です')
    },

    handleSelectionChange(selection) {
      this.selectedOrders = selection
    },

    handleSizeChange(size) {
      this.pagination.size = size
      this.pagination.page = 1
      this.loadOrderList()
    },

    handleCurrentChange(page) {
      this.pagination.page = page
      this.loadOrderList()
    },

    canEdit(row) {
      return ['created', 'sent'].includes(row.order_status)
    },

    canCancel(row) {
      return ['created', 'sent', 'confirmed'].includes(row.order_status)
    },

    canDelete(row) {
      return row.order_status === 'created'
    },

    getStatusType(status) {
      const statusMap = {
        created: 'info',
        sent: 'info',
        confirmed: 'warning',
        in_production: 'primary',
        completed: 'success',
        cancelled: 'danger',
      }
      return statusMap[status] || 'info'
    },

    getStatusText(status) {
      const statusMap = {
        created: '作成済',
        sent: '送信済',
        confirmed: '確認済',
        in_production: '生産中',
        completed: '完了',
        cancelled: 'キャンセル',
      }
      return statusMap[status] || status
    },

    formatNumber(num) {
      return num ? num.toLocaleString() : '0'
    },

    formatDate(date) {
      if (!date) return ''
      if (typeof date === 'string') {
        return date.split('T')[0]
      }
      return date.toISOString().split('T')[0]
    },
  },
}
</script>

<style scoped>
.order-management {
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
