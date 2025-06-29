<!-- 月订单管理 -->

<template>
  <div class="order-monthly-list-container" :class="{ 'animate-in': !pageLoading }">
    <!-- 页面加载遮罩 -->
    <div v-if="pageLoading" class="page-loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <p class="loading-text">月別受注データを読み込み中...</p>
      </div>
    </div>

    <!-- 页面头部 -->
    <div class="page-header" :class="{ 'animate-in': !pageLoading }">
      <div class="header-content">
        <div class="title-section">
          <h2 class="title">
            <div class="title-icon">
              <el-icon>
                <calendar />
              </el-icon>
            </div>
            <span class="title-text">月別受注管理</span>
            <div class="title-badge">
              <span class="badge-text">{{ pagination.total }}</span>
            </div>
          </h2>
          <p class="subtitle">月別受注データの管理・分析・生成を行います</p>
        </div>
        <div class="header-decoration">
          <div class="decoration-circle circle-1"></div>
          <div class="decoration-circle circle-2"></div>
          <div class="decoration-circle circle-3"></div>
        </div>
      </div>
    </div>

    <!-- 合计卡片 -->
    <div class="summary-cards" :class="{ 'animate-in-delay-1': !pageLoading }">
      <el-card class="summary-card modern-card info-card">
        <div class="card-content">
          <div class="card-icon info-icon">
            <el-icon><document /></el-icon>
          </div>
          <div class="card-info">
            <div class="summary-title">内示本数</div>
            <div class="summary-value">{{ summary.forecast_units?.toLocaleString() }}</div>
          </div>
        </div>
        <div class="card-decoration"></div>
      </el-card>

      <el-card class="summary-card modern-card success-card">
        <div class="card-content">
          <div class="card-icon success-icon">
            <el-icon><check /></el-icon>
          </div>
          <div class="card-info">
            <div class="summary-title">確定本数</div>
            <div class="summary-value">{{ summary.forecast_total_units?.toLocaleString() }}</div>
          </div>
        </div>
        <div class="card-decoration"></div>
      </el-card>

      <el-card class="summary-card modern-card diff-card">
        <div class="card-content">
          <div class="card-icon diff-icon">
            <el-icon><trend-charts /></el-icon>
          </div>
          <div class="card-info">
            <div class="summary-title">内示差異</div>
            <div
              class="summary-value"
              :style="{
                color:
                  summary.forecast_diff < 0
                    ? '#e74c3c'
                    : summary.forecast_diff > 0
                      ? '#2ecc71'
                      : '#606266',
              }"
            >
              {{ summary.forecast_diff?.toLocaleString() }}
            </div>
          </div>
        </div>
        <div class="card-decoration"></div>
      </el-card>
    </div>

    <!-- 操作按钮区域 -->
    <el-card class="action-card modern-card" :class="{ 'animate-in-delay-2': !pageLoading }">
      <div class="action-header">
        <div class="action-title">
          <el-icon class="action-icon">
            <tools />
          </el-icon>
          <span>操作メニュー</span>
        </div>
      </div>
      <div class="button-group">
        <el-button size="large" class="action-button btn-add" @click="handleAddOrder">
          <el-icon><plus /></el-icon>
          新規受注追加
        </el-button>
        <el-button size="large" class="action-button btn-batch" @click="openBatchDialog">
          <el-icon><upload /></el-icon>
          月受注一括登録
        </el-button>
        <el-button
          size="large"
          class="action-button btn-generate"
          @click="handleGenerateDailyOrders"
          :loading="generating"
        >
          <el-icon><calendar /></el-icon>
          日受注生成
        </el-button>
        <el-button
          size="large"
          class="action-button btn-update-fields"
          @click="openUpdateFieldsDialog"
        >
          <el-icon><edit /></el-icon>
          製品情報一括更新
        </el-button>
        <el-button
          size="large"
          class="action-button btn-daily-manage"
          @click="openDailyOrderDialog"
        >
          <el-icon><list /></el-icon>
          日受注管理
        </el-button>
      </div>
    </el-card>

    <!-- 筛选表单 -->
    <el-card
      class="filter-card modern-card enhanced-filter"
      :class="{ 'animate-in-delay-1': !pageLoading }"
    >
      <template #header>
        <div class="filter-header">
          <div class="filter-title">
            <el-icon class="filter-icon">
              <search />
            </el-icon>
            <span>検索条件</span>
          </div>
          <div class="filter-stats">
            <span class="stats-text">
              <el-icon><DataAnalysis /></el-icon>
              {{ pagination.total }}件
            </span>
          </div>
        </div>
      </template>

      <div class="filter-content">
        <el-form
          :inline="true"
          :model="filters"
          class="filter-bar enhanced single-row"
          @submit.native.prevent="fetchList"
        >
          <!-- 单行布局：所有筛选控件 -->
          <div class="filter-row-unified">
            <!-- 时间选择区域 -->
            <div class="filter-group time-group">
              <div class="group-label">
                <el-icon><Calendar /></el-icon>
                <span>期間</span>
              </div>
              <div class="group-controls">
                <el-form-item label="年" class="inline-form-item">
                  <el-select
                    v-model="filters.year"
                    placeholder="年"
                    class="compact-select year-select"
                    @change="fetchList"
                  >
                    <el-option
                      v-for="year in yearOptions"
                      :key="year"
                      :label="`${year}年`"
                      :value="year"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="月" class="inline-form-item">
                  <el-select
                    v-model="filters.month"
                    placeholder="月"
                    class="compact-select month-select"
                    @change="fetchList"
                  >
                    <el-option v-for="m in 12" :key="m" :label="`${m}月`" :value="m" />
                  </el-select>
                </el-form-item>

                <div class="nav-buttons-inline">
                  <el-button class="nav-btn prev-btn" @click="handlePrevMonth" size="small">
                    <el-icon><arrow-left /></el-icon>
                  </el-button>
                  <el-button class="nav-btn current-btn" @click="goToCurrentMonth" size="small">
                    今月
                  </el-button>
                  <el-button class="nav-btn next-btn" @click="handleNextMonth" size="small">
                    <el-icon><arrow-right /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 筛选条件区域 -->
            <div class="filter-group search-group">
              <div class="group-label">
                <el-icon><Filter /></el-icon>
                <span>条件</span>
              </div>
              <div class="group-controls">
                <el-form-item label="納入先" class="inline-form-item">
                  <el-button
                    @click="openMainDestinationDialog"
                    class="destination-btn compact-btn"
                    :class="{ 'has-selection': filters.destination_cd }"
                  >
                    <div class="destination-btn-content">
                      <el-icon><OfficeBuilding /></el-icon>
                      <span class="destination-text" :title="getDestinationName">{{
                        getDestinationName
                      }}</span>
                    </div>
                    <el-icon class="expand-icon"><ArrowDown /></el-icon>
                  </el-button>
                </el-form-item>

                <el-form-item label="製品検索" class="inline-form-item search-item">
                  <el-input
                    v-model="filters.keyword"
                    placeholder="製品CD・製品名で検索..."
                    clearable
                    class="search-input compact-input"
                    @input="fetchList"
                    @keyup.enter="fetchList"
                  >
                    <template #prefix>
                      <el-icon class="search-icon">
                        <search />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </div>
            </div>

            <!-- 操作按钮区域 -->
            <div class="filter-group action-group">
              <div class="action-buttons compact">
                <el-button
                  type="primary"
                  @click="fetchList"
                  :loading="loading"
                  class="search-btn modern-btn"
                  size="default"
                >
                  <el-icon><Search /></el-icon>
                  検索
                </el-button>
                <el-button @click="resetFilters" class="reset-btn modern-btn" size="default">
                  <el-icon><Refresh /></el-icon>
                  リセット
                </el-button>
              </div>
            </div>
          </div>
        </el-form>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card
      class="table-card modern-card no-header"
      :class="{ 'animate-in-delay-4': !pageLoading }"
    >
      <div class="table-header-inline">
        <div class="table-title">
          <el-icon class="table-icon">
            <grid />
          </el-icon>
          <span>受注データ一覧</span>
          <div class="count-badge">
            <el-icon class="count-icon">
              <document />
            </el-icon>
            <span>{{ pagination.total }}件</span>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table
          v-if="orderList.length > 0"
          :data="orderList"
          border
          stripe
          v-loading="loading"
          class="modern-table"
          show-summary
          :summary-method="getSummaries"
          element-loading-text="データを読み込み中..."
          element-loading-background="rgba(255, 255, 255, 0.8)"
        >
          <el-table-column label="年" prop="year" width="90" align="center" />
          <el-table-column label="月" prop="month" width="75" align="center" />
          <el-table-column label="納入先名" prop="destination_name" min-width="180">
            <template #default="{ row }">
              <div class="destination-cell">
                <el-icon class="location-icon">
                  <location />
                </el-icon>
                <span>{{ row.destination_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="製品CD" prop="product_cd" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="primary" effect="plain" size="small">
                {{ row.product_cd }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="製品名" prop="product_name" min-width="160" />
          <el-table-column label="製品タイプ" prop="product_type" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getProductTypeTagType(row.product_type)" effect="dark" size="small">
                {{ row.product_type || '未設定' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="内示本数" prop="forecast_units" align="right" width="110">
            <template #default="{ row }">
              <div class="number-cell">
                <span class="number-value">{{ formatNumber(row.forecast_units) }}</span>
                <span class="number-unit">本</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="確定本数" prop="forecast_total_units" align="right" width="120">
            <template #default="{ row }">
              <div class="number-cell">
                <span class="number-value">{{ formatNumber(row.forecast_total_units) }}</span>
                <span class="number-unit">本</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="内示差異" prop="forecast_diff" width="120" align="right">
            <template #default="{ row }">
              <div class="diff-cell-new">
                <span
                  class="diff-value-simple"
                  :class="{
                    'diff-positive': row.forecast_diff > 0,
                    'diff-negative': row.forecast_diff < 0,
                    'diff-zero': row.forecast_diff === 0,
                  }"
                >
                  {{ row.forecast_diff > 0 ? '+' : '' }}{{ formatNumber(row.forecast_diff) }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="{ row }">
              <div class="table-action-buttons">
                <el-tooltip content="日別管理" placement="top">
                  <el-button
                    size="small"
                    type="primary"
                    class="compact-btn primary-btn"
                    @click="handleBatchEdit(row.order_id)"
                  >
                    <el-icon><calendar /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="編集" placement="top">
                  <el-button
                    size="small"
                    type="warning"
                    class="compact-btn warning-btn"
                    @click="handleEditOrder(row)"
                  >
                    <el-icon><edit /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="削除" placement="top">
                  <el-button
                    size="small"
                    type="danger"
                    class="compact-btn danger-btn"
                    @click="handleDeleteOrder(row.id)"
                  >
                    <el-icon><delete /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <template v-else>
          <div class="empty-state">
            <el-icon class="empty-icon">
              <document />
            </el-icon>
            <p class="empty-text">データがありません</p>
          </div>
        </template>
      </div>

      <!-- 分页器 -->
      <div class="pagination-container" v-if="orderList.length > 0">
        <div class="pagination-info">
          <span class="info-text">
            {{ (pagination.page - 1) * pagination.pageSize + 1 }}-{{
              Math.min(pagination.page * pagination.pageSize, pagination.total)
            }}
            / {{ pagination.total }}件
          </span>
        </div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          background
          layout="sizes, prev, pager, next, jumper"
          @current-change="fetchList"
          class="modern-pagination"
        />
      </div>
    </el-card>

    <!-- 新規受注追加ダイアログ -->
    <el-dialog
      v-model="addDialogVisible"
      width="600px"
      class="modern-dialog add-dialog"
      :before-close="() => (addDialogVisible = false)"
    >
      <template #header>
        <div class="dialog-header">
          <el-icon class="dialog-icon">
            <Plus />
          </el-icon>
          <span class="dialog-title">新規受注追加</span>
        </div>
      </template>
      <el-form
        :model="addForm"
        :rules="addRules"
        ref="addFormRef"
        label-width="140px"
        class="form-body"
      >
        <el-form-item label="納入先" prop="destination_cd">
          <el-select
            v-model="addForm.destination_cd"
            placeholder="納入先を選択"
            filterable
            clearable
            @change="handleDestinationChange"
          >
            <el-option
              v-for="item in destinationOptions"
              :key="item.cd"
              :label="`${item.cd} | ${item.name}`"
              :value="item.cd"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="年" prop="year">
          <el-input-number v-model="addForm.year" :min="2020" :max="2100" />
        </el-form-item>

        <el-form-item label="月" prop="month">
          <el-input-number v-model="addForm.month" :min="1" :max="12" />
        </el-form-item>

        <el-form-item label="製品CD" prop="product_cd">
          <el-select
            v-model="addForm.product_cd"
            placeholder="製品CDを選択"
            filterable
            clearable
            @change="handleProductCdChangeForAdd"
          >
            <el-option
              v-for="item in addProductOptions"
              :key="item.product_cd"
              :label="`${item.product_cd} | ${item.product_name}`"
              :value="item.product_cd"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="製品名" prop="product_name">
          <el-input v-model="addForm.product_name" disabled />
        </el-form-item>

        <el-form-item label="製品タイプ" prop="product_type">
          <el-select v-model="addForm.product_type" placeholder="選択してください" clearable>
            <el-option v-for="item in productTypeOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="製品別名">
          <el-input v-model="addForm.product_alias" />
        </el-form-item>

        <el-form-item label="内示本数">
          <el-input-number v-model="addForm.forecast_units" :min="0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addDialogVisible = false">
          <el-icon><Close /></el-icon>
          キャンセル
        </el-button>
        <el-button type="primary" @click="handleSaveAddOrder">
          <el-icon><Check /></el-icon>
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- ✏️ 編集用ダイアログ -->
    <el-dialog
      v-model="editDialogVisible"
      width="600px"
      class="modern-dialog edit-dialog"
      :before-close="() => (editDialogVisible = false)"
      center
    >
      <template #header>
        <div class="dialog-header">
          <el-icon class="dialog-icon">
            <Edit />
          </el-icon>
          <span class="dialog-title">月別受注編集</span>
        </div>
      </template>
      <el-form
        :model="editForm"
        :rules="addRules"
        ref="editFormRef"
        label-width="140px"
        class="form-body"
      >
        <el-form-item label="納入先" prop="destination_cd">
          <el-select
            v-model="editForm.destination_cd"
            placeholder="納入先を選択"
            filterable
            clearable
            disabled
          >
            <el-option
              v-for="item in destinationOptions"
              :key="item.cd"
              :label="`${item.cd} | ${item.name}`"
              :value="item.cd"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="年" prop="year">
          <el-input-number v-model="editForm.year" :min="2020" :max="2100" disabled />
        </el-form-item>

        <el-form-item label="月" prop="month">
          <el-input-number v-model="editForm.month" :min="1" :max="12" disabled />
        </el-form-item>

        <el-form-item label="製品CD" prop="product_cd">
          <el-input v-model="editForm.product_cd" />
        </el-form-item>

        <el-form-item label="製品名" prop="product_name">
          <el-input v-model="editForm.product_name" />
        </el-form-item>

        <el-form-item label="製品タイプ" prop="product_type">
          <el-select v-model="editForm.product_type" placeholder="選択してください" clearable>
            <el-option v-for="item in productTypeOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="製品別名">
          <el-input v-model="editForm.product_alias" />
        </el-form-item>

        <el-form-item label="内示本数">
          <el-input-number v-model="editForm.forecast_units" :min="0" ref="forecastUnitsInputRef" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">
          <el-icon><Close /></el-icon>
          キャンセル
        </el-button>
        <el-button type="primary" @click="handleSaveEditOrder">
          <el-icon><Check /></el-icon>
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 🔥 月注文一括登録ダイアログ -->
    <el-dialog
      v-model="batchDialogVisible"
      width="750px"
      destroy-on-close
      center
      class="modern-dialog batch-dialog"
      :before-close="() => (batchDialogVisible = false)"
    >
      <template #header>
        <div class="dialog-header">
          <el-icon class="dialog-icon">
            <Upload />
          </el-icon>
          <span class="dialog-title">月注文一括登録</span>
        </div>
      </template>
      <div class="batch-form-container">
        <div class="batch-form">
          <el-form :model="batchForm" label-width="100px">
            <el-form-item label="年">
              <el-select v-model="batchForm.year" placeholder="年を選択" class="year-select">
                <el-option v-for="y in batchYearOptions" :key="y" :label="`${y}年`" :value="y" />
              </el-select>
            </el-form-item>

            <el-form-item label="月">
              <el-select v-model="batchForm.month" placeholder="月を選択" class="month-select">
                <el-option v-for="m in 12" :key="m" :label="`${m}月`" :value="m" />
              </el-select>
            </el-form-item>

            <el-form-item label="納入先">
              <el-select
                v-model="batchForm.destination_cd"
                filterable
                placeholder="納入先を選択"
                class="destination-select"
              >
                <el-option
                  v-for="item in batchDestinationOptions"
                  :key="item.cd"
                  :label="`${item.cd} | ${item.name}`"
                  :value="item.cd"
                />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" class="load-btn" @click="fetchProducts">
                <el-icon><Download /></el-icon>
                製品一覧読込
              </el-button>
            </el-form-item>
          </el-form>
          <el-table
            v-if="batchProducts.length > 0"
            :data="batchProducts"
            class="batch-product-table"
            :loading="batchLoading"
            border
            stripe
            highlight-current-row
          >
            <el-table-column label="製品タイプ" width="120" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tag :type="getProductTypeTagType(row.product_type)" effect="light" size="small">
                  {{ row.product_type || '未設定' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="product_cd" label="製品CD" width="120" />
            <el-table-column
              prop="product_name"
              label="製品名"
              min-width="150"
              show-overflow-tooltip
            />

            <el-table-column label="数量" width="120" align="center">
              <template #default="{ row, $index }">
                <el-input
                  v-model="row.quantity"
                  type="text"
                  class="quantity-input"
                  :class="row.quantity > 0 ? 'normal-cell' : 'warning-cell'"
                  placeholder="数量入力"
                  @keydown.enter.prevent="handleQuantityEnter($index)"
                  @focus="handleFocus"
                  @input="handleQuantityChange(row, $index)"
                  :id="`quantity-input-${$index}`"
                />
              </template>
            </el-table-column>
            <el-table-column label="状態" width="100" align="center">
              <template #default="{ row, $index }">
                <el-tag
                  v-if="row.exists === true"
                  effect="dark"
                  type="danger"
                  size="small"
                  class="status-tag registered"
                  :key="`registered-${$index}-${row.product_cd}`"
                >
                  登録済
                </el-tag>
                <el-tag
                  v-else
                  effect="dark"
                  type="success"
                  size="small"
                  class="status-tag unregistered"
                  :key="`unregistered-${$index}-${row.product_cd}`"
                >
                  未登録
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-else-if="batchLoading" class="loading-placeholder">
            <el-icon class="is-loading">
              <loading />
            </el-icon>
            <p>データ読込中...</p>
          </div>
          <div v-else-if="!batchForm.destination_cd" class="empty-placeholder">
            <p>納入先を選択し、製品一覧を読み込んでください</p>
          </div>
          <div v-else class="empty-placeholder">
            <p>製品データがありません</p>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="batchDialogVisible = false" class="cancel-btn">
          <el-icon><Close /></el-icon>
          キャンセル
        </el-button>
        <el-button type="primary" @click="handleBatchRegister" class="register-btn">
          <el-icon><Check /></el-icon>
          登録する
        </el-button>
      </template>
    </el-dialog>

    <!-- 受注情報一括更新ダイアログ -->
    <el-dialog
      v-model="updateFieldsDialogVisible"
      width="700px"
      destroy-on-close
      center
      class="modern-dialog update-dialog"
      :before-close="() => (updateFieldsDialogVisible = false)"
    >
      <template #header>
        <div class="dialog-header">
          <el-icon class="dialog-icon">
            <Refresh />
          </el-icon>
          <span class="dialog-title">製品情報一括更新</span>
        </div>
      </template>
      <el-form :model="updateFieldsForm" label-width="140px">
        <el-form-item label="開始日">
          <el-date-picker
            v-model="updateFieldsForm.startDate"
            type="date"
            placeholder="開始日を選択"
          />
        </el-form-item>

        <el-form-item label="製品情報を更新">
          <el-checkbox v-model="updateFieldsForm.updateProductInfo"
            >製品情報を最新データに更新</el-checkbox
          >
        </el-form-item>

        <div v-if="updateFieldsForm.updateProductInfo">
          <el-alert
            title="この操作により、月受注の製品情報（製品名・製品別名・製品タイプ）が最新のマスターデータで更新されます。"
            type="info"
            :closable="false"
            style="margin-bottom: 15px"
          />
        </div>

        <el-form-item>
          <el-button type="primary" @click="handleUpdateFields" :loading="updateFieldsLoading">
            <el-icon><Refresh /></el-icon>
            更新実行
          </el-button>
          <el-button @click="updateFieldsDialogVisible = false">
            <el-icon><Close /></el-icon>
            キャンセル
          </el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 日订单同意编辑 -->
    <OrderDailyBatchEditDialog
      v-model:visible="batchEditDialogVisible"
      :monthlyOrderId="batchEditMonthlyOrderId"
      @saved="fetchList"
    />

    <!-- 日受注管理弹窗 -->
    <el-dialog
      v-model="dailyOrderDialogVisible"
      width="60%"
      top="1vh"
      destroy-on-close
      class="modern-dialog daily-manage-dialog enhanced-dialog"
      :before-close="() => (dailyOrderDialogVisible = false)"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <template #header>
        <div class="dialog-header enhanced-header">
          <div class="header-left">
            <el-icon class="dialog-icon">
              <Calendar />
            </el-icon>
            <span class="dialog-title">日受注管理</span>
          </div>
          <div class="header-right">
            <div class="header-badge">
              <span class="badge-text">{{ dailyOrdersList.length }} 件</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="dailyOrderForm" class="daily-filter-form enhanced-form">
        <el-form-item label="日付" class="compact-form-item">
          <el-date-picker
            v-model="dailyOrderForm.date"
            type="date"
            placeholder="日付を選択"
            value-format="YYYY-MM-DD"
            format="YYYY/MM/DD"
            size="small"
            class="compact-input"
            style="width: 130px"
            @change="fetchDailyOrdersList"
          />
          <el-button-group style="margin-left: 5px">
            <el-button size="small" @click="changeDay(-1)">前日</el-button>
            <el-button size="small" @click="setToday">今日</el-button>
            <el-button size="small" @click="changeDay(1)">後日</el-button>
          </el-button-group>
        </el-form-item>

        <el-form-item label="納入先" class="compact-form-item">
          <el-button size="small" @click="openDestinationDialog" class="compact-select-button">
            {{ selectedDailyDestinationName }}
          </el-button>
        </el-form-item>

        <el-form-item class="compact-form-item">
          <el-button
            type="primary"
            size="small"
            @click="fetchDailyOrdersList"
            :loading="dailyOrdersLoading"
            class="compact-button"
          >
            <el-icon class="small-icon"><Search /></el-icon>
            検索
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 日订单数据表格 -->
      <el-table
        v-loading="dailyOrdersLoading"
        :data="dailyOrdersList"
        border
        stripe
        show-summary
        :summary-method="getDailySummaries"
        sum-text="合計"
        class="daily-orders-table modern-daily-table"
        height="72vh"
        size="default"
        :cell-style="{
          padding: '5px 5px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#2c3e50',
        }"
        :header-cell-style="{
          padding: '10px 5px',
          fontSize: '15px',
          fontWeight: '700',
          backgroundColor: '#f8fafc',
          color: '#1f2937',
          textAlign: 'center',
        }"
      >
        <el-table-column
          label="納入先名"
          prop="destination_name"
          min-width="160"
          show-overflow-tooltip
          align="center"
        >
          <template #default="{ row }">
            <div class="table-cell-content centered">
              <span class="cell-text">{{ row.destination_name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          label="製品名"
          prop="product_name"
          min-width="180"
          show-overflow-tooltip
          align="left"
        >
          <template #default="{ row }">
            <div class="table-cell-content left-aligned">
              <span class="cell-text">{{ row.product_name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="入数" prop="unit_per_box" width="80" align="center">
          <template #default="{ row }">
            <div class="number-cell">
              <span class="number-value">{{ row.unit_per_box }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="日付" width="120" align="center">
          <template #default="{ row }">
            <div class="date-cell">
              <span class="date-value">{{ formatDateDisplay(row.year, row.month, row.day) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="曜日" prop="weekday" width="70" align="center">
          <template #default="{ row }">
            <div class="weekday-cell">
              <span class="weekday-value" :class="getWeekdayClass(row.weekday)">{{
                row.weekday
              }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 確定箱数（编辑） -->
        <el-table-column label="確定箱数" prop="confirmed_boxes" min-width="100" align="center">
          <template #default="{ row, $index }">
            <div class="input-cell">
              <el-input
                size="default"
                class="modern-table-input editable-input"
                :model-value="row.confirmed_boxes === 0 ? '' : row.confirmed_boxes"
                @update:model-value="
                  (val) => {
                    row.confirmed_boxes = val === '' ? 0 : Number(val)
                    handleDailyConfirmedBoxesChange(row)
                  }
                "
                @keydown.enter="focusDailyNextInput($index)"
                :ref="
                  (el) => {
                    if (el && '$el' in el) {
                      dailyConfirmedBoxesInputs[$index] =
                        (el.$el.querySelector('input') as HTMLInputElement) || undefined
                    }
                  }
                "
              />
            </div>
          </template>
        </el-table-column>

        <!-- 確定本数（自动计算） -->
        <el-table-column label="確定本数" prop="confirmed_units" min-width="100" align="center">
          <template #default="{ row }">
            <div class="input-cell">
              <el-input
                size="default"
                class="modern-table-input readonly-input"
                :model-value="row.confirmed_units === 0 ? '' : row.confirmed_units"
                disabled
              />
            </div>
          </template>
        </el-table-column>

        <!-- 内示本数（只读） -->
        <!-- <el-table-column label="内示本数" prop="forecast_units" min-width="100" align="center">
          <template #default="{ row }">
            <div class="input-cell">
              <el-input
                size="default"
                class="modern-table-input readonly-input"
                :model-value="row.forecast_units === 0 ? '' : row.forecast_units"
                disabled
              />
            </div>
          </template>
        </el-table-column> -->

        <!-- 納入日 -->
        <el-table-column label="納入日" prop="delivery_date" width="110" align="center">
          <template #default="{ row }">
            <div class="date-cell">
              <span class="date-value">{{ formatDate(row.delivery_date) }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 状態 -->
        <!-- <el-table-column label="状態" prop="status" width="150" align="center">
          <template #default="{ row }">
            <div class="select-cell">
              <el-select
                v-model="row.status"
                placeholder="選択"
                size="default"
                class="modern-status-select"
                @change="markDailyRowChanged(row)"
              >
                <el-option label="未出荷" value="未出荷" />
                <el-option label="出荷済み" value="出荷済み" />
                <el-option label="キャンセル" value="キャンセル" />
              </el-select>
            </div>
          </template>
        </el-table-column> -->
      </el-table>

      <!-- Footer -->
      <template #footer>
        <div class="footer-buttons enhanced-footer">
          <el-button
            size="default"
            :disabled="dailyOrdersSaving"
            @click="dailyOrderDialogVisible = false"
            class="enhanced-cancel-button"
          >
            <el-icon><Close /></el-icon>
            キャンセル
          </el-button>
          <el-button
            type="primary"
            size="default"
            :loading="dailyOrdersSaving"
            @click="handleDailyOrdersSave"
            class="enhanced-save-button"
          >
            <el-icon><Check /></el-icon>
            一括保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 納入先選択ダイアログ -->
    <DestinationSelectDialog
      v-model="destinationDialogVisible"
      :destinations="destinationOptions.map((d) => ({ value: d.cd, label: `${d.cd} | ${d.name}` }))"
      :current-destination="filters.destination_cd"
      @select="handleDestinationSelect"
    />

    <!-- 日受注管理弹窗的納入先选择 -->
    <DestinationSelectDialog
      v-model="dailyDestinationDialogVisible"
      :destinations="destinationOptions.map((d) => ({ value: d.cd, label: `${d.cd} | ${d.name}` }))"
      :current-destination="dailyOrderForm.destination_cd"
      @select="handleDailyDestinationSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Calendar,
  Document,
  Check,
  TrendCharts,
  Tools,
  Plus,
  Upload,
  Edit,
  List,
  Search,
  ArrowLeft,
  ArrowRight,
  Location,
  Grid,
  ArrowUp,
  ArrowDown,
  Delete,
  Close,
  Download,
  Refresh,
  OfficeBuilding,
  DataAnalysis,
  Filter,
} from '@element-plus/icons-vue'
import {
  generateDailyOrders,
  fetchMonthlyOrders,
  fetchMonthlySummary,
  createMonthlyOrder,
  updateMonthlyOrder,
  deleteMonthlyOrder,
  checkMonthlyOrderExists,
  getProductsByDestination,
  batchCreateMonthlyOrders,
  updateOrderFields,
  fetchDailyOrders,
  batchUpdateDailyOrders,
} from '@/api/order/order'
import type { OrderMonthly, OrderDaily, OrderDailyUpdate } from '@/types/order'
import { getDestinationOptions } from '@/api/options'
import type { Destination } from '@/types/master'
import OrderDailyBatchEditDialog from './components/OrderDailyBatchEditDialog.vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { VNode } from 'vue'
import axios from 'axios'
import DestinationSelectDialog from './components/DestinationSelectDialog.vue'

const route = useRoute()

// 千分位逗号
const formatNumber = (value: number | undefined): string => {
  if (typeof value !== 'number') return ''
  return value.toLocaleString('ja-JP')
}

// 筛选条件
const filters = ref({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  destination_cd: '',
  keyword: '',
})

// 年选项
const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 3 + i)

// 列表数据 & 分页
const orderList = ref<OrderMonthly[]>([])
const loading = ref(false)
const pageLoading = ref(true)
const pagination = ref({ page: 1, pageSize: 25, total: 0 })

// 新規受注ダイアログ
const addDialogVisible = ref(false)
const addForm = ref<OrderMonthly>({
  destination_cd: '',
  destination_name: '',
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  product_cd: '',
  product_name: '',
  product_type: '',
  product_alias: '',
  forecast_units: 0,
  forecast_total_units: 0,
})
const addFormRef = ref()
const addRules = {
  destination_cd: [{ required: true, message: '納入先CDは必須', trigger: 'change' }],
  product_cd: [{ required: true, message: '製品CDは必須', trigger: 'blur' }],
  product_name: [{ required: true, message: '製品名は必須', trigger: 'blur' }],
  year: [{ required: true, message: '年は必須', trigger: 'change' }],
  month: [{ required: true, message: '月は必須', trigger: 'change' }],
}

// 新增：用于"新規受注追加"弹窗的产品选项
const addProductOptions = ref<{ product_cd: string; product_name: string; product_type: string }[]>(
  [],
)

// 納入先オプション
const destinationOptions = ref<Destination[]>([])
const validDestinationOptions = computed(() =>
  destinationOptions.value.filter((item) => item.cd && item.name),
)

// 选择納入先时带出名称，并联动产品下拉
const handleDestinationChange = async (cd: string) => {
  const selected = destinationOptions.value.find((item) => item.cd === cd)
  if (selected) {
    addForm.value.destination_name = selected.name
  } else {
    addForm.value.destination_name = ''
  }
  // 联动产品下拉
  addProductOptions.value = []
  addForm.value.product_cd = ''
  addForm.value.product_name = ''
  addForm.value.product_type = ''
  if (!cd) return
  try {
    const products = await getProductsByDestination(cd, addForm.value.year, addForm.value.month)
    addProductOptions.value = (products || [])
      .filter((p: any) => p.status !== 'inactive')
      .sort((a: any, b: any) => (a.product_name || '').localeCompare(b.product_name || ''))
      .map((p: any) => ({
        product_cd: p.product_cd,
        product_name: p.product_name,
        product_type: p.product_type || '',
      }))
  } catch (e) {
    addProductOptions.value = []
  }
}

// 选择製品CD时，自动带出製品名
const handleProductCdChangeForAdd = (cd: string) => {
  const selected = addProductOptions.value.find((item: any) => item.product_cd === cd)
  if (selected) {
    addForm.value.product_name = selected.product_name
    addForm.value.product_type = selected.product_type || ''
  } else {
    addForm.value.product_name = ''
    addForm.value.product_type = ''
  }
}

// 卡片显示数据
const summaryData = ref({
  forecast_units: 0,
  forecast_total_units: 0,
  forecast_diff: 0,
})

// 计算属性
const summary = computed(() => ({
  forecast_units: summaryData.value.forecast_units || 0,
  forecast_total_units: summaryData.value.forecast_total_units || 0,
  forecast_diff: summaryData.value.forecast_diff || 0,
}))

// 获取合计的方法
const fetchSummary = async () => {
  try {
    const params = {
      year: filters.value.year,
      month: filters.value.month,
      destination_cd: filters.value.destination_cd,
      keyword: filters.value.keyword,
    }
    const res = await fetchMonthlySummary(params)
    if (res) {
      summaryData.value = {
        forecast_units: typeof res.forecast_units === 'number' ? res.forecast_units : 0,
        forecast_total_units:
          typeof res.forecast_total_units === 'number' ? res.forecast_total_units : 0,
        forecast_diff: typeof res.forecast_diff === 'number' ? res.forecast_diff : 0,
      }
    }
  } catch (error) {
    console.error('获取合计数据失败', error)
    // 发生错误时设置默认值
    summaryData.value = {
      forecast_units: 0,
      forecast_total_units: 0,
      forecast_diff: 0,
    }
  }
}

// 查询列表
const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      year: filters.value.year,
      month: filters.value.month,
      destination_cd: filters.value.destination_cd,
      keyword: filters.value.keyword,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }
    const data = (await fetchMonthlyOrders(params)) as unknown as {
      list: OrderMonthly[]
      total: number
    }
    orderList.value = Array.isArray(data.list) ? data.list : []
    pagination.value.total = typeof data.total === 'number' ? data.total : 0

    // 获取所有数据的合计
    await fetchSummary()
  } catch (error) {
    console.error('注文一覧取得失敗', error)
    orderList.value = []
    pagination.value.total = 0
  } finally {
    loading.value = false
  }
}

// 重置筛选
const resetFilter = () => {
  filters.value = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    destination_cd: '',
    keyword: '',
  }
  pagination.value.page = 1
  fetchList()
}

// 打开"新規受注追加"弹窗
const handleAddOrder = () => {
  addForm.value = {
    destination_cd: '',
    destination_name: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    product_cd: '',
    product_name: '',
    product_type: '',
    product_alias: '',
    forecast_units: 0,
    forecast_total_units: 0,
  }
  addDialogVisible.value = true
}

// 保存新規受注
const handleSaveAddOrder = async () => {
  try {
    await addFormRef.value.validate()

    // 生成order_id
    const orderId = `${addForm.value.year}${String(addForm.value.month).padStart(2, '0')}${addForm.value.destination_cd}${addForm.value.product_cd}`

    // 检查order_id是否存在
    const exists = await checkMonthlyOrderExists(orderId)

    if (exists) {
      ElMessage.warning('同じ受注IDが既に存在します。追加できません。')
      return
    }

    // 保存
    await createMonthlyOrder({
      ...addForm.value,
      order_id: orderId,
    })

    ElMessage.success('登録成功！')
    addDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    console.error('handleSaveAddOrderエラー', error)
    ElMessage.error(error.message || '登録失敗しました')
  }
}

// ✏️ 編集用ダイアログ
const editDialogVisible = ref(false)
const editForm = ref<OrderMonthly>({
  id: undefined,
  destination_cd: '',
  destination_name: '',
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  product_cd: '',
  product_name: '',
  product_type: '',
  product_alias: '',
  forecast_units: 0,
  forecast_total_units: 0,
})
const editFormRef = ref()
const forecastUnitsInputRef = ref()
const handleEditOrder = async (row: OrderMonthly) => {
  editForm.value = { ...row }
  editDialogVisible.value = true
  await nextTick()
  if (forecastUnitsInputRef.value?.focus) {
    forecastUnitsInputRef.value.focus()
  } else if (forecastUnitsInputRef.value?.$el) {
    const inputEl = forecastUnitsInputRef.value.$el.querySelector('input')
    inputEl?.focus()
  }
}
// ✏️ 編集データ保存
const handleSaveEditOrder = async () => {
  await editFormRef.value.validate()
  if (!editForm.value.id) {
    ElMessage.error('編集対象が正しくありません')
    return
  }
  await updateMonthlyOrder(editForm.value.id, editForm.value)
  ElMessage.success('更新成功！')
  editDialogVisible.value = false
  fetchList()
}

// 🗑️ 削除ボタン押下時
const handleDeleteOrder = async (id: number) => {
  try {
    await ElMessageBox.confirm('この月別受注データを削除しますか？', '確認', {
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      type: 'warning',
    })
    await deleteMonthlyOrder(id)
    ElMessage.success('削除成功！')
    fetchList()
  } catch (error) {
    // 取消或失败，不用弹出失败提示
  }
}

// 📈 テーブル合計行計算
const getSummaries = ({ columns, data }: { columns: any[]; data: OrderMonthly[] }) => {
  const sums: (string | VNode)[] = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合計'
      return
    }

    const prop = column.property

    const formatNumber = (value: number | undefined): string => {
      if (typeof value !== 'number') return ''
      return value.toLocaleString('ja-JP')
    }

    if (prop === 'forecast_units') {
      // 排除产品名包含"加工"的品种
      const total = data
        .filter((cur) => !cur.product_name || !cur.product_name.includes('加工'))
        .reduce((acc, cur) => acc + (cur.forecast_units || 0), 0)
      sums[index] = formatNumber(total)
    } else if (prop === 'forecast_total_units') {
      // 排除产品名包含"加工"的品种
      const total = data
        .filter((cur) => !cur.product_name || !cur.product_name.includes('加工'))
        .reduce((acc, cur) => acc + (cur.forecast_total_units || 0), 0)
      sums[index] = formatNumber(total)
    } else if (prop === 'forecast_diff') {
      // 排除产品名包含"加工"的品种
      const total = data
        .filter((cur) => !cur.product_name || !cur.product_name.includes('加工'))
        .reduce((acc, cur) => acc + (cur.forecast_diff || 0), 0)

      // 🎨 使用 h() 渲染带颜色的 VNode
      const color = total < 0 ? '#e74c3c' : total > 0 ? '#2ecc71' : '#606266'

      sums[index] = h(
        'span',
        {
          style: {
            color,
            fontWeight: total !== 0 ? 'bold' : 'normal',
          },
        },
        formatNumber(total),
      )
    } else {
      sums[index] = ''
    }
  })

  return sums
}

// 📅 前の月ボタン押下時
const handlePrevMonth = () => {
  if (!filters.value.month) {
    filters.value.month = 1
  }
  if (filters.value.month === 1) {
    filters.value.month = 12
    filters.value.year!--
  } else {
    filters.value.month!--
  }
  fetchList()
}

// 📅 次の月ボタン押下時
const handleNextMonth = () => {
  if (!filters.value.month) {
    filters.value.month = 1
  }
  if (filters.value.month === 12) {
    filters.value.month = 1
    filters.value.year!++
  } else {
    filters.value.month!++
  }
  fetchList()
}

// 📅 今月に戻る
const goToCurrentMonth = () => {
  const now = new Date()
  filters.value.year = now.getFullYear()
  filters.value.month = now.getMonth() + 1
  fetchList()
}

// 🔍 検索クリア
const clearSearch = () => {
  filters.value.keyword = ''
  fetchList()
}

// 🔄 フィルタリセット
const resetFilters = () => {
  const now = new Date()
  filters.value.year = now.getFullYear()
  filters.value.month = now.getMonth() + 1
  filters.value.destination_cd = ''
  filters.value.keyword = ''
  selectedDestination.value = null
  fetchList()
}

// 🔥 一括登録ダイアログ
const batchDialogVisible = ref(false)

// 打开一括登録弹窗
const openBatchDialog = async () => {
  try {
    destinationOptions.value = await getDestinationOptions()
    batchDestinationOptions.value = [...destinationOptions.value] // 🔥 复制一份给批量用
  } catch (error) {
    ElMessage.error('納入先一覧取得に失敗しました')
  }
  batchDialogVisible.value = true
}

// 🔥 一括登録用のフォーム
const batchForm = ref({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  destination_cd: '',
  destination_name: '',
})

// 🔥 納入先オプション
const batchDestinationOptions = ref<Destination[]>([])

// 年选项
const batchYearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 3 + i)

// 🔥 取得した製品一覧
interface BatchProduct {
  product_cd: string
  product_name: string
  product_type: string
  quantity: string | number // 修改类型以允许字符串输入
  exists: boolean
}
const batchProducts = ref<BatchProduct[]>([])

// 🔥 読込中フラグ
const batchLoading = ref(false)

// 🔥 製品一覧読込
const fetchProducts = async () => {
  if (!batchForm.value.destination_cd) {
    ElMessage.warning('納入先を選択してください')
    return
  }

  batchLoading.value = true
  try {
    // 调用API获取产品列表
    const response = await getProductsByDestination(
      batchForm.value.destination_cd,
      batchForm.value.year,
      batchForm.value.month,
    )

    // 处理API响应数据结构
    let products: any[] = []
    if (response && Array.isArray(response)) {
      products = response
    } else if (
      response &&
      typeof response === 'object' &&
      'data' in response &&
      Array.isArray((response as any).data)
    ) {
      products = (response as any).data
    } else {
      ElMessage.warning('対象製品が存在しません')
      return
    }

    if (products.length === 0) {
      ElMessage.warning('対象製品が存在しません')
      return
    }

    // 处理产品数据
    batchProducts.value = products
      .sort((a: any, b: any) => (a.product_name || '').localeCompare(b.product_name || ''))
      .map(mapProductForDisplay)

    // 显示获取产品数量
    ElMessage.success(`${batchProducts.value.length}件の製品データを取得しました`)

    // 检查每个产品的存在状态
    await checkAllProductsExists()
  } catch (error) {
    console.error('製品一覧取得エラー:', error)
    ElMessage.error('製品一覧取得に失敗しました')
    batchProducts.value = []
  } finally {
    batchLoading.value = false
  }
}

// 🔥 批量检查所有产品的存在状态
const checkAllProductsExists = async () => {
  if (batchProducts.value.length === 0) return

  try {
    // 获取纳入先名称
    const selectedDestination = batchDestinationOptions.value.find(
      (item) => item.cd === batchForm.value.destination_cd,
    )
    if (selectedDestination) {
      batchForm.value.destination_name = selectedDestination.name
    }

    console.log('开始检查产品存在状态，产品数量:', batchProducts.value.length)

    // 并发检查所有产品的存在状态
    const checkPromises = batchProducts.value.map(async (product, index) => {
      const orderId = `${batchForm.value.year}${String(batchForm.value.month).padStart(2, '0')}${batchForm.value.destination_cd}${product.product_cd}`
      try {
        console.log(
          `检查产品 ${index + 1}/${batchProducts.value.length}: ${product.product_cd}, order_id: ${orderId}`,
        )
        const exists = await checkMonthlyOrderExists(orderId)

        // 直接修改原对象的属性
        batchProducts.value[index].exists = exists

        console.log(`产品 ${product.product_cd} 存在状态: ${exists}`)
        return { product_cd: product.product_cd, exists, index }
      } catch (error) {
        console.error(`检查产品 ${product.product_cd} 存在状态失败:`, error)
        batchProducts.value[index].exists = false // 出错时默认为不存在
        return {
          product_cd: product.product_cd,
          exists: false,
          error: (error as Error).message,
          index,
        }
      }
    })

    const results = await Promise.all(checkPromises)
    console.log('产品存在状态检查完成:', results)

    // 强制触发响应式更新
    batchProducts.value = [...batchProducts.value]

    nextTick(() => {
      console.log(
        '状态检测完成，当前产品状态:',
        batchProducts.value.map((p) => ({
          product_cd: p.product_cd,
          exists: p.exists,
        })),
      )
    })
  } catch (error) {
    console.error('批量检查产品存在状态失败:', error)
    // 不抛出错误，继续显示产品列表
  }
}

// 🔥 一括登録处理（允许0和空值，无确认弹窗，保存后关闭）
const handleBatchRegister = async () => {
  if (!batchForm.value.destination_cd || batchProducts.value.length === 0) {
    ElMessage.warning('納入先と製品情報を入力してください')
    return
  }

  // 重新检查存在状态
  await checkAllProductsExists()

  // 过滤出需要注册的产品（未存在的所有产品，包括数量为0或空的）
  const newProducts = batchProducts.value.filter((p) => !p.exists)

  if (newProducts.length === 0) {
    ElMessage.info('登録するデータがありません（すべて登録済みです）')
    return
  }

  try {
    // 直接保存，不要确认弹窗
    const result = await batchCreateMonthlyOrders({
      year: batchForm.value.year,
      month: batchForm.value.month,
      destination_cd: batchForm.value.destination_cd,
      destination_name: batchForm.value.destination_name,
      products: newProducts.map((p) => ({
        product_cd: p.product_cd,
        product_name: p.product_name,
        product_type: p.product_type || '',
        forecast_units: (() => {
          // 处理数量：空字符串、null、undefined 都转为 0
          if (p.quantity === '' || p.quantity === null || p.quantity === undefined) {
            return 0
          }
          const quantity = typeof p.quantity === 'string' ? parseFloat(p.quantity) : p.quantity
          return isNaN(quantity) ? 0 : quantity
        })(),
      })),
    })

    // 处理API返回的结果
    if (result && typeof result === 'object' && 'inserted' in result) {
      const { inserted, total, skipped, message } = result as any
      ElMessage.success(message || `${inserted}件のデータを登録しました！`)
      console.log(`登録結果: ${inserted}件登録, ${skipped}件スキップ, 全${total}件`)
    } else {
      ElMessage.success(`${newProducts.length}件のデータを登録しました！`)
    }

    // 刷新主列表
    fetchList()

    // 直接关闭对话框
    batchProducts.value = []
    batchDialogVisible.value = false
  } catch (error) {
    console.error('登録失敗', error)
    ElMessage.error('登録に失敗しました')
  }
}

// 月订单生成日订单
const generating = ref(false)
const handleGenerateDailyOrders = async () => {
  try {
    // 检查月份是否有效
    if (!filters.value.year || !filters.value.month) {
      ElMessage.warning('有効な年月を選択してください')
      return
    }

    generating.value = true
    await generateDailyOrders({
      year: filters.value.year,
      month: filters.value.month,
      productType: '量産品', // 只生成製品タイプ为量産品的记录
    })

    // 无论返回什么，都显示成功，因为后端执行已经成功
    ElMessage.success('量産品のみの日受注生成成功！')
    fetchList()
  } catch (error: any) {
    console.error('生成日订单时发生错误:', error)
    ElMessage.error('日受注生成失敗')
  } finally {
    generating.value = false
  }
}

//日订单全部同意编辑
const batchEditDialogVisible = ref(false)
const batchEditMonthlyOrderId = ref<string | ''>('')

const handleBatchEdit = (monthlyOrderId: string) => {
  batchEditMonthlyOrderId.value = monthlyOrderId
  batchEditDialogVisible.value = true
}

// 🔥 批量检查存在改为 Promise.all
const checkBatchProductsExists = async () => {
  const checkPromises = batchProducts.value.map(async (product) => {
    const orderId = `${batchForm.value.year}${String(batchForm.value.month).padStart(2, '0')}${batchForm.value.destination_cd}${product.product_cd}`
    try {
      const exists = await checkMonthlyOrderExists(orderId)
      product.exists = exists
    } catch (error) {
      console.error(`检查产品 ${product.product_cd} 存在状态失败:`, error)
      product.exists = false
    }
  })
  await Promise.all(checkPromises)
}

// 处理数量输入框回车键
const handleQuantityEnter = (currentIndex: number) => {
  // 如果不是最后一个输入框，跳到下一个
  if (currentIndex < batchProducts.value.length - 1) {
    // 延迟执行，确保DOM已更新
    setTimeout(() => {
      try {
        // 使用document.getElementById更可靠地查找元素
        const nextInputId = `quantity-input-${currentIndex + 1}`
        const nextInputEl = document.getElementById(nextInputId)

        if (nextInputEl) {
          const inputField = nextInputEl.querySelector('.el-input__inner') as HTMLInputElement
          if (inputField) {
            inputField.focus()
            inputField.select()
            return
          }
        }

        // 备用方案：使用querySelectorAll查找所有输入框
        const allInputs = document.querySelectorAll('.batch-product-table .el-input__inner')
        if (allInputs.length > currentIndex + 1) {
          ;(allInputs[currentIndex + 1] as HTMLInputElement).focus()
        }
      } catch (err) {
        console.error('跳转到下一个输入框时发生错误:', err)
      }
    }, 50)
  }
}

// 处理数量变更，实时更新状态
const handleQuantityChange = (row: BatchProduct, index: number) => {
  // 延迟触发状态检查，避免频繁调用
  setTimeout(async () => {
    if (row.product_cd && batchForm.value.destination_cd) {
      const orderId = `${batchForm.value.year}${String(batchForm.value.month).padStart(2, '0')}${batchForm.value.destination_cd}${row.product_cd}`
      try {
        const exists = await checkMonthlyOrderExists(orderId)
        row.exists = exists
      } catch (error) {
        console.error(`检查产品 ${row.product_cd} 存在状态失败:`, error)
      }
    }
  }, 300)
}

// 处理输入框获得焦点
const handleFocus = (event: any) => {
  // 如果值为0，清空输入框
  if (event.target.value === '0') {
    event.target.value = ''
  }
}

// 在map时将0转为空字符串
const mapProductForDisplay = (p: any) => {
  return {
    product_cd: p.product_cd,
    product_name: p.product_name,
    product_type: p.product_type || '', // 确保有默认值
    quantity: p.forecast_units > 0 ? p.forecast_units : '',
    exists: false, // 初始状态，将在checkAllProductsExists中更新
  }
}

// 根据产品类型返回不同的标签类型
const getProductTypeTagType = (
  productType: string,
): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  if (!productType) return 'info'

  // 根据不同的产品类型返回不同的颜色
  // 可以根据实际需求调整颜色分配
  const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    量産品: 'success',
    試作品: 'warning',
    その他: 'danger',
    補給品: 'info',
    サンプル品: 'primary',
    特注: 'warning',
    試作: 'danger',
  }

  return typeMap[productType] || 'info'
}

// 受注情報一括更新ダイアログ
const updateFieldsDialogVisible = ref(false)
const updateFieldsForm = ref({
  startDate: new Date(),
  updateProductInfo: true,
})
const updateFieldsLoading = ref(false)

// 打开受注情報一括更新弹窗
const openUpdateFieldsDialog = () => {
  updateFieldsForm.value = {
    startDate: new Date(),
    updateProductInfo: true,
  }
  updateFieldsDialogVisible.value = true
}

// 执行一括更新
const handleUpdateFields = async () => {
  if (!updateFieldsForm.value.startDate) {
    ElMessage.warning('開始日を選択してください')
    return
  }

  try {
    await ElMessageBox.confirm(
      '選択した日付以降の受注情報を一括更新します。この操作は元に戻せません。続行しますか？',
      '確認',
      {
        confirmButtonText: 'はい',
        cancelButtonText: 'いいえ',
        type: 'warning',
      },
    )

    updateFieldsLoading.value = true

    const startDate = new Date(updateFieldsForm.value.startDate)
    const formattedDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`

    const response = await updateOrderFields({
      startDate: formattedDate,
      updateProductInfo: updateFieldsForm.value.updateProductInfo,
    })

    console.log('API response:', response) // 调试用

    // 正确访问updatedCount字段，考虑各种可能的响应结构
    const updatedCount = response?.data?.updatedCount || 0

    ElMessage.success(`更新成功！${updatedCount}件のデータを更新しました`)
    updateFieldsDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('更新失敗', error)
      ElMessage.error(error.message || '更新に失敗しました')
    }
  } finally {
    updateFieldsLoading.value = false
  }
}

const productTypeOptions = ['量産品', '試作品', '補給品', 'サンプル品', 'その他']

// 日受注管理相关变量
const dailyOrderDialogVisible = ref(false)
const dailyOrderForm = ref({
  date: dayjs().format('YYYY-MM-DD'), // 默认今天
  destination_cd: '',
})
const dailyOrdersList = ref<OrderDaily[]>([])
const dailyOrdersLoading = ref(false)
const dailyOrdersSaving = ref(false)
const dailyConfirmedBoxesInputs = ref<(HTMLInputElement | undefined)[]>([])
const dailyChangedRows = ref<Set<number>>(new Set())

// 日期操作
const setDailyDate = (newDate: string) => {
  dailyOrderForm.value.date = newDate
  fetchDailyOrdersList() // 更改日期后自动搜索
}

const changeDay = (amount: number) => {
  const currentDate = dailyOrderForm.value.date || dayjs().format('YYYY-MM-DD')
  setDailyDate(dayjs(currentDate).add(amount, 'day').format('YYYY-MM-DD'))
}

const setToday = () => {
  setDailyDate(dayjs().format('YYYY-MM-DD'))
}

// 日受注管理 納入先選択
const destinationDialogVisible = ref(false)
const selectedDestination = ref<any>(null)
const destinationDialogCaller = ref<'main' | 'daily'>('main') // 'main' 或 'daily'

const openDestinationDialog = () => {
  destinationDialogCaller.value = 'daily'
  destinationDialogVisible.value = true
}

const selectedDailyDestinationName = computed(() => {
  if (!dailyOrderForm.value.destination_cd) return '納入先を選択'
  const dest = validDestinationOptions.value.find(
    (d) => d.cd === dailyOrderForm.value.destination_cd,
  )
  return dest ? `${dest.cd} | ${dest.name}` : '納入先を選択'
})

const selectDestination = (destinationCd: string) => {
  dailyOrderForm.value.destination_cd = destinationCd
  destinationDialogVisible.value = false
}

// 打开日受注管理弹窗
const openDailyOrderDialog = () => {
  dailyOrderForm.value = {
    date: dayjs().format('YYYY-MM-DD'),
    destination_cd: '',
  }
  dailyOrdersList.value = []
  dailyChangedRows.value.clear()
  dailyOrderDialogVisible.value = true
}

// 格式化日期显示
const formatDateDisplay = (year: number, month: number, day: number): string => {
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
}

// 格式化日期
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}`
  } catch (e) {
    return dateString.toString()
  }
}

// 获取日订单列表
const fetchDailyOrdersList = async () => {
  if (!dailyOrderForm.value.date) {
    ElMessage.warning('日付を選択してください')
    return
  }

  dailyOrdersLoading.value = true
  try {
    // 解析日期获取年月日
    const dateParts = dailyOrderForm.value.date.split('-')
    const year = parseInt(dateParts[0])
    const month = parseInt(dateParts[1])
    const day = parseInt(dateParts[2])

    const params = {
      specificDate: dailyOrderForm.value.date,
      destination_cd: dailyOrderForm.value.destination_cd,
      page: 1,
      pageSize: 1000,
    }

    const res = await fetchDailyOrders(params)
    console.log('日受注データ取得結果:', res)

    // 更灵活地处理数据结构
    let listData: OrderDaily[] = []
    if (res && res.data && Array.isArray(res.data.list)) {
      listData = res.data.list
    } else if (res && Array.isArray(res.list)) {
      listData = res.list
    } else if (res && res.data && Array.isArray(res.data)) {
      listData = res.data
    } else if (Array.isArray(res)) {
      listData = res
    }

    console.log('提取的列表数据:', listData.length, '条记录')
    dailyOrdersList.value = listData
    dailyChangedRows.value.clear()

    // 初始化后聚焦到第一个输入框
    await nextTick()
    if (dailyOrdersList.value.length > 0) {
      const firstInput = document.querySelector('.daily-orders-table .el-input__inner')
      if (firstInput) {
        ;(firstInput as HTMLInputElement).focus()
      }
    }
  } catch (error) {
    console.error('日受注データ取得失敗', error)
    ElMessage.error('日受注データの取得に失敗しました')
    dailyOrdersList.value = []
  } finally {
    dailyOrdersLoading.value = false
  }
}

// 处理确定箱数变更
const handleDailyConfirmedBoxesChange = (row: OrderDaily) => {
  const unitPerBox = row.unit_per_box ?? 0
  row.confirmed_units = unitPerBox > 0 ? row.confirmed_boxes * unitPerBox : row.confirmed_boxes
  markDailyRowChanged(row)
}

// 标记行已修改
const markDailyRowChanged = (row: OrderDaily) => {
  if (row.id) dailyChangedRows.value.add(Number(row.id))
}

// 回车键聚焦下一个输入框
const focusDailyNextInput = async (currentIndex: number) => {
  await nextTick()
  const nextInput = dailyConfirmedBoxesInputs.value[currentIndex + 1]
  if (nextInput) {
    nextInput.focus()
  }
}

// 获取曜日样式类
const getWeekdayClass = (weekday: string) => {
  switch (weekday) {
    case '土':
      return 'weekday-saturday'
    case '日':
      return 'weekday-sunday'
    default:
      return 'weekday-normal'
  }
}

// 保存日订单修改
const handleDailyOrdersSave = async () => {
  if (dailyOrdersSaving.value) return
  if (dailyChangedRows.value.size === 0) {
    ElMessage.warning('変更されたデータがありません')
    return
  }

  dailyOrdersSaving.value = true
  try {
    const updates: OrderDailyUpdate[] = dailyOrdersList.value
      .filter((row) => {
        const id = Number(row.id)
        return Number.isInteger(id) && id > 0 && dailyChangedRows.value.has(id)
      })
      .map((row) => ({
        id: Number(row.id),
        forecast_units: Number(row.forecast_units ?? 0),
        confirmed_boxes: Number(row.confirmed_boxes ?? 0),
        confirmed_units: Number(row.confirmed_units ?? 0),
        status: row.status ?? '未出荷',
        remarks: row.remarks ?? '',
      }))

    if (updates.length === 0) {
      ElMessage.warning('送信データがありません')
      return
    }

    await batchUpdateDailyOrders({ list: updates })

    ElMessage.success('一括保存成功しました！')
    dailyChangedRows.value.clear()
    await fetchDailyOrdersList() // 重新加载数据
  } catch (error) {
    console.error('一括保存失敗', error)
    const errorMessage = error instanceof Error ? error.message : '保存に失敗しました'
    ElMessage.error(errorMessage)
  } finally {
    dailyOrdersSaving.value = false
  }
}

// 日订单表格汇总计算
const getDailySummaries = ({ columns, data }: { columns: any[]; data: OrderDaily[] }) => {
  const sums: (string | VNode)[] = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合計'
      return
    }

    const prop = column.property

    if (prop === 'confirmed_boxes') {
      // 确定箱数合计
      const total = data.reduce((acc, cur) => acc + (cur.confirmed_boxes || 0), 0)
      sums[index] = formatNumber(total)
    } else if (prop === 'confirmed_units') {
      // 确定本数合计 - 修正计算逻辑
      let total = 0

      // 使用循环而不是reduce，方便处理不同的计算情况
      for (const item of data) {
        if (item.confirmed_units && item.confirmed_units > 0) {
          // 如果已有确定本数，直接使用
          total += item.confirmed_units
        } else if (item.confirmed_boxes > 0 && item.unit_per_box && item.unit_per_box > 0) {
          // 如果没有确定本数，但有确定箱数和入数，则计算得出
          total += item.confirmed_boxes * (item.unit_per_box || 0)
        }
      }

      sums[index] = formatNumber(total)
    } else if (prop === 'forecast_units') {
      // 内示本数合计
      const total = data.reduce((acc, cur) => acc + (cur.forecast_units || 0), 0)
      sums[index] = formatNumber(total)
    } else {
      sums[index] = ''
    }
  })

  return sums
}

const fetchDestinations = async () => {
  try {
    destinationOptions.value = await getDestinationOptions()
  } catch (err: any) {
    ElMessage.error(err.message || '納入先一覧の取得に失敗しました')
  }
}

onMounted(async () => {
  try {
    // 模拟页面加载
    setTimeout(() => {
      pageLoading.value = false
    }, 1500)

    await fetchDestinations()
    await fetchList()
  } catch (err) {
    console.error('onMounted error:', err)
  }
})

const handleDestinationSelect = (destination: { value: string; label: string } | null) => {
  const destinationCd = destination ? destination.value : ''

  if (destinationDialogCaller.value === 'main') {
    filters.value.destination_cd = destinationCd
    fetchList()
  } else {
    dailyOrderForm.value.destination_cd = destinationCd
    fetchDailyOrdersList()
  }

  destinationDialogVisible.value = false
}

const getDestinationName = computed(() => {
  if (!filters.value.destination_cd) {
    return '全て選択'
  }
  const dest = destinationOptions.value.find((d) => d.cd === filters.value.destination_cd)
  return dest ? `${dest.cd} | ${dest.name}` : '不明な納入先'
})

const refreshData = () => {
  fetchList()
}

const dailyDestinationDialogVisible = ref(false)

const handleDailyDestinationSelect = (destination: { value: string; label: string } | null) => {
  dailyOrderForm.value.destination_cd = destination ? destination.value : ''
  dailyDestinationDialogVisible.value = false
  fetchList()
}

const openMainDestinationDialog = () => {
  destinationDialogCaller.value = 'main'
  destinationDialogVisible.value = true
}
</script>

<style scoped>
/* 页面背景和基础样式 */
.order-monthly-list-container {
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.order-monthly-list-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
  animation: backgroundShift 20s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes backgroundShift {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* 页面加载遮罩 */
.page-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeOut 0.5s ease-in-out 1.2s forwards;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 60px;
  height: 60px;
  top: 10px;
  left: 10px;
  animation-delay: -0.4s;
  border-top-color: rgba(255, 255, 255, 0.6);
}

.spinner-ring:nth-child(3) {
  width: 40px;
  height: 40px;
  top: 20px;
  left: 20px;
  animation-delay: -0.8s;
  border-top-color: rgba(255, 255, 255, 0.4);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    visibility: hidden;
  }
}

.loading-text {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  opacity: 0.9;
}

/* 页面元素进入动画 */
.animate-in {
  animation: slideInFromTop 0.8s ease-out 0.3s both;
}

.animate-in-delay-1 {
  animation: slideInFromLeft 0.8s ease-out 0.6s both;
}

.animate-in-delay-2 {
  animation: slideInFromRight 0.8s ease-out 0.9s both;
}

.animate-in-delay-3 {
  animation: slideInFromLeft 0.8s ease-out 1.2s both;
}

.animate-in-delay-4 {
  animation: slideInFromBottom 0.8s ease-out 1.5s both;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 页面头部 */
.page-header {
  position: relative;
  z-index: 1;
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.title-section {
  flex: 1;
}

.title {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 0 0 10px 0;
  color: white;
  font-size: 32px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.title-icon {
  width: 55px;
  height: 55px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  animation: iconPulse 3s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.title-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: iconShine 4s ease-in-out infinite;
}

@keyframes iconPulse {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
  50% {
    transform: scale(1.08) rotate(2deg);
    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.6);
  }
}

@keyframes iconShine {
  0%,
  100% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  50% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

.title-icon .el-icon {
  font-size: 26px;
  color: white;
  z-index: 1;
  position: relative;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.title-badge {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
  animation: badgeFloat 3s ease-in-out infinite;
}

@keyframes badgeFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  margin: 0;
  font-weight: 400;
}

.header-decoration {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 80px;
  height: 80px;
  top: -40px;
  right: 0;
  animation-delay: 0s;
}

.circle-2 {
  width: 60px;
  height: 60px;
  top: 20px;
  right: 60px;
  animation-delay: 2s;
}

.circle-3 {
  width: 40px;
  height: 40px;
  top: -10px;
  right: 120px;
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* 现代化卡片样式 */
.modern-card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  margin-bottom: 15px;
}

.modern-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.15);
}

/* 合计卡片 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.summary-card {
  position: relative;
  overflow: hidden;
  padding: 0;
  border: none;
}

.card-content {
  display: flex;
  align-items: center;
  padding: 25px;
  position: relative;
  z-index: 2;
}

.card-icon {
  width: 65px;
  height: 65px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card-icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.card-icon:hover::before {
  left: 100%;
}

.card-icon:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.info-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
  animation: infoGlow 3s ease-in-out infinite alternate;
}

.success-icon {
  background: linear-gradient(135deg, #56ab2f, #a8e6cf);
  animation: successGlow 3s ease-in-out infinite alternate;
}

.diff-icon {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  animation: diffGlow 3s ease-in-out infinite alternate;
}

@keyframes infoGlow {
  0% {
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  }
  100% {
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
  }
}

@keyframes successGlow {
  0% {
    box-shadow: 0 6px 20px rgba(86, 171, 47, 0.3);
  }
  100% {
    box-shadow: 0 8px 25px rgba(86, 171, 47, 0.5);
  }
}

@keyframes diffGlow {
  0% {
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3);
  }
  100% {
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.5);
  }
}

.card-icon .el-icon {
  font-size: 26px;
  color: white;
  z-index: 1;
  position: relative;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  animation: iconFloat 2s ease-in-out infinite alternate;
}

@keyframes iconFloat {
  0% {
    transform: translateY(0px);
  }
  100% {
    transform: translateY(-2px);
  }
}

.card-info {
  flex: 1;
}

.summary-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: 1px;
}

.card-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
  border-radius: 0 20px 0 100px;
}

/* 操作按钮区域 */
.action-card {
  padding: 20px;
}

.action-header {
  margin-bottom: 15px;
}

.action-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.action-icon {
  font-size: 22px;
  color: #667eea;
  animation: actionIconPulse 2s ease-in-out infinite;
}

@keyframes actionIconPulse {
  0%,
  100% {
    color: #667eea;
    transform: scale(1);
  }
  50% {
    color: #764ba2;
    transform: scale(1.1);
  }
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.action-button {
  margin: 0;
  flex-grow: 1;
  font-weight: 600;
  border: 2px solid transparent;
  color: #1f2937; /* 深色文字 */
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.action-button .el-icon {
  font-size: 16px;
  transition: all 0.3s ease;
}

.action-button:hover .el-icon {
  transform: scale(1.1) rotate(-5deg);
}

.action-button::before {
  display: none; /* 移除闪光效果 */
}

.btn-add {
  border-color: #818cf8;
  background: linear-gradient(135deg, #f5f3ff, #eef2ff);
}
.btn-add .el-icon {
  color: #6366f1;
}
.btn-add:hover {
  border-color: #6366f1;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
}

.btn-batch {
  border-color: #6ee7b7;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
}
.btn-batch .el-icon {
  color: #22c55e;
}
.btn-batch:hover {
  border-color: #22c55e;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
}

.btn-generate {
  border-color: #f9a8d4;
  background: linear-gradient(135deg, #fdf2f8, #fce7f3);
}
.btn-generate .el-icon {
  color: #ec4899;
}
.btn-generate:hover {
  border-color: #ec4899;
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
}

.btn-update-fields {
  border-color: #7dd3fc;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
}
.btn-update-fields .el-icon {
  color: #0ea5e9;
}
.btn-update-fields:hover {
  border-color: #0ea5e9;
  background: linear-gradient(135deg, #e0f2fe, #bae6fd);
}

.btn-daily-manage {
  border-color: #fcd34d;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}
.btn-daily-manage .el-icon {
  color: #f59e0b;
}
.btn-daily-manage:hover {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}

/* 筛选卡片 */
.filter-card {
  padding: 0;
}

.filter-card.no-header :deep(.el-card__header) {
  display: none;
}

.filter-card.no-header :deep(.el-card__body) {
  padding: 20px;
}

.filter-header-inline {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.filter-header {
  padding: 15px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.filter-icon {
  font-size: 20px;
  color: #667eea;
  animation: filterIconSpin 4s linear infinite;
}

@keyframes filterIconSpin {
  0% {
    transform: rotate(0deg);
    color: #667eea;
  }
  25% {
    transform: rotate(90deg);
    color: #764ba2;
  }
  50% {
    transform: rotate(180deg);
    color: #667eea;
  }
  75% {
    transform: rotate(270deg);
    color: #764ba2;
  }
  100% {
    transform: rotate(360deg);
    color: #667eea;
  }
}

.filter-form {
  padding: 0;
  margin-top: 0;
}

.filter-row {
  margin: 0;
  align-items: flex-end;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.modern-form-item {
  margin-bottom: 0;
}

.nav-form-item {
  margin-top: 22px; /* 对齐导航按钮到其他输入框底部 */
}

.modern-select,
.modern-input {
  width: 100%;
}

/* 特定宽度的选择器 */
.year-select {
  min-width: 100px;
}

.month-select {
  min-width: 90px;
}

.destination-select {
  min-width: 200px;
}

.product-search {
  min-width: 180px;
}

.modern-select :deep(.el-input__inner),
.modern-input :deep(.el-input__inner) {
  border-radius: 8px;
  border: 2px solid #e1e8ed;
  transition: all 0.3s ease;
  padding: 10px 12px;
  font-size: 14px;
}

.modern-select :deep(.el-input__inner):focus,
.modern-input :deep(.el-input__inner):focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.month-nav-buttons {
  display: flex;
  gap: 8px;
}

.nav-button {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.3s ease;
  min-width: 70px;
}

.prev-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
}

.next-button {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
  border: none;
}

.nav-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.search-icon {
  color: #667eea;
  animation: searchIconPulse 2s ease-in-out infinite;
}

@keyframes searchIconPulse {
  0%,
  100% {
    color: #667eea;
    transform: scale(1);
  }
  50% {
    color: #764ba2;
    transform: scale(1.1);
  }
}

/* 表格卡片 */
.table-card {
  padding: 0;
}

.table-card.no-header :deep(.el-card__header) {
  display: none;
}

.table-card.no-header :deep(.el-card__body) {
  padding: 20px;
}

.table-header-inline {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.table-header {
  padding: 15px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.table-title {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.table-icon {
  font-size: 22px;
  color: #667eea;
  animation: tableIconBounce 2s ease-in-out infinite;
}

@keyframes tableIconBounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
    color: #667eea;
  }
  40% {
    transform: translateY(-8px);
    color: #764ba2;
  }
  60% {
    transform: translateY(-4px);
    color: #667eea;
  }
}

.count-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 8px 14px;
  border-radius: 18px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  animation: badgeGlow 2s ease-in-out infinite alternate;
}

@keyframes badgeGlow {
  0% {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    transform: scale(1);
  }
  100% {
    box-shadow: 0 6px 18px rgba(102, 126, 234, 0.5);
    transform: scale(1.02);
  }
}

.count-icon {
  font-size: 14px;
  animation: countIconRotate 3s ease-in-out infinite;
}

@keyframes countIconRotate {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(180deg);
  }
}

.table-wrapper {
  padding: 0;
  margin-top: 0;
}

.modern-table {
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.modern-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.modern-table :deep(.el-table__header th) {
  background: transparent;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
  padding: 15px 12px;
}

.modern-table :deep(.el-table__body tr:hover) {
  background-color: rgba(102, 126, 234, 0.05);
}

.modern-table :deep(.el-table__body td) {
  padding: 12px;
  border-bottom: 1px solid #f1f3f4;
}

/* 表格单元格样式 */
.destination-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.location-icon {
  color: #667eea;
  font-size: 16px;
  animation: locationIconPulse 2s ease-in-out infinite alternate;
}

@keyframes locationIconPulse {
  0% {
    color: #667eea;
    transform: scale(1);
  }
  100% {
    color: #764ba2;
    transform: scale(1.1);
  }
}

.number-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.number-value {
  font-weight: 700;
  color: #2c3e50;
  font-size: 14px;
}

.number-unit {
  font-size: 11px;
  color: #667eea;
  font-weight: 600;
  opacity: 0.8;
}

.diff-cell-new {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* 内示差異字段样式 */
.diff-value-simple {
  font-weight: 700;
  font-size: 15px;
  transition: all 0.3s ease;
}

.diff-value-simple.diff-positive {
  color: #28a745;
}

.diff-value-simple.diff-negative {
  color: #dc3545;
}

.diff-value-simple.diff-zero {
  color: #6c757d;
}

.diff-value-simple:hover {
  transform: scale(1.1);
}

/* 表格操作按钮 */
.table-action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
}

.compact-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.compact-btn .el-icon {
  font-size: 14px;
}

.compact-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.compact-btn:hover::before {
  left: 100%;
}

.compact-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.primary-btn {
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.primary-btn:hover {
  background: linear-gradient(135deg, #337ecc, #409eff);
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.5);
}

.warning-btn {
  background: linear-gradient(135deg, #e6a23c, #d4922a);
  color: white;
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.3);
}

.warning-btn:hover {
  background: linear-gradient(135deg, #d4922a, #e6a23c);
  box-shadow: 0 4px 15px rgba(230, 162, 60, 0.5);
}

.danger-btn {
  background: linear-gradient(135deg, #f56c6c, #e85656);
  color: white;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
}

.danger-btn:hover {
  background: linear-gradient(135deg, #e85656, #f56c6c);
  box-shadow: 0 4px 15px rgba(245, 108, 108, 0.5);
}

.compact-btn:active {
  transform: translateY(0) scale(0.95);
}

/* 工具提示样式 */
.table-action-buttons :deep(.el-tooltip__trigger) {
  display: inline-block;
}

:deep(.el-tooltip__popper) {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

:deep(.el-tooltip__popper .el-popper__arrow::before) {
  background: rgba(0, 0, 0, 0.8);
  border: none;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  margin-top: 20px;
  color: #6c757d;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.empty-icon {
  font-size: 64px;
  color: #dee2e6;
  margin-bottom: 20px;
  animation: emptyIconFloat 3s ease-in-out infinite;
}

@keyframes emptyIconFloat {
  0%,
  100% {
    transform: translateY(0px) scale(1);
    color: #dee2e6;
  }
  50% {
    transform: translateY(-10px) scale(1.05);
    color: #c6c7c8;
  }
}

.empty-text {
  font-size: 18px;
  color: #6c757d;
  margin: 0;
  font-weight: 500;
  opacity: 0.8;
}

/* 分页器 */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0 0 0;
  margin-top: 20px;
  border-top: 1px solid rgba(102, 126, 234, 0.1);
}

.pagination-info {
  color: #6c757d;
  font-size: 14px;
}

.modern-pagination :deep(.el-pagination) {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modern-pagination :deep(.el-pagination .el-pager li) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.modern-pagination :deep(.el-pagination .el-pager li:hover) {
  transform: translateY(-2px);
}

.modern-pagination :deep(.el-pagination .el-pager li.is-active) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

/* 现代化对话框 */
.modern-dialog :deep(.el-dialog) {
  border-radius: 24px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  overflow: hidden;
}

.modern-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px 30px;
  border-radius: 24px 24px 0 0;
  position: relative;
  overflow: hidden;
}

.modern-dialog :deep(.el-dialog__header)::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: headerShine 3s ease-in-out infinite;
}

@keyframes headerShine {
  0%,
  100% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
}

.modern-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 700;
  font-size: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.modern-dialog :deep(.el-dialog__headerbtn) {
  position: relative;
  z-index: 1;
}

.modern-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
  font-size: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.modern-dialog :deep(.el-dialog__headerbtn .el-dialog__close):hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.modern-dialog :deep(.el-dialog__body) {
  padding: 30px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
}

.modern-dialog :deep(.el-dialog__footer) {
  padding: 20px 30px 30px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* 弹窗头部图标样式 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-icon {
  font-size: 24px;
  color: rgb(10, 250, 50);
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  animation: iconPulse 2s ease-in-out infinite alternate;
}

@keyframes iconPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  100% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
}

.dialog-title {
  color: rgb(8, 8, 8);
  font-weight: 700;
  font-size: 20px;
  text-shadow: 0 2px 4px rgba(36, 168, 36, 0.3);
}

/* 不同类型弹窗的图标颜色 */
.add-dialog .dialog-icon {
  background: rgba(103, 194, 58, 0.3);
}

.edit-dialog .dialog-icon {
  background: rgba(255, 193, 7, 0.3);
}

.batch-dialog .dialog-icon {
  background: rgba(64, 158, 255, 0.3);
}

.update-dialog .dialog-icon {
  background: rgba(255, 99, 132, 0.3);
}

.daily-manage-dialog .dialog-icon {
  background: rgba(54, 162, 235, 0.3);
}

/* 弹窗进入动画 */
.modern-dialog :deep(.el-dialog) {
  animation: dialogSlideIn 0.4s ease-out;
}

@keyframes dialogSlideIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -60%) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.modern-dialog :deep(.el-overlay) {
  animation: overlayFadeIn 0.3s ease-out;
}

@keyframes overlayFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/* 表单项动画 */
.modern-dialog .form-body :deep(.el-form-item) {
  animation: formItemSlideIn 0.5s ease-out;
  animation-fill-mode: both;
}

.modern-dialog .form-body :deep(.el-form-item:nth-child(1)) {
  animation-delay: 0.1s;
}
.modern-dialog .form-body :deep(.el-form-item:nth-child(2)) {
  animation-delay: 0.15s;
}
.modern-dialog .form-body :deep(.el-form-item:nth-child(3)) {
  animation-delay: 0.2s;
}
.modern-dialog .form-body :deep(.el-form-item:nth-child(4)) {
  animation-delay: 0.25s;
}
.modern-dialog .form-body :deep(.el-form-item:nth-child(5)) {
  animation-delay: 0.3s;
}
.modern-dialog .form-body :deep(.el-form-item:nth-child(6)) {
  animation-delay: 0.35s;
}
.modern-dialog .form-body :deep(.el-form-item:nth-child(7)) {
  animation-delay: 0.4s;
}
.modern-dialog .form-body :deep(.el-form-item:nth-child(8)) {
  animation-delay: 0.45s;
}

@keyframes formItemSlideIn {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 按钮图标动画 */
.modern-dialog :deep(.el-dialog__footer .el-button .el-icon) {
  margin-right: 6px;
  transition: transform 0.3s ease;
}

.modern-dialog :deep(.el-dialog__footer .el-button):hover .el-icon {
  transform: scale(1.1);
}

/* 特殊弹窗样式增强 */
.batch-dialog :deep(.el-dialog) {
  max-height: 90vh;
  overflow: hidden;
}

.batch-dialog :deep(.el-dialog__body) {
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

/* 弹窗表单美化 */
.modern-dialog .form-body {
  background: transparent;
}

.modern-dialog .form-body :deep(.el-form-item) {
  margin-bottom: 24px;
}

.modern-dialog .form-body :deep(.el-form-item__label) {
  color: #2c3e50;
  font-weight: 600;
  font-size: 14px;
}

.modern-dialog .form-body :deep(.el-input__wrapper) {
  border-radius: 12px;
  border: 2px solid #e1e8ed;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.modern-dialog .form-body :deep(.el-input__wrapper):hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.modern-dialog .form-body :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modern-dialog .form-body :deep(.el-select .el-input__wrapper) {
  border-radius: 12px;
}

.modern-dialog .form-body :deep(.el-input-number .el-input__wrapper) {
  border-radius: 12px;
}

.modern-dialog .form-body :deep(.el-date-editor .el-input__wrapper) {
  border-radius: 12px;
}

/* 弹窗按钮美化 */
.modern-dialog :deep(.el-dialog__footer .el-button) {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.modern-dialog :deep(.el-dialog__footer .el-button)::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.modern-dialog :deep(.el-dialog__footer .el-button):hover::before {
  left: 100%;
}

.modern-dialog :deep(.el-dialog__footer .el-button--primary) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.modern-dialog :deep(.el-dialog__footer .el-button--primary):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.modern-dialog :deep(.el-dialog__footer .el-button:not(.el-button--primary)) {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  color: #6c757d;
  border: 2px solid #e1e8ed;
}

.modern-dialog :deep(.el-dialog__footer .el-button:not(.el-button--primary)):hover {
  background: linear-gradient(135deg, #e9ecef, #dee2e6);
  color: #495057;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .summary-cards {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .order-monthly-list-container {
    padding: 10px;
  }

  .page-header {
    padding: 15px;
    margin-bottom: 15px;
  }

  .title {
    font-size: 24px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .summary-cards {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 15px;
  }

  .button-group {
    flex-direction: column;
    gap: 10px;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .filter-row {
    flex-direction: column;
  }

  .filter-form {
    padding: 12px 15px;
  }

  .month-nav-buttons {
    flex-direction: column;
    gap: 6px;
  }

  .pagination-container {
    flex-direction: column;
    gap: 12px;
  }

  .modern-card {
    margin-bottom: 12px;
  }

  .table-action-buttons {
    gap: 4px;
  }

  .compact-btn {
    width: 28px;
    height: 28px;
  }

  .compact-btn .el-icon {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 20px;
  }

  .card-content {
    padding: 20px;
  }

  .card-icon {
    width: 50px;
    height: 50px;
  }

  .summary-value {
    font-size: 24px;
  }
}

/* 批量登录弹窗特殊样式 */
.batch-form-container {
  padding: 0;
}

.batch-form {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.batch-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.batch-form :deep(.el-form-item__label) {
  color: #2c3e50;
  font-weight: 600;
  font-size: 14px;
}

.year-select,
.month-select,
.destination-select {
  width: 100%;
}

.year-select {
  min-width: 150px;
}

.month-select {
  min-width: 120px;
}

.destination-select {
  min-width: 250px;
}

.load-btn {
  background: linear-gradient(135deg, #409eff, #337ecc);
  border: none;
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3);
}

.load-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.4);
}

.cancel-btn,
.register-btn {
  padding: 12px 24px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.register-btn {
  background: linear-gradient(135deg, #67c23a, #5daf34);
  border: none;
  color: white;
  box-shadow: 0 4px 15px rgba(103, 194, 58, 0.3);
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(103, 194, 58, 0.4);
}

.batch-product-table {
  margin-top: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.batch-product-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.batch-product-table :deep(.el-table__header th) {
  background: transparent;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.quantity-input {
  width: 90px;
  text-align: center;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.quantity-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  text-align: center;
}

.quantity-input :deep(.el-input__inner) {
  text-align: center;
}

.warning-cell :deep(.el-input__wrapper) {
  background-color: #fff8f6;
  border-color: #f56c6c;
}

.normal-cell :deep(.el-input__wrapper) {
  background-color: #f0f9eb;
  border-color: #67c23a;
}

.empty-placeholder,
.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6c757d;
  font-size: 14px;
  margin-top: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  border-radius: 12px;
  border: 2px dashed #dee2e6;
  backdrop-filter: blur(10px);
}

.loading-placeholder .el-icon {
  font-size: 32px;
  margin-bottom: 15px;
  color: #409eff;
  animation: loadingSpin 1.5s linear infinite;
}

@keyframes loadingSpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 批量弹窗表格行动画 */
.batch-product-table :deep(.el-table__body tr) {
  animation: tableRowSlideIn 0.4s ease-out;
  animation-fill-mode: both;
}

.batch-product-table :deep(.el-table__body tr:nth-child(odd)) {
  animation-delay: 0.05s;
}

.batch-product-table :deep(.el-table__body tr:nth-child(even)) {
  animation-delay: 0.1s;
}

@keyframes tableRowSlideIn {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 状态标签美化 */
.batch-product-table :deep(.el-tag) {
  border-radius: 12px;
  font-weight: 600;
  font-size: 12px;
  padding: 4px 12px;
  border: none;
  transition: all 0.3s ease;
}

.batch-product-table :deep(.el-tag.status-tag) {
  min-width: 60px;
  text-align: center;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.batch-product-table :deep(.el-tag.registered) {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52) !important;
  color: white !important;
  border: none !important;
  animation: dangerPulse 2s ease-in-out infinite alternate;
}

.batch-product-table :deep(.el-tag.unregistered) {
  background: linear-gradient(135deg, #51cf66, #40c057) !important;
  color: white !important;
  border: none !important;
  animation: successPulse 2s ease-in-out infinite alternate;
}

@keyframes dangerPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4);
  }
  100% {
    box-shadow: 0 0 0 4px rgba(255, 107, 107, 0);
  }
}

@keyframes successPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(81, 207, 102, 0.4);
  }
  100% {
    box-shadow: 0 0 0 4px rgba(81, 207, 102, 0);
  }
}

/* 鼠标悬停效果 */
.batch-product-table :deep(.el-tag.status-tag):hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.daily-manage-dialog {
  margin-bottom: 0;
}

.daily-manage-dialog :deep(.el-dialog) {
  border-radius: 20px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
}

.daily-manage-dialog :deep(.el-dialog__body) {
  padding: 20px 30px;
}

.daily-filter-form {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  padding: 8px;
  border-radius: 10px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.daily-filter-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.daily-filter-form :deep(.el-form-item__label) {
  color: #2c3e50;
  font-weight: 600;
}

.daily-filter-form :deep(.el-input__wrapper),
.daily-filter-form :deep(.el-date-editor .el-input__wrapper) {
  border-radius: 10px;
  border: 2px solid #e1e8ed;
  transition: all 0.3s ease;
}

.daily-filter-form :deep(.el-input__wrapper):hover,
.daily-filter-form :deep(.el-date-editor .el-input__wrapper):hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.daily-filter-form :deep(.el-button) {
  padding: 10px 10px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.daily-filter-form :deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.daily-filter-form :deep(.el-button--primary):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.daily-orders-table {
  margin-top: 10px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.daily-orders-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.daily-orders-table :deep(.el-table__header th) {
  background: transparent;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
  padding: 15px 12px;
}

.daily-orders-table :deep(.el-table__body tr:hover) {
  background-color: rgba(102, 126, 234, 0.05);
}

.daily-orders-table :deep(.el-table__body td) {
  padding: 12px;
  border-bottom: 1px solid #f1f3f4;
}

.daily-orders-table :deep(.el-input__wrapper) {
  border-radius: 6px;
  border: 1px solid #e1e8ed;
  transition: all 0.3s ease;
}

.daily-orders-table :deep(.el-input__wrapper):focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.daily-orders-table :deep(.el-input__wrapper):hover {
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .modern-dialog :deep(.el-dialog) {
    margin: 20px;
    width: calc(100% - 40px) !important;
    max-width: none;
  }

  .modern-dialog :deep(.el-dialog__body) {
    padding: 20px 15px;
  }

  .batch-form {
    padding: 15px;
  }

  .daily-filter-form {
    padding: 15px;
    flex-direction: column;
    align-items: stretch;
  }

  .daily-filter-form :deep(.el-form-item) {
    margin-bottom: 15px;
  }
}
/* 紧凑型对话框样式 */
.compact-dialog {
  --el-dialog-padding-primary: 12px;
}

.compact-dialog :deep(.el-dialog__body) {
  padding: 8px 12px 12px 12px;
}

.compact-select-button {
  width: 220px;
  justify-content: flex-start;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #374151 !important;
  border-color: #d1d5db !important;
  background: #ffffff !important;
}

.compact-select-button:hover {
  color: #1f2937 !important;
  border-color: #9ca3af !important;
  background: #f9fafb !important;
}

.destination-select-dialog .destination-buttons-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 10px;
  justify-content: center;
}

.destination-select-dialog .destination-button {
  margin: 5px;
  font-size: 14px;
  flex-basis: 200px;
  flex-grow: 1;
  height: 40px;
}

/* 增强型对话框样式 */
.enhanced-dialog {
  --el-dialog-padding-primary: 0;
}

.enhanced-dialog :deep(.el-dialog) {
  border-radius: 24px;
  box-shadow: 0 30px 100px rgba(0, 0, 0, 0.25);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid rgba(102, 126, 234, 0.2);
  overflow: hidden;
}

.enhanced-dialog :deep(.el-dialog__header) {
  padding: 25px 35px 20px 35px;
  background: linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #581c87 100%);
  margin: 0;
  position: relative;
}

.enhanced-dialog :deep(.el-dialog__header)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
  pointer-events: none;
}

.enhanced-dialog :deep(.el-dialog__body) {
  padding: 30px 35px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.enhanced-dialog :deep(.el-dialog__footer) {
  padding: 25px 35px 30px 35px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-top: 2px solid #e5e7eb;
}

.enhanced-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  position: relative;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.enhanced-header .dialog-icon {
  font-size: 28px;
  color: #000000 !important;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  padding: 12px;
  border-radius: 16px;
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.enhanced-header .dialog-title {
  font-size: 24px;
  font-weight: 800;
  color: #000000 !important;
  text-shadow: 0 3px 6px rgba(255, 255, 255, 0.8) !important;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-badge {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%);
  padding: 8px 16px;
  border-radius: 25px;
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.header-badge .badge-text {
  color: #000000 !important;
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.enhanced-form {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 25px;
  border-radius: 20px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  border: 2px solid #e2e8f0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  position: relative;
}

.enhanced-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.enhanced-form :deep(.el-form-item__label) {
  color: #1f2937 !important;
  font-weight: 700;
  font-size: 15px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.enhanced-form :deep(.el-input__wrapper),
.enhanced-form :deep(.el-date-editor .el-input__wrapper) {
  border-radius: 12px;
  border: 2px solid #e1e8ed;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.enhanced-form :deep(.el-input__wrapper):hover,
.enhanced-form :deep(.el-date-editor .el-input__wrapper):hover {
  border-color: #667eea;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.enhanced-form :deep(.el-button) {
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.enhanced-form :deep(.el-button--primary) {
  background: linear-gradient(135deg, #1e40af, #3730a3) !important;
  border: none !important;
  color: #000000 !important;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 4px 15px rgba(30, 64, 175, 0.4);
}

.enhanced-form :deep(.el-button--primary):hover {
  background: linear-gradient(135deg, #1d4ed8, #4338ca) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(30, 64, 175, 0.5);
}

.enhanced-form :deep(.el-button-group .el-button) {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  margin: 0 2px;
  transition: all 0.3s ease;
}

.enhanced-form :deep(.el-button-group .el-button) {
  color: #374151 !important;
  border-color: #d1d5db !important;
  background: #ffffff !important;
}

.enhanced-form :deep(.el-button-group .el-button):hover {
  color: #1f2937 !important;
  border-color: #9ca3af !important;
  background: #f9fafb !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.modern-daily-table {
  margin-top: 20px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.modern-daily-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #581c87 100%);
}

.modern-daily-table :deep(.el-table__header th) {
  background: transparent !important;
  color: #000000 !important;
  font-weight: 700;
  border-bottom: none;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8) !important;
}

.modern-daily-table :deep(.el-table__body tr:hover) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.modern-daily-table :deep(.el-table__body tr:nth-child(even)) {
  background-color: #fafbfc;
}

.modern-daily-table :deep(.el-table__body td) {
  padding: 15px 12px;
  border-bottom: 1px solid #f1f3f4;
  transition: all 0.3s ease;
}

.modern-daily-table :deep(.el-table__summary-row) {
  background: linear-gradient(
    135deg,
    rgba(30, 64, 175, 0.15) 0%,
    rgba(55, 48, 163, 0.15) 100%
  ) !important;
  font-weight: 700;
  color: #1f2937 !important;
}

.modern-daily-table :deep(.el-table__summary-row td) {
  border-top: 3px solid #1e40af !important;
  font-size: 15px;
  font-weight: 700 !important;
  color: #1f2937 !important;
}

.table-cell-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-cell-content.centered {
  justify-content: center;
  text-align: center;
}

.table-cell-content.left-aligned {
  justify-content: flex-start;
  text-align: left;
}

.cell-text {
  font-weight: 700;
  color: #2c3e50;
  font-size: 14px;
}

.date-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.date-value {
  font-weight: 700;
  color: #2c3e50;
  font-size: 14px;
}

.weekday-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.weekday-value {
  font-weight: 700;
  color: #2c3e50;
  font-size: 14px;
}

.weekday-saturday {
  color: #1e40af !important;
  font-weight: 800;
}

.weekday-sunday {
  color: #dc2626 !important;
  font-weight: 800;
}

.weekday-normal {
  color: #2c3e50;
  font-weight: 700;
}

.number-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.number-value {
  font-weight: 700;
  color: #2c3e50;
  font-size: 14px;
  padding: 4px 8px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border: 1px solid #0ea5e9;
}

.input-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.select-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.modern-table-input {
  width: 80px;
  height: 30px;
  text-align: center;
  vertical-align: middle;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.modern-table-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  text-align: center;
}

.modern-table-input :deep(.el-input__inner) {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  height: 36px;
  line-height: 36px;
}

.editable-input :deep(.el-input__wrapper) {
  border: 2px solid #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  transition: all 0.3s ease;
}

.editable-input :deep(.el-input__wrapper):hover {
  border-color: #4338ca;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.editable-input :deep(.el-input__wrapper):focus-within {
  border-color: #3730a3;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.readonly-input :deep(.el-input__wrapper) {
  border: 2px solid #e5e7eb;
  box-shadow: none;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.readonly-input :deep(.el-input__inner) {
  color: #6b7280;
  font-weight: 600;
}

.modern-status-select {
  width: 100%;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.modern-status-select :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 2px solid #e1e8ed;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.modern-status-select :deep(.el-input__wrapper):hover {
  border-color: #667eea;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.modern-status-select :deep(.el-input__wrapper):focus-within {
  border-color: #4338ca;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.modern-status-select :deep(.el-input__inner) {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  height: 36px;
  line-height: 36px;
}

.modern-status-select :deep(.el-popper) {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.modern-status-select :deep(.el-select-dropdown__item) {
  font-weight: 600;
  color: #2c3e50;
  padding: 12px 16px;
  transition: all 0.3s ease;
}

.modern-status-select :deep(.el-select-dropdown__item:hover) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  color: #667eea;
}

.modern-status-select :deep(.el-select-dropdown__item.is-selected) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-weight: 700;
}

.enhanced-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.enhanced-cancel-button,
.enhanced-save-button {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.enhanced-cancel-button {
  color: #6b7280;
  border: 2px solid #d1d5db;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
}

.enhanced-cancel-button:hover {
  color: #374151;
  border-color: #9ca3af;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.enhanced-save-button {
  background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%) !important;
  border: none !important;
  color: #000000 !important;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 4px 15px rgba(30, 64, 175, 0.4);
}

.enhanced-save-button:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(30, 64, 175, 0.5);
}

.enhanced-save-button:active {
  transform: translateY(0);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.enhanced-cancel-button:disabled,
.enhanced-save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.enhanced-cancel-button:disabled:hover,
.enhanced-save-button:disabled:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.destination-select-button {
  width: 220px;
  justify-content: flex-start;
}

/* 增强筛选样式 */
.enhanced-filter {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(102, 126, 234, 0.15);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
}

.enhanced-filter :deep(.el-card__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px 16px 0 0;
  padding: 20px 24px;
  border-bottom: none;
}

.enhanced-filter .filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 0;
  border: none;
}

.enhanced-filter .filter-title {
  color: white;
  font-size: 18px;
  font-weight: 700;
}

.enhanced-filter .filter-icon {
  color: white;
  animation: none;
}

.filter-stats .stats-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.filter-content {
  padding: 24px;
}

.filter-bar.enhanced {
  margin: 0;
}

.filter-section {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.filter-section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
}

.section-label .el-icon {
  color: #667eea;
  font-size: 18px;
}

.time-controls {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.date-selectors {
  display: flex;
  gap: 12px;
  align-items: center;
}

.compact-form-item {
  margin-bottom: 0;
}

.compact-form-item :deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
  font-size: 16px;
}

.compact-select {
  min-width: 100px;
  border-radius: 8px;
}

.compact-select :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.compact-select :deep(.el-input__wrapper):hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.month-nav-buttons.enhanced {
  display: flex;
  gap: 8px;
}

.nav-button {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.prev-button {
  background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
  color: white;
  border: none;
}

.prev-button:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(248, 113, 113, 0.3);
}

.current-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
}

.current-button:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.next-button {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
}

.next-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.search-controls {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.enhanced-form-item {
  margin-bottom: 0;
  flex: 1;
  min-width: 200px;
}

.enhanced-form-item :deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.destination-select-button.enhanced {
  width: 100%;
  min-width: 200px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #374151;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.destination-select-button.enhanced:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.destination-select-button.enhanced.has-selection {
  border-color: #667eea;
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  color: #667eea;
}

.expand-icon {
  color: #9ca3af;
  transition: transform 0.3s ease;
}

.destination-select-button.enhanced:hover .expand-icon {
  transform: rotate(180deg);
  color: #667eea;
}

.enhanced-input {
  border-radius: 8px;
}

.enhanced-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.enhanced-input :deep(.el-input__wrapper):hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.enhanced-input :deep(.el-input__wrapper):focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-suffix {
  display: flex;
  align-items: center;
}

.clear-search-btn {
  padding: 4px;
  border-radius: 4px;
  color: #9ca3af;
  transition: all 0.3s ease;
}

.clear-search-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.action-form-item {
  margin-bottom: 0;
  flex-shrink: 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.search-button.enhanced {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.search-button.enhanced:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4c93 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.reset-button.enhanced {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.reset-button.enhanced:hover {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(156, 163, 175, 0.3);
}

/* 单行筛选布局样式 */
.filter-bar.single-row {
  margin: 0;
  padding: 0;
}

.filter-row-unified {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.05);
  transition: all 0.3s ease;
}

.filter-row-unified:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.filter-group.time-group {
  border-right: 1px solid rgba(102, 126, 234, 0.15);
  padding-right: 24px;
}

.filter-group.search-group {
  flex: 1;
  border-right: 1px solid rgba(102, 126, 234, 0.15);
  padding-right: 24px;
}

.filter-group.action-group {
  flex-shrink: 0;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  margin-right: 8px;
}

.group-label .el-icon {
  font-size: 14px;
  color: #667eea;
}

.group-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.inline-form-item {
  margin-bottom: 0 !important;
  margin-right: 0 !important;
}

.inline-form-item :deep(.el-form-item__label) {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  padding-right: 8px;
  margin-bottom: 0;
}

.compact-select {
  width: 80px;
}

.year-select {
  width: 85px;
}

.month-select {
  width: 75px;
}

.nav-buttons-inline {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.nav-btn {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
}

.nav-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  transform: translateY(-1px);
}

.nav-btn.current-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: #667eea;
}

.nav-btn.current-btn:hover {
  background: linear-gradient(135deg, #5a6fd8, #6a4c93);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.destination-btn {
  padding: 10px 16px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  font-size: 13px;
  transition: all 0.2s ease;
  min-width: 240px;
  max-width: 350px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.destination-btn:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  transform: translateY(-1px);
}

.destination-btn.has-selection {
  border-color: #667eea;
  background: linear-gradient(135deg, #ede9fe, #ddd6fe);
  color: #667eea;
  font-weight: 500;
}

.expand-icon {
  font-size: 12px;
  opacity: 0.7;
  transition: transform 0.2s ease;
}

.destination-btn:hover .expand-icon {
  transform: rotate(180deg);
}

.destination-btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.destination-text {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.search-item {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 6px;
  border: 1px solid #d1d5db;
  transition: all 0.2s ease;
}

.search-input :deep(.el-input__wrapper):hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.search-input :deep(.el-input__wrapper):focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  color: #9ca3af;
  font-size: 14px;
}

.action-buttons.compact {
  display: flex;
  gap: 8px;
}

.modern-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
}

.search-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.search-btn:hover {
  background: linear-gradient(135deg, #5a6fd8, #6a4c93);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.reset-btn {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  color: white;
  box-shadow: 0 2px 8px rgba(156, 163, 175, 0.3);
}

.reset-btn:hover {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(156, 163, 175, 0.4);
}

/* 内示本数和確定本数列简约无边框样式 */
:deep(.el-table) {
  td:nth-child(7),
  td:nth-child(8) {
    border-left: none !important;
    border-right: none !important;
  }

  th:nth-child(7),
  th:nth-child(8) {
    border-left: none !important;
    border-right: none !important;
    background: rgba(248, 250, 252, 0.8) !important;
  }
}

/* 响应式设计 */
/* 中等屏幕 (平板横屏) */
@media (max-width: 1200px) {
  .filter-row-unified {
    gap: 24px;
    padding: 16px 20px;
  }

  .filter-group.time-group {
    padding-right: 16px;
  }

  .filter-group.search-group {
    padding-right: 16px;
  }

  .destination-btn {
    min-width: 200px;
    max-width: 280px;
  }

  .search-item {
    min-width: 180px;
  }
}

/* 平板设备 */
@media (max-width: 992px) {
  .filter-row-unified {
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px;
  }

  .filter-group.time-group {
    flex: 1 1 auto;
    min-width: 300px;
    border-right: none;
    padding-right: 0;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(102, 126, 234, 0.15);
  }

  .filter-group.search-group {
    flex: 1 1 100%;
    border-right: none;
    padding-right: 0;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(102, 126, 234, 0.15);
  }

  .filter-group.action-group {
    flex: 1 1 100%;
    justify-content: center;
  }

  .group-controls {
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  /* 时间组在平板上的优化 */
  .time-group .group-controls {
    justify-content: center;
    align-items: center;
  }

  .destination-btn {
    min-width: 180px;
    max-width: 250px;
  }

  .search-item {
    flex: 1;
    min-width: 200px;
  }

  .action-buttons.compact {
    justify-content: center;
  }
}

/* 移动设备 */
@media (max-width: 768px) {
  .enhanced-filter .filter-content {
    padding: 16px;
  }

  /* 移动端单行布局调整 */
  .filter-row-unified {
    flex-direction: column;
    gap: 20px;
    padding: 16px;
  }

  .filter-group {
    width: 100%;
    border-right: none !important;
    padding-right: 0 !important;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .group-label {
    justify-content: center;
    margin-right: 0;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(102, 126, 234, 0.15);
  }

  .group-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .time-group .group-controls {
    flex-direction: column;
    align-items: stretch;
  }

  /* 时间选择器在移动端的布局 */
  .time-group .group-controls > .inline-form-item {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .time-group .group-controls > .inline-form-item :deep(.el-form-item__label) {
    text-align: center;
    margin-bottom: 4px;
  }

  .compact-select,
  .year-select,
  .month-select {
    width: 100% !important;
  }

  .nav-buttons-inline {
    margin-left: 0;
    justify-content: center;
    gap: 8px;
  }

  .nav-btn {
    flex: 1;
    padding: 8px 12px;
  }

  .search-group .group-controls {
    align-items: stretch;
  }

  /* 搜索组在移动端的优化 */
  .search-group .inline-form-item {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .search-group .inline-form-item :deep(.el-form-item__label) {
    text-align: center;
    margin-bottom: 4px;
  }

  .destination-btn {
    min-width: auto;
    max-width: none;
    width: 100%;
    justify-content: space-between;
  }

  .destination-text {
    text-align: center;
  }

  .search-item {
    min-width: auto;
  }

  .search-input {
    width: 100%;
  }

  .action-buttons.compact {
    flex-direction: column;
    gap: 8px;
  }

  .modern-btn {
    width: 100%;
    justify-content: center;
  }

  .filter-section {
    padding: 16px;
    margin-bottom: 16px;
  }

  .time-controls,
  .search-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .date-selectors {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .month-nav-buttons.enhanced {
    flex-direction: column;
    gap: 8px;
  }

  .nav-button {
    width: 100%;
    justify-content: center;
  }

  .enhanced-form-item {
    min-width: 100%;
  }

  .destination-select-button.enhanced {
    min-width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .search-button.enhanced,
  .reset-button.enhanced {
    width: 100%;
    justify-content: center;
  }
}

/* 超小屏幕 (小手机) */
@media (max-width: 480px) {
  .filter-row-unified {
    padding: 12px;
    gap: 16px;
  }

  .group-label {
    font-size: 12px;
    padding-bottom: 6px;
  }

  .inline-form-item :deep(.el-form-item__label) {
    font-size: 11px;
  }

  .nav-btn {
    padding: 6px 8px;
    font-size: 11px;
  }

  .destination-btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .search-input :deep(.el-input__inner) {
    font-size: 14px;
  }

  .modern-btn {
    padding: 8px 16px;
    font-size: 12px;
  }
}

/* 极小屏幕优化 */
@media (max-width: 360px) {
  .filter-row-unified {
    padding: 10px;
    gap: 12px;
  }

  .group-label {
    font-size: 11px;
  }

  .nav-buttons-inline {
    gap: 4px;
  }

  .nav-btn {
    padding: 4px 6px;
    font-size: 10px;
    min-width: 0;
  }

  .nav-btn.current-btn {
    padding: 6px 8px;
  }
}
</style>
