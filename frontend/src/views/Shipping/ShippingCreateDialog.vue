<template>
  <el-dialog
    v-model="visible"
    title="出荷No作成"
    width="98%"
    @close="emit('close')"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    top="0.5vh"
    class="shipping-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-left">
          <el-icon class="header-icon">
            <Box />
          </el-icon>
          <span class="header-title">出荷No作成</span>
        </div>
        <div class="header-stats">
          <el-tag type="info" size="small" effect="light">
            <el-icon>
              <Document />
            </el-icon>
            総注文: {{ dailyOrders.length }}件
          </el-tag>
          <el-tag v-if="selectedItems.length > 0" type="success" size="small" effect="light">
            <el-icon><Select /></el-icon>
            選択済み: {{ selectedItems.length }}件
          </el-tag>
        </div>
      </div>
    </template>

    <div class="shipping-creator">
      <!-- 主要内容区域：左右双池子设计 -->
      <div class="pool-container">
        <!-- 左侧池子：日订单列表 -->
        <div class="left-pool">
          <div class="pool-header">
            <div class="pool-title">
              <el-icon class="pool-icon">
                <List />
              </el-icon>
              <h3>
                受注データ
                <el-tag type="info" size="small" effect="light">{{ dailyOrders.length }}件</el-tag>
                <el-tag
                  v-if="dailyOrders.length !== availableOrdersCount"
                  type="success"
                  size="small"
                  effect="light"
                >
                  {{ availableOrdersCount }}件利用可能
                </el-tag>
              </h3>
            </div>
            <div class="filter-section">
              <el-card shadow="never" class="filter-card">
                <div class="filter-form-compact">
                  <div class="filter-row">
                    <div class="filter-group">
                      <label class="filter-label">出荷日:</label>
                      <div class="date-range-container">
                        <el-date-picker
                          v-model="filters.dateRange"
                          type="daterange"
                          start-placeholder="開始日"
                          end-placeholder="終了日"
                          value-format="YYYY-MM-DD"
                          style="width: 200px"
                          @change="onFilterChange"
                          size="small"
                        />
                        <div class="date-quick-buttons">
                          <el-button size="small" @click="adjustDateRange(-1)" class="date-btn">
                            <el-icon><ArrowLeft /></el-icon>
                          </el-button>
                          <el-button size="small" @click="setToday" class="date-btn today-btn">
                            今日
                          </el-button>
                          <el-button size="small" @click="adjustDateRange(1)" class="date-btn">
                            <el-icon><ArrowRight /></el-icon>
                          </el-button>
                        </div>
                      </div>
                    </div>
                    <div class="filter-group">
                      <label class="filter-label">納入先:</label>
                      <el-button
                        @click="destinationDialogVisible = true"
                        class="destination-select-button"
                        size="small"
                      >
                        <span v-if="selectedDestinations.length === 0" class="placeholder-text">
                          選択
                        </span>
                        <span v-else-if="selectedDestinations.length === 1" class="selected-text">
                          {{ getDestinationLabel(selectedDestinations[0]).split(' - ')[0] }}
                        </span>
                        <span v-else class="selected-text"
                          >{{ selectedDestinations.length }}件</span
                        >
                        <el-icon class="select-arrow">
                          <ArrowDown />
                        </el-icon>
                      </el-button>
                    </div>
                    <div class="filter-actions">
                      <el-button size="small" @click="resetFilters" class="reset-btn">
                        <el-icon>
                          <Refresh />
                        </el-icon>
                        リセット
                      </el-button>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>

          <div class="pool-content" v-loading="loading.orders">
            <el-empty
              v-if="!loading.orders && filteredOrders.length === 0"
              description="条件に合う注文データがありません"
              :image-size="80"
            >
              <template #image>
                <el-icon size="80" color="#c0c4cc">
                  <DocumentRemove />
                </el-icon>
              </template>
            </el-empty>

            <div v-else class="table-container">
              <el-table
                :data="filteredOrders"
                border
                stripe
                style="width: 100%"
                height="520px"
                @selection-change="handleSelectionChange"
                row-key="product_cd"
                :row-class-name="tableRowClassName"
                show-summary
                :summary-method="getSummaries"
                class="orders-table"
                size="small"
              >
                <el-table-column type="selection" width="40" :selectable="isRowSelectable" />
                <el-table-column label="状態" width="70" align="center">
                  <template #default="{ row }">
                    <div v-if="shippedIdentifiers">
                      <el-tag v-if="row.shipping_no" size="small" type="success" effect="light">
                        <el-icon>
                          <CircleCheck />
                        </el-icon>
                        処理済
                      </el-tag>
                      <el-tag
                        v-else-if="
                          shippedIdentifiers.has(
                            `${row.product_cd}-${row.destination_cd}-${formatShippingDate(row)}`,
                          )
                        "
                        size="small"
                        type="info"
                        effect="light"
                      >
                        <el-icon>
                          <Finished />
                        </el-icon>
                        出荷済
                      </el-tag>
                      <el-tag v-else size="small" type="primary" effect="light">
                        <el-icon>
                          <Clock />
                        </el-icon>
                        未処理
                      </el-tag>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="出荷日" width="85" align="center">
                  <template #default="{ row }">
                    <el-text type="primary" size="small">
                      {{ formatShippingDate(row) }}
                    </el-text>
                  </template>
                </el-table-column>
                <el-table-column
                  label="納入先"
                  prop="destination_name"
                  min-width="120"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <el-text size="small">
                      {{ row.destination_name }}
                    </el-text>
                  </template>
                </el-table-column>
                <el-table-column
                  label="製品名"
                  prop="product_name"
                  min-width="90"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <el-text size="small">
                      {{ row.product_name }}
                    </el-text>
                  </template>
                </el-table-column>
                <el-table-column label="箱数" width="50" align="right">
                  <template #default="{ row }">
                    <el-text type="warning" class="number-text" size="small">
                      {{ (row.confirmed_boxes || 0).toLocaleString() }}
                    </el-text>
                  </template>
                </el-table-column>
                <el-table-column label="数量" width="65" align="right">
                  <template #default="{ row }">
                    <el-text type="success" class="number-text" size="small">
                      {{ (row.confirmed_units || 0).toLocaleString() }}
                    </el-text>
                  </template>
                </el-table-column>
                <el-table-column
                  label="出荷No"
                  prop="shipping_no"
                  min-width="90"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <el-text v-if="row.shipping_no" type="info" size="small">{{
                      row.shipping_no
                    }}</el-text>
                    <el-text v-else type="info" class="placeholder-text" size="small"
                      >未設定</el-text
                    >
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="50" fixed="right" align="center">
                  <template #default="{ row }">
                    <el-button
                      size="small"
                      type="primary"
                      circle
                      @click="addToSelectedItems([row])"
                      :disabled="
                        isItemSelected(row) || !!row.shipping_no || isItemInRightTable(row)
                      "
                      class="action-btn"
                    >
                      <el-icon>
                        <Right />
                      </el-icon>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div class="pool-footer" v-if="filteredOrders.length > 0">
                <el-button
                  type="primary"
                  size="default"
                  @click="addSelectedItems"
                  :disabled="selectedRows.length === 0"
                  class="add-selected-btn"
                >
                  <el-icon>
                    <Plus />
                  </el-icon>
                  選択項目を追加 ({{ selectedRows.length }}件)
                  <el-icon class="el-icon--right">
                    <Right />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧池子：已选择的出货项目 -->
        <div class="right-pool">
          <div class="pool-header">
            <div class="pool-title">
              <el-icon class="pool-icon">
                <ShoppingCart />
              </el-icon>
              <h3>
                出荷リスト
                <el-tag type="success" size="small" effect="light"
                  >{{ selectedItems.length }}件</el-tag
                >
              </h3>
            </div>
            <div class="shipping-settings">
              <el-card shadow="never" class="settings-card">
                <el-form :inline="true" size="small">
                  <el-row :gutter="10">
                    <el-col :span="24">
                      <div class="settings-section">
                        <div class="section-title">
                          <el-icon class="section-icon">
                            <Setting />
                          </el-icon>
                          <span>パレット容量設定</span>
                          <el-tooltip
                            content="各箱種のパレット上の最大積載量を設定します"
                            placement="top"
                          >
                            <el-icon class="help-icon">
                              <InfoFilled />
                            </el-icon>
                          </el-tooltip>
                        </div>
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="小箱/パレット" class="capacity-item">
                        <el-input-number
                          v-model="boxSettings.小箱"
                          :min="1"
                          size="small"
                          @change="recalculatePallets"
                          controls-position="right"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="大箱/パレット" class="capacity-item">
                        <el-input-number
                          v-model="boxSettings.大箱"
                          :min="1"
                          size="small"
                          @change="recalculatePallets"
                          controls-position="right"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="TP箱/パレット" class="capacity-item">
                        <el-input-number
                          v-model="boxSettings.TP箱"
                          :min="1"
                          size="small"
                          @change="recalculatePallets"
                          controls-position="right"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-divider class="settings-divider" />
                  <el-row :gutter="10">
                    <el-col :span="24">
                      <div class="settings-section">
                        <div class="section-title">
                          <el-icon class="section-icon">
                            <MagicStick />
                          </el-icon>
                          <span>パレット最適化アルゴリズム</span>
                          <el-tooltip
                            content="パレット割り当ての最適化アルゴリズムを選択します"
                            placement="top"
                          >
                            <el-icon class="help-icon">
                              <InfoFilled />
                            </el-icon>
                          </el-tooltip>
                        </div>
                      </div>
                    </el-col>
                    <el-col :span="16">
                      <el-form-item label="最適化アルゴリズム" class="algorithm-item">
                        <el-select
                          v-model="settings.optimizationMethod"
                          style="width: 200px"
                          @change="recalculatePallets"
                        >
                          <el-option
                            v-for="option in optimizationOptions"
                            :key="option.value"
                            :label="option.label"
                            :value="option.value"
                          />
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item>
                        <el-button
                          type="success"
                          size="small"
                          @click="recalculatePallets"
                          :disabled="selectedItems.length === 0"
                          class="recalculate-btn"
                        >
                          <el-icon>
                            <Refresh />
                          </el-icon>
                          再計算
                        </el-button>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>
              </el-card>
            </div>
          </div>

          <div class="pool-content">
            <el-empty
              v-if="selectedItems.length === 0"
              description="左側から出荷する注文を選択してください"
              :image-size="80"
            >
              <template #image>
                <el-icon size="80" color="#c0c4cc">
                  <ShoppingCartFull />
                </el-icon>
              </template>
            </el-empty>

            <template v-else>
              <!-- 已选择的项目列表 -->
              <div class="selected-items-section">
                <div class="section-header">
                  <el-icon class="section-icon">
                    <List />
                  </el-icon>
                  <span class="section-title">選択済みリスト</span>
                </div>
                <el-table
                  :data="selectedItems"
                  border
                  stripe
                  style="width: 100%; margin-bottom: 12px"
                  max-height="240px"
                  class="selected-items-table"
                  size="small"
                >
                  <el-table-column label="出荷日" prop="shipping_date" width="85" align="center">
                    <template #default="{ row }">
                      <el-text type="primary" size="small">
                        {{ formatShippingDate(row) }}
                      </el-text>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="納入先"
                    prop="destination_name"
                    min-width="110"
                    show-overflow-tooltip
                  >
                    <template #default="{ row }">
                      <el-text size="small">
                        {{ row.destination_name }}
                      </el-text>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="製品名"
                    prop="product_name"
                    min-width="110"
                    show-overflow-tooltip
                  >
                    <template #default="{ row }">
                      <div v-if="row.product_name && row.product_name.includes(',')">
                        <el-tooltip
                          placement="top-start"
                          :visible-arrow="false"
                          effect="dark"
                          :enterable="true"
                        >
                          <template #content>
                            <div class="pallet-detail-tooltip">
                              <h4 style="margin-top: 0; margin-bottom: 8px">混載パレット詳細</h4>
                              <table
                                style="width: 100%; border-collapse: collapse; margin-bottom: 8px"
                              >
                                <thead>
                                  <tr style="background-color: #f5f7fa">
                                    <th
                                      style="
                                        padding: 6px;
                                        text-align: left;
                                        border: 1px solid #ebeef5;
                                      "
                                    >
                                      製品名
                                    </th>
                                    <th
                                      style="
                                        padding: 6px;
                                        text-align: left;
                                        border: 1px solid #ebeef5;
                                      "
                                    >
                                      箱種
                                    </th>
                                    <th
                                      style="
                                        padding: 6px;
                                        text-align: right;
                                        border: 1px solid #ebeef5;
                                      "
                                    >
                                      箱数
                                    </th>
                                    <th
                                      style="
                                        padding: 6px;
                                        text-align: right;
                                        border: 1px solid #ebeef5;
                                      "
                                    >
                                      数量
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr v-for="(item, index) in row.detail" :key="index">
                                    <td
                                      style="
                                        padding: 6px;
                                        text-align: left;
                                        border: 1px solid #ebeef5;
                                      "
                                    >
                                      {{ item.product_name }}
                                    </td>
                                    <td
                                      style="
                                        padding: 6px;
                                        text-align: left;
                                        border: 1px solid #ebeef5;
                                      "
                                    >
                                      {{ item.box_type || '-' }}
                                    </td>
                                    <td
                                      style="
                                        padding: 6px;
                                        text-align: right;
                                        border: 1px solid #ebeef5;
                                      "
                                    >
                                      {{ item.confirmed_boxes }}
                                    </td>
                                    <td
                                      style="
                                        padding: 6px;
                                        text-align: right;
                                        border: 1px solid #ebeef5;
                                      "
                                    >
                                      {{ (item.confirmed_units || 0).toLocaleString() }}
                                    </td>
                                  </tr>
                                </tbody>
                                <tfoot>
                                  <tr style="background-color: #f5f7fa; font-weight: bold">
                                    <td style="padding: 6px; border: 1px solid #ebeef5" colspan="2">
                                      合計
                                    </td>
                                    <td
                                      style="
                                        padding: 6px;
                                        text-align: right;
                                        border: 1px solid #ebeef5;
                                      "
                                    >
                                      {{ row.confirmed_boxes }}
                                    </td>
                                    <td
                                      style="
                                        padding: 6px;
                                        text-align: right;
                                        border: 1px solid #ebeef5;
                                      "
                                    >
                                      {{ (row.confirmed_units || 0).toLocaleString() }}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </template>
                          <el-tag size="small" type="info">混載製品</el-tag>
                        </el-tooltip>
                      </div>
                      <div v-else>{{ row.product_name }}</div>
                    </template>
                  </el-table-column>
                  <el-table-column label="箱種" width="60">
                    <template #default="{ row }">
                      {{ row.box_type || '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="箱数" width="50" align="right">
                    <template #default="{ row }">
                      {{ (row.confirmed_boxes || 0).toLocaleString() }}
                    </template>
                  </el-table-column>

                  <el-table-column label="数量" width="55" align="right">
                    <template #default="{ row }">
                      {{ (row.confirmed_units || 0).toLocaleString() }}
                    </template>
                  </el-table-column>
                  <el-table-column label="納入日" width="85">
                    <template #default="{ row }">
                      {{ formatDate(row.delivery_date) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="50" fixed="right">
                    <template #default="{ row }">
                      <el-button size="small" type="danger" circle @click="removeSelectedItem(row)">
                        <el-icon>
                          <Delete />
                        </el-icon>
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <!-- 托盘分配结果 -->
                <div class="pallets-section">
                  <div class="section-header">
                    <el-icon class="section-icon">
                      <Box />
                    </el-icon>
                    <h4>パレット割り当て案</h4>
                    <div class="allocation-summary">
                      <el-button
                        type="primary"
                        size="small"
                        @click="showPalletEditDialog"
                        :disabled="pallets.length === 0"
                        class="edit-pallet-btn"
                      >
                        <el-icon>
                          <Edit />
                        </el-icon>
                        パレット詳細編集
                      </el-button>
                      <el-tag type="info" size="small" effect="light">
                        <el-icon>
                          <DataBoard />
                        </el-icon>
                        総パレット数: {{ pallets.length }}
                      </el-tag>
                      <el-tag type="primary" size="small" effect="light">
                        <el-icon>
                          <Box />
                        </el-icon>
                        総割当て箱数: {{ pallets.reduce((sum, p) => sum + p.confirmed_boxes, 0) }}
                      </el-tag>
                      <el-tag type="success" size="small" effect="light">
                        <el-icon>
                          <Goods />
                        </el-icon>
                        総割当て数量: {{ totalAllocated }}
                      </el-tag>
                      <el-tag
                        v-if="totalAllocated !== totalSelectedUnits"
                        type="danger"
                        size="small"
                        effect="light"
                      >
                        <el-icon>
                          <Warning />
                        </el-icon>
                        未割当て: {{ totalSelectedUnits - totalAllocated }}
                      </el-tag>
                    </div>
                  </div>

                  <el-table
                    :data="pallets"
                    border
                    stripe
                    style="width: 100%"
                    max-height="350px"
                    :cell-style="{ padding: '0px 0' }"
                    size="small"
                    class="pallets-table"
                  >
                    <el-table-column label="パレット番号" min-width="180">
                      <template #default="{ row }">
                        <div style="display: flex; align-items: center; gap: 4px">
                          <span style="flex-shrink: 0; font-size: 13px">{{
                            row.shipping_no_prefix
                          }}</span>
                          <div
                            style="
                              display: flex;
                              align-items: center;
                              background: white;
                              border: 1px solid #dcdfe6;
                              border-radius: 4px;
                              width: 60px;
                            "
                          >
                            <span
                              style="
                                flex: 1;
                                text-align: center;
                                padding: 0px 0px;
                                font-size: 11px;
                                font-weight: 600;
                                color: #303133;
                              "
                            >
                              {{ formatSerialForDisplay(row.shipping_no_serial) }}
                            </span>
                            <div
                              style="
                                display: flex;
                                flex-direction: column;
                                border-left: 1px solid #dcdfe6;
                              "
                            >
                              <button
                                @click="incrementPalletNumber(row)"
                                style="
                                  border: none;
                                  background: #f5f7fa;
                                  padding: 0px 0px;
                                  cursor: pointer;
                                  font-size: 10px;
                                  color: #606266;
                                  border-bottom: 1px solid #dcdfe6;
                                "
                                @mouseover="
                                  Object.assign($event.target.style, {
                                    backgroundColor: '#409eff',
                                    color: 'white',
                                  })
                                "
                                @mouseout="
                                  Object.assign($event.target.style, {
                                    backgroundColor: '#f5f7fa',
                                    color: '#606266',
                                  })
                                "
                              >
                                ▲
                              </button>
                              <button
                                @click="decrementPalletNumber(row)"
                                style="
                                  border: none;
                                  background: #f5f7fa;
                                  padding: 0px 0px;
                                  cursor: pointer;
                                  font-size: 10px;
                                  color: #606266;
                                "
                                @mouseover="
                                  Object.assign($event.target.style, {
                                    backgroundColor: '#409eff',
                                    color: 'white',
                                  })
                                "
                                @mouseout="
                                  Object.assign($event.target.style, {
                                    backgroundColor: '#f5f7fa',
                                    color: '#606266',
                                  })
                                "
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="出荷日" width="85">
                      <template #default="{ row }">
                        {{ formatDate(row.shipping_date) }}
                      </template>
                    </el-table-column>
                    <el-table-column
                      label="納入先"
                      prop="destination_name"
                      min-width="120"
                      show-overflow-tooltip
                    />
                    <el-table-column
                      label="製品名"
                      prop="product_name"
                      min-width="120"
                      show-overflow-tooltip
                    >
                      <template #default="{ row }">
                        <div v-if="row.product_name && row.product_name.includes(',')">
                          <el-tooltip
                            placement="top-start"
                            :visible-arrow="false"
                            effect="dark"
                            :enterable="true"
                          >
                            <template #content>
                              <div class="pallet-detail-tooltip">
                                <h4 style="margin-top: 0; margin-bottom: 8px">混載パレット詳細</h4>
                                <table
                                  style="width: 100%; border-collapse: collapse; margin-bottom: 8px"
                                >
                                  <thead>
                                    <tr style="background-color: #f5f7fa">
                                      <th
                                        style="
                                          padding: 3px;
                                          text-align: left;
                                          border: 1px solid #ebeef5;
                                          color: #303133;
                                        "
                                      >
                                        製品名
                                      </th>
                                      <th
                                        style="
                                          padding: 3px;
                                          text-align: left;
                                          border: 1px solid #ebeef5;
                                          color: #303133;
                                        "
                                      >
                                        箱種
                                      </th>
                                      <th
                                        style="
                                          padding: 3px;
                                          text-align: right;
                                          border: 1px solid #ebeef5;
                                          color: #303133;
                                        "
                                      >
                                        箱数
                                      </th>
                                      <th
                                        style="
                                          padding: 3px;
                                          text-align: right;
                                          border: 1px solid #ebeef5;
                                          color: #303133;
                                        "
                                      >
                                        数量
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr v-for="(item, index) in row.detail" :key="index">
                                      <td
                                        style="
                                          padding: 3px;
                                          text-align: left;
                                          border: 1px solid #ebeef5;
                                        "
                                      >
                                        {{ item.product_name }}
                                      </td>
                                      <td
                                        style="
                                          padding: 3px;
                                          text-align: left;
                                          border: 1px solid #ebeef5;
                                        "
                                      >
                                        {{ item.box_type || '-' }}
                                      </td>
                                      <td
                                        style="
                                          padding: 3px;
                                          text-align: right;
                                          border: 1px solid #ebeef5;
                                        "
                                      >
                                        {{ item.confirmed_boxes }}
                                      </td>
                                      <td
                                        style="
                                          padding: 3px;
                                          text-align: right;
                                          border: 1px solid #ebeef5;
                                        "
                                      >
                                        {{ (item.confirmed_units || 0).toLocaleString() }}
                                      </td>
                                    </tr>
                                  </tbody>
                                  <tfoot>
                                    <tr style="background-color: #f5f7fa; font-weight: bold">
                                      <td
                                        style="
                                          padding: 3px;
                                          color: #303133;
                                          border: 1px solid #ebeef5;
                                        "
                                        colspan="2"
                                      >
                                        合計
                                      </td>
                                      <td
                                        style="
                                          padding: 1px;
                                          text-align: right;
                                          border: 1px solid #ebeef5;
                                          color: #303133;
                                        "
                                      >
                                        {{ row.confirmed_boxes }}
                                      </td>
                                      <td
                                        style="
                                          padding: 1px;
                                          text-align: right;
                                          border: 1px solid #ebeef5;
                                          color: #303133;
                                        "
                                      >
                                        {{ (row.confirmed_units || 0).toLocaleString() }}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </template>
                            <el-tag size="small" type="info">混載製品</el-tag>
                          </el-tooltip>
                        </div>
                        <div v-else>{{ row.product_name }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column label="箱種" width="70">
                      <template #default="{ row }">
                        {{ row.box_type || '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="箱数" width="50" align="right">
                      <template #default="{ row }">
                        {{ (row.confirmed_boxes || 0).toLocaleString() }}
                      </template>
                    </el-table-column>
                    <!-- <el-table-column label="数量" width="55" align="right">
                      <template #default="{ row }">
                        {{ (row.confirmed_units || 0).toLocaleString() }}
                      </template>
                    </el-table-column> -->
                    <!-- <el-table-column label="備考" min-width="90">
                      <template #default="{ row }">
                        <el-input v-model="row.remarks" placeholder="備考" />
                      </template>
                    </el-table-column> -->
                    <el-table-column label="詳細" width="50" fixed="right">
                      <template #default="{ row }">
                        <el-button
                          v-if="row.detail && row.detail.length > 1"
                          size="small"
                          type="info"
                          circle
                          @click="showPalletDetail(row)"
                        >
                          <el-icon>
                            <InfoFilled />
                          </el-icon>
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false" size="default" class="cancel-btn">
          <el-icon>
            <Close />
          </el-icon>
          キャンセル
        </el-button>
        <el-button
          type="primary"
          @click="submitShipping"
          :disabled="submitDisabled"
          :loading="loading.submit"
          size="default"
          class="submit-btn"
        >
          <el-icon>
            <Check />
          </el-icon>
          出荷Noを保存
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- パレット編集ダイアログ -->
  <el-dialog
    v-model="palletEditDialogVisible"
    title="パレット詳細"
    width="95%"
    top="2vh"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    class="pallet-edit-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-left">
          <el-icon class="header-icon" style="color: #409eff">
            <View />
          </el-icon>
          <span class="header-title">パレット詳細</span>
        </div>
        <div class="header-stats">
          <el-tag type="primary" size="small" effect="light">
            総パレット数: {{ pallets.length }}件
          </el-tag>
        </div>
      </div>
    </template>

    <div class="pallet-edit-content">
      <el-table
        :data="pallets"
        border
        stripe
        style="width: 100%"
        height="600px"
        class="view-pallets-table"
        size="default"
      >
        <!-- パレット番号 - 編集可能 -->
        <el-table-column label="パレット番号" width="200" fixed="left">
          <template #default="{ row, $index }">
            <div class="pallet-number-editor">
              <span class="prefix-label">{{ row.shipping_no_prefix }}</span>
              <div class="serial-input-group">
                <el-input
                  v-model="row.shipping_no_serial"
                  placeholder="序列号"
                  class="serial-input"
                  size="small"
                  @input="validatePalletSerial($index)"
                />
                <div class="serial-controls">
                  <el-button
                    size="small"
                    type="primary"
                    class="serial-btn serial-btn-up"
                    @click="incrementSerial(row, $index)"
                    :icon="ArrowUp"
                  />
                  <el-button
                    size="small"
                    type="primary"
                    class="serial-btn serial-btn-down"
                    @click="decrementSerial(row, $index)"
                    :icon="ArrowDown"
                  />
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 出荷日 - 只读显示 -->
        <el-table-column label="出荷日" width="150">
          <template #default="{ row }">
            <div class="read-only-field">
              <el-icon class="field-icon"><Calendar /></el-icon>
              <span class="field-value">{{ row.shipping_date || '-' }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 納入先 - 只读显示 -->
        <el-table-column label="納入先" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="read-only-field">
              <el-icon class="field-icon"><Location /></el-icon>
              <span class="field-value">{{ getDestinationName(row.destination_cd) || '-' }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 製品名 - 只读显示 -->
        <el-table-column label="製品名" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="product-display">
              <div v-if="row.product_name && row.product_name.includes(',')">
                <el-tag size="small" type="success" effect="light" class="mixed-product-tag">
                  <el-icon><Box /></el-icon>
                  混載製品 ({{ row.detail ? row.detail.length : 1 }}種)
                </el-tag>
                <div class="product-list">
                  {{ row.product_name.split(',').slice(0, 2).join(', ') }}
                  <span v-if="row.product_name.split(',').length > 2" class="more-indicator"
                    >...</span
                  >
                </div>
              </div>
              <div v-else class="single-product">
                <el-icon class="product-icon"><Box /></el-icon>
                <span>{{ row.product_name || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 箱種 - 只读显示 -->
        <el-table-column label="箱種" width="110">
          <template #default="{ row }">
            <el-tag
              :type="getBoxTypeTagType(row.box_type)"
              size="small"
              effect="light"
              class="box-type-tag"
            >
              {{ row.box_type || '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 箱数 - 只读显示 -->
        <el-table-column label="箱数" width="110">
          <template #default="{ row }">
            <div class="read-only-field number-field">
              <el-icon class="field-icon"><Box /></el-icon>
              <span class="field-value">{{ row.confirmed_boxes || 0 }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 数量 - 只读显示 -->
        <el-table-column label="数量" width="120">
          <template #default="{ row }">
            <div class="read-only-field number-field">
              <el-icon class="field-icon"><DataLine /></el-icon>
              <span class="field-value">{{ formatNumber(row.confirmed_units) || 0 }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 備考 - 只读显示 -->
        <el-table-column label="備考" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="read-only-field remarks-field">
              <el-icon class="field-icon"><Document /></el-icon>
              <span class="field-value">{{ row.remarks || '-' }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 - 简化操作 -->
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row, $index }">
            <el-button-group>
              <el-button size="small" type="info" @click="showPalletDetail(row)" title="詳細表示">
                <el-icon><InfoFilled /></el-icon>
              </el-button>
              <el-button
                size="small"
                type="primary"
                @click="duplicatePallet(row, $index)"
                title="複製"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="deletePallet($index)"
                :disabled="pallets.length <= 1"
                title="削除"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="palletEditDialogVisible = false" size="default">
          <el-icon><Close /></el-icon>
          閉じる
        </el-button>
        <el-button type="primary" @click="applyPalletChanges" size="default">
          <el-icon><Check /></el-icon>
          パレット番号を保存
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 納入先選択ダイアログ -->
  <el-dialog
    v-model="destinationDialogVisible"
    title="納入先選択"
    width="800px"
    class="modern-dialog destination-dialog"
  >
    <div class="destination-select-container">
      <div class="destination-dialog-header">
        <el-input
          v-model="destinationSearch"
          placeholder="納入先を検索"
          clearable
          class="destination-search-input"
          size="small"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-radio-group v-model="destinationSortOrder" size="small">
          <el-radio-button label="code">コード順</el-radio-button>
          <el-radio-button label="name">名称順</el-radio-button>
        </el-radio-group>
      </div>

      <div class="destination-buttons-grid">
        <el-button
          v-for="dest in filteredSortedDestinations"
          :key="dest.value"
          :type="selectedDestinations.includes(dest.value) ? 'primary' : 'default'"
          @click="toggleDestination(dest.value)"
          class="destination-button"
          :class="{ selected: selectedDestinations.includes(dest.value) }"
        >
          <div class="destination-code">{{ dest.value }}</div>
          <div class="destination-name">{{ dest.label.split(' - ')[1] || dest.label }}</div>
          <div class="check-overlay">
            <el-icon><Check /></el-icon>
          </div>
        </el-button>
      </div>
      <el-empty
        v-if="filteredSortedDestinations.length === 0"
        description="該当する納入先がありません"
        :image-size="80"
      />
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="clearDestinations" class="reset-button" size="default">
          全てクリア
        </el-button>
        <el-button @click="selectAllDestinations" class="select-all-button" size="default">
          全て選択
        </el-button>
        <el-button
          type="primary"
          @click="confirmDestinationSelection"
          class="confirm-button"
          size="default"
        >
          <el-icon><Check /></el-icon>
          選択 ({{ selectedDestinations.length }})
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Delete,
  Right,
  Calendar,
  Location,
  Box,
  List,
  Select,
  Finished,
  Clock,
  InfoFilled,
  MagicStick,
  Setting,
  Close,
  Check,
  DataBoard,
  Goods,
  Warning,
  Document,
  ShoppingCart,
  ShoppingCartFull,
  DocumentRemove,
  CircleCheck,
  View,
  DataLine,
  Edit,
  CopyDocument,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Search,
} from '@element-plus/icons-vue'

const props = defineProps({ baseItem: Object })
const emit = defineEmits(['close', 'submitted'])

// 状态变量
const visible = ref(true)
const loading = ref({
  orders: false,
  submit: false,
})

// 日期设置
const shippingDate = ref(new Date().toISOString().slice(0, 10))

// 筛选条件
const filters = ref({
  dateRange: [new Date().toISOString().slice(0, 10), new Date().toISOString().slice(0, 10)],
  destinationCd: '',
})

// 納入先選択
const destinationDialogVisible = ref(false)
const selectedDestinations = ref([])
const destinationSearch = ref('')
const destinationSortOrder = ref('code')

// 托盘设置
const settings = ref({
  unitsPerBox: 20, // 每箱产品数量
  optimizationMethod: 'heuristic', // 默认使用启发式算法
})

// 不同箱种的托盘设置
const boxSettings = ref({
  小箱: 32,
  大箱: 18,
  TP箱: 20,
  段ボール: 40,
  加工箱: 18,
  default: 40, // 默认值
})

// 优化算法选项
const optimizationOptions = [
  { label: '欲張り法 (優化版)', value: 'heuristic' },
  // { label: '欲張り法 (高速)', value: 'greedy' },
  { label: '遺伝的アルゴリズム (優化版)', value: 'genetic' },
  { label: '従来割当て (オリジナル)', value: 'original' },
  { label: '条件分解のみ (組合せなし)', value: 'decompose_only' },
]

// 数据源
const dailyOrders = ref([])
const selectedRows = ref([])
const selectedItems = ref([])
const pallets = ref([])
const shippedIdentifiers = ref(new Set())

// 数据定义 - 添加到 ref 部分
const palletEditDialogVisible = ref(false)

// 选项列表
const destinationOptions = ref([])

// 计算属性
const filteredOrders = computed(() => {
  // 确保dailyOrders.value是一个数组
  if (!Array.isArray(dailyOrders.value)) {
    console.warn('dailyOrders不是数组:', dailyOrders.value)
    return []
  }

  // 添加日志以便调试
  // console.log('filteredOrders计算属性被调用，当前dailyOrders长度:', dailyOrders.value.length)
  // console.log('dailyOrders.value 样本数据:', dailyOrders.value.slice(0, 3))

  // 检查数据结构
  if (dailyOrders.value.length > 0) {
    // console.log('第一条数据的完整结构:', JSON.stringify(dailyOrders.value[0], null, 2))
  }

  // 过滤掉箱数小于等于0的订单
  const filtered = dailyOrders.value.filter((order) => {
    const boxes = Number(order.confirmed_boxes) || 0
    return boxes > 0
  })

  // console.log(`过滤后的订单数量: ${filtered.length} (原始: ${dailyOrders.value.length})`)
  return filtered
})

// 计算可用订单数量
const availableOrdersCount = computed(() => {
  // 在这里计算可用的订单，用于头部标签显示
  return dailyOrders.value.filter((order) => {
    const isProcessed = !!order.shipping_no
    const identifier = `${order.product_cd}-${order.destination_cd}-${formatShippingDate(order)}`
    const isShipped = shippedIdentifiers.value && shippedIdentifiers.value.has(identifier)
    return !isProcessed && !isShipped
  }).length
})

const totalSelectedUnits = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + (item.confirmed_units || 0), 0)
})

const totalAllocated = computed(() => {
  return pallets.value.reduce((sum, pallet) => sum + (pallet.confirmed_units || 0), 0)
})

const submitDisabled = computed(() => {
  return (
    selectedItems.value.length === 0 ||
    pallets.value.length === 0 ||
    totalAllocated.value !== totalSelectedUnits.value ||
    !shippingDate.value
  )
})

// 納入先筛选和排序
const filteredSortedDestinations = computed(() => {
  let options = [...destinationOptions.value]

  // 検索
  if (destinationSearch.value) {
    const searchTerm = destinationSearch.value.toLowerCase()
    options = options.filter(
      (opt) =>
        opt.value.toLowerCase().includes(searchTerm) ||
        opt.label.toLowerCase().includes(searchTerm),
    )
  }

  // ソート
  if (destinationSortOrder.value === 'name') {
    options.sort((a, b) => {
      const nameA = a.label.split(' - ')[1] || a.label
      const nameB = b.label.split(' - ')[1] || b.label
      return nameA.localeCompare(nameB, 'ja')
    })
  } else {
    // デフォルトはコード順
    options.sort((a, b) => a.value.localeCompare(b.value))
  }

  return options
})

// 监听器
onMounted(() => {
  if (props.baseItem) {
    // 如果有初始项目，添加到已选择项目中
    addToSelectedItems([props.baseItem])
  }

  // 加载初始数据
  fetchDestinationOptions()
  fetchDailyOrders() // `fetchDailyOrders` 内部会先获取shipped items
})

watch(
  () => selectedItems.value,
  () => {
    if (selectedItems.value.length > 0) {
      recalculatePallets()
    } else {
      pallets.value = []
    }
  },
  { deep: true },
)

// 方法
function resetFilters() {
  filters.value = {
    dateRange: [new Date().toISOString().slice(0, 10), new Date().toISOString().slice(0, 10)],
    destinationCd: '',
  }
  selectedDestinations.value = []
  fetchDailyOrders()
}

// 日期快捷操作
function adjustDateRange(days) {
  const currentStart = filters.value.dateRange[0]
    ? new Date(filters.value.dateRange[0])
    : new Date()
  const currentEnd = filters.value.dateRange[1] ? new Date(filters.value.dateRange[1]) : new Date()

  currentStart.setDate(currentStart.getDate() + days)
  currentEnd.setDate(currentEnd.getDate() + days)

  filters.value.dateRange = [
    currentStart.toISOString().split('T')[0],
    currentEnd.toISOString().split('T')[0],
  ]

  onFilterChange()
}

function setToday() {
  const today = new Date().toISOString().split('T')[0]
  filters.value.dateRange = [today, today]
  onFilterChange()
}

// 納入先選択関連
function getDestinationLabel(code) {
  const dest = destinationOptions.value.find((d) => d.value === code)
  return dest ? `${dest.value} - ${dest.label}` : code
}

function toggleDestination(code) {
  const index = selectedDestinations.value.indexOf(code)
  if (index > -1) {
    selectedDestinations.value.splice(index, 1)
  } else {
    selectedDestinations.value.push(code)
  }
}

function clearDestinations() {
  selectedDestinations.value = []
}

function selectAllDestinations() {
  selectedDestinations.value = destinationOptions.value.map((dest) => dest.value)
}

function confirmDestinationSelection() {
  // 更新筛选条件
  if (selectedDestinations.value.length === 0) {
    filters.value.destinationCd = ''
  } else if (selectedDestinations.value.length === 1) {
    filters.value.destinationCd = selectedDestinations.value[0]
  } else {
    // 多选时，将所有选中的纳入先用逗号连接
    filters.value.destinationCd = selectedDestinations.value.join(',')
  }

  destinationDialogVisible.value = false

  // 自动执行搜索
  onFilterChange()
}

// 筛选条件变化时自动筛选
function onFilterChange() {
  // 只有当日期范围有值时才自动筛选
  if (filters.value.dateRange && filters.value.dateRange[0]) {
    fetchDailyOrders()
  }
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '未設定'

  try {
    const date = new Date(dateStr)
    return date
      .toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\//g, '-')
  } catch (e) {
    return dateStr
  }
}

// 格式化日期为YYYYMMDD格式，确保包含完整的年月日
function formatDateToYYYYMMDD(dateStr) {
  // console.log('formatDateToYYYYMMDD 输入:', dateStr)

  if (!dateStr) {
    // console.warn('formatDateToYYYYMMDD: 输入为空')
    return ''
  }

  // 如果输入已经是YYYYMMDD格式，直接返回
  if (/^\d{8}$/.test(dateStr)) {
    // console.log('formatDateToYYYYMMDD: 已经是YYYYMMDD格式:', dateStr)
    return dateStr
  }

  // 如果是YYYY-MM-DD格式，直接替换连字符
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const result = dateStr.replace(/-/g, '')
    // console.log('formatDateToYYYYMMDD: YYYY-MM-DD格式转换为:', result)
    return result
  }

  // 处理"未設定"或其他特殊值
  if (dateStr === '未設定') {
    // 使用当前日期作为默认值
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const result = `${year}${month}${day}`
    // console.log('formatDateToYYYYMMDD: 未設定，使用当前日期:', result)
    return result
  }

  // 尝试解析日期
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      console.warn('formatDateToYYYYMMDD: 无效的日期:', dateStr)

      // 尝试从filters中获取当前选择的日期范围的开始日期
      if (filters.value && filters.value.dateRange && filters.value.dateRange[0]) {
        const fallbackDate = filters.value.dateRange[0].replace(/-/g, '')
        // console.log('formatDateToYYYYMMDD: 使用筛选器日期作为后备:', fallbackDate)
        return fallbackDate
      }

      // 使用当前日期作为最后的后备
      const today = new Date()
      const result = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
      // console.log('formatDateToYYYYMMDD: 使用当前日期作为后备:', result)
      return result
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    const result = `${year}${month}${day}`
    // console.log('formatDateToYYYYMMDD: 从Date对象生成:', result)
    return result
  } catch (e) {
    console.error('formatDateToYYYYMMDD: 格式化日期出错:', e)

    // 使用当前日期作为后备
    const today = new Date()
    const result = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    // console.log('formatDateToYYYYMMDD: 出错后使用当前日期:', result)
    return result
  }
}

// 专门用于托盘编号生成的日期格式化方法
function formatShippingDateForPallet(item) {
  console.log('formatShippingDateForPallet 输入项目:', item)
  console.log('项目的shipping_date字段:', item.shipping_date)
  console.log('项目的year字段:', item.year)
  console.log('项目的month字段:', item.month)
  console.log('项目的day字段:', item.day)

  // 优先使用shipping_date字段
  if (item.shipping_date && item.shipping_date !== '未設定') {
    const result = formatDateToYYYYMMDD(item.shipping_date)
    console.log(`使用shipping_date: ${item.shipping_date} -> ${result}`)
    return result
  }

  // 如果没有shipping_date，尝试从year、month、day字段组合
  if (item.year && item.month && item.day) {
    const year = item.year
    const month = String(item.month).padStart(2, '0')
    const day = String(item.day).padStart(2, '0')
    const result = `${year}${month}${day}`
    console.log(`使用year/month/day: ${year}/${month}/${day} -> ${result}`)
    return result
  }

  // 最后的后备方案：使用当前日期
  const today = new Date()
  const result = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  console.log(`使用当前日期作为后备: ${result}`)
  return result
}

// 从year、month、day字段组合出荷日期
function formatShippingDate(row) {
  if (!row) {
    return '未設定'
  }

  // 优先使用shipping_date字段（如果存在且有效）
  if (row.shipping_date && row.shipping_date !== '未設定') {
    return formatDate(row.shipping_date)
  }

  // 如果没有shipping_date字段，尝试使用year、month、day字段组合
  if (row.year && row.month && row.day) {
    const year = row.year
    const month = String(row.month).padStart(2, '0')
    const day = String(row.day).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return '未設定'
}

// 获取目的地名称（用于只读显示）
function getDestinationName(destinationCd) {
  if (!destinationCd) return ''

  const destination = destinationOptions.value.find((dest) => dest.value === destinationCd)
  return destination ? destination.label : destinationCd
}

// 获取箱种标签类型（用于只读显示）
function getBoxTypeTagType(boxType) {
  switch (boxType) {
    case '小箱':
      return 'success'
    case '大箱':
      return 'primary'
    case 'TP箱':
      return 'warning'
    case '段ボール':
      return 'danger'
    case '加工箱':
      return 'danger'
    default:
      return 'info'
  }
}

// 格式化数字显示（用于只读显示）
function formatNumber(number) {
  if (number == null || number === '') return ''
  return Number(number).toLocaleString()
}

// 增加序列号
function incrementSerial(row, index) {
  const currentSerial = parseInt(row.shipping_no_serial) || 0
  row.shipping_no_serial = String(currentSerial + 1).padStart(2, '0')
  validatePalletSerial(index)
}

// 减少序列号
function decrementSerial(row, index) {
  const currentSerial = parseInt(row.shipping_no_serial) || 0
  if (currentSerial > 1) {
    row.shipping_no_serial = String(currentSerial - 1).padStart(2, '0')
    validatePalletSerial(index)
  }
}

// 获取已创建的出货项目
async function fetchShippedItems() {
  if (!filters.value.dateRange || !filters.value.dateRange[0]) return

  // 确保在开始时是一个有效的 Set
  shippedIdentifiers.value = new Set()

  try {
    const res = await request.get('/api/shipping/items', {
      params: {
        startDate: filters.value.dateRange[0],
        endDate: filters.value.dateRange[1],
      },
    })

    let items = []
    if (res && res.success === true && Array.isArray(res.data)) {
      items = res.data
    }

    const identifiers = items.map(
      (item) => `${item.product_cd}-${item.destination_cd}-${item.shipping_date}`,
    )
    shippedIdentifiers.value = new Set(identifiers)
    // console.log('Fetched shipped identifiers:', shippedIdentifiers.value)
  } catch (error) {
    console.error('Failed to fetch shipped items:', error)
    // 即使出错，也确保shippedIdentifiers是一个有效的Set
    shippedIdentifiers.value = new Set()
  }
}

// 获取日订单数据
async function fetchDailyOrders() {
  if (!filters.value.dateRange || !filters.value.dateRange[0]) {
    ElMessage.warning('注文日の範囲を選択してください')
    return
  }

  loading.value.orders = true
  dailyOrders.value = [] // 清空现有数据

  try {
    // 先获取已出货项目信息
    await fetchShippedItems()

    // console.log('开始获取日订单数据，参数:', {
    //   startDate: filters.value.dateRange[0],
    //   endDate: filters.value.dateRange[1],
    //   destination_cd: filters.value.destinationCd,
    // })

    // 使用原来的API获取订单数据
    const res = await request.get('/api/order/daily/list', {
      params: {
        startDate: filters.value.dateRange[0],
        endDate: filters.value.dateRange[1],
        destination_cd: filters.value.destinationCd,
        pageSize: 1000,
      },
    })

    // console.log('获取到订单数据响应:', res)
    // console.log('响应的类型:', typeof res)
    // console.log('响应的success字段:', res?.success)
    // console.log('响应的data字段:', res?.data)
    // console.log('响应的data.list字段:', res?.data?.list)

    let processedData = []

    // 处理响应数据
    if (res && res.success === true && res.data && res.data.list) {
      processedData = res.data.list
      // console.log(
      //   '✓ 匹配条件1: 获取到数据列表, 长度:',
      //   processedData.length,
      //   '总数:',
      //   res.data.total,
      // )
    } else if (res && res.success === true && Array.isArray(res.data)) {
      processedData = res.data
      // console.log('✓ 匹配条件2: 获取到数据数组, 长度:', processedData.length)
    } else if (res && Array.isArray(res)) {
      processedData = res
      // console.log('✓ 匹配条件3: 直接获取到数组, 长度:', processedData.length)
    } else if (res && res.list && Array.isArray(res.list)) {
      // 新增：处理直接返回 {list: [...], total: 133} 格式
      processedData = res.list
      // console.log(
      //   '✓ 匹配条件4: 获取到list字段数据, 长度:',
      //   processedData.length,
      //   '总数:',
      //   res.total,
      // )
    } else {
      console.error('❌ 返回的数据格式不正确:', res)
      console.error('条件检查:')
      console.error('- res:', !!res)
      console.error('- res.success === true:', res?.success === true)
      console.error('- res.data:', !!res?.data)
      console.error('- res.data.list:', !!res?.data?.list)
      console.error('- res.list:', !!res?.list)
      console.error('- Array.isArray(res.list):', Array.isArray(res?.list))
      console.error('- Array.isArray(res.data):', Array.isArray(res?.data))
      console.error('- Array.isArray(res):', Array.isArray(res))
    }

    // 检查返回的数据中是否有硬编码的2025年日期
    if (processedData.length > 0) {
      // 不再对2025年进行特殊处理，保持原始数据
      console.log('获取到订单数据，数量:', processedData.length)
    }

    // 设置数据
    dailyOrders.value = processedData
    // console.log('最终设置的dailyOrders:', dailyOrders.value.length, dailyOrders.value)

    // 检查是否有数据
    if (dailyOrders.value.length === 0) {
      ElMessage.info('この期間内に利用可能な注文データがありません')
    } else {
      ElMessage.success(`${dailyOrders.value.length} 件の注文データを取得しました`)
    }
  } catch (error) {
    console.error('获取日订单数据失败:', error)
    ElMessage.error('日次オーダーデータの取得に失敗しました: ' + (error.message || '不明なエラー'))
    dailyOrders.value = []
  } finally {
    loading.value.orders = false
  }
}

// 获取纳入先选项
async function fetchDestinationOptions() {
  try {
    // 直接使用axios请求接口
    const response = await request.get('/api/master/options/destination-options')
    // console.log('获取到的纳入先选项原始数据:', response)

    // 后端返回的数据格式是 { success: true, data: Array }
    if (response && response.success === true && Array.isArray(response.data)) {
      destinationOptions.value = response.data.map((item) => ({
        value: item.cd,
        label: `${item.cd} - ${item.name}`,
      }))
      // console.log('处理后的纳入先选项:', destinationOptions.value)
    } else if (response && Array.isArray(response)) {
      // 直接返回数组的情况
      destinationOptions.value = response.map((item) => ({
        value: item.cd,
        label: `${item.cd} - ${item.name}`,
      }))
      // console.log('处理后的纳入先选项(数组格式):', destinationOptions.value)
    } else {
      console.error('納入先オプションデータ格式不正确:', response)
    }
  } catch (error) {
    console.error('获取纳入先选项失败:', error)
    ElMessage.error('納入先オプションの取得に失敗しました')
  }
}

// 表格选择变更
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 检查项目是否已被选择
function isItemSelected(item) {
  return selectedItems.value.some(
    (selected) =>
      selected.product_cd === item.product_cd &&
      selected.destination_cd === item.destination_cd &&
      formatShippingDate(selected) === formatShippingDate(item),
  )
}

// 检查项目是否已在右侧表格中（防重复添加）- 增强版本
function isItemInRightTable(item) {
  // 使用更严格的重复检查
  const itemKey = generateItemKey(item)
  return selectedItems.value.some((selected) => {
    const selectedKey = generateItemKey(selected)
    return selectedKey === itemKey
  })
}

// 生成项目唯一标识符
function generateItemKey(item) {
  const formattedDate = formatShippingDate(item)
  // 使用更多字段确保唯一性，包括可能的批次信息
  return `${item.product_cd || ''}-${item.destination_cd || ''}-${formattedDate}-${item.lot_no || ''}-${item.order_no || ''}`
}

// 检查是否存在完全相同的项目（包括数量）
function isDuplicateItem(newItem, existingItem) {
  return (
    newItem.product_cd === existingItem.product_cd &&
    newItem.destination_cd === existingItem.destination_cd &&
    formatShippingDate(newItem) === formatShippingDate(existingItem) &&
    newItem.confirmed_boxes === existingItem.confirmed_boxes &&
    newItem.confirmed_units === existingItem.confirmed_units &&
    (newItem.lot_no || '') === (existingItem.lot_no || '') &&
    (newItem.order_no || '') === (existingItem.order_no || '')
  )
}

// 控制行是否可选
function isRowSelectable(row) {
  // 如果shippedIdentifiers还未加载，则默认不可选
  if (!shippedIdentifiers.value) return false

  // 如果shipping_no有值，则不可选
  if (row.shipping_no) return false

  // 使用新的重复检查逻辑
  if (isItemInRightTable(row)) return false

  // 检查是否在已出货标识符集合中
  const identifier = `${row.product_cd}-${row.destination_cd}-${formatShippingDate(row)}`
  if (shippedIdentifiers.value.has(identifier)) return false

  return true
}

function tableRowClassName({ row }) {
  // 确保shippedIdentifiers已加载
  if (!shippedIdentifiers.value) return ''

  // 如果shipping_no有值，添加特殊样式
  if (row.shipping_no) {
    return 'processed-row'
  }

  // 使用新的重复检查逻辑
  if (isItemInRightTable(row)) {
    return 'selected-row'
  }

  // 检查是否在已出货标识符集合中
  const identifier = `${row.product_cd}-${row.destination_cd}-${formatShippingDate(row)}`
  if (shippedIdentifiers.value.has(identifier)) {
    return 'shipped-row'
  }

  return ''
}

const getSummaries = (param) => {
  const { columns, data } = param
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合計'
      return
    }

    // 检查列标题是否为"箱数"或"数量"
    const columnLabel = column.label
    const isSummable =
      columnLabel === '箱数' ||
      columnLabel === '数量' ||
      column.property === 'confirmed_boxes' ||
      column.property === 'confirmed_units'

    if (isSummable) {
      // 根据列名获取正确的属性名
      let propertyName = column.property
      if (!propertyName) {
        if (columnLabel === '箱数') {
          propertyName = 'confirmed_boxes'
        } else if (columnLabel === '数量') {
          propertyName = 'confirmed_units'
        }
      }

      if (propertyName) {
        const columnValues = data.map((item) => Number(item?.[propertyName] || 0))
        if (!columnValues.length || columnValues.every((value) => isNaN(value))) {
          sums[index] = '0'
        } else {
          const sum = columnValues.reduce((prev, curr) => {
            const value = Number(curr)
            return isNaN(value) ? prev : prev + curr
          }, 0)
          sums[index] = sum.toLocaleString()
        }
      } else {
        sums[index] = ''
      }
    } else {
      sums[index] = ''
    }
  })

  return sums
}

// 获取产品箱种信息
async function getProductBoxType(productCd) {
  try {
    const response = await request.get(`/api/master/products/detail/${productCd}`)
    if (response && response.success === true && response.data) {
      return response.data.box_type || '-'
    } else if (response && response.box_type) {
      return response.box_type
    }
    return '-'
  } catch (error) {
    console.error('获取产品箱种信息失败:', error)
    return '-'
  }
}

// 批量获取产品箱种信息
async function getProductBoxTypes(productCds) {
  if (!productCds || productCds.length === 0) return {}

  // console.log('开始获取产品箱种信息，产品代码:', productCds)
  const boxTypeMap = {}

  // 1. 尝试批量获取
  try {
    // console.log('尝试批量获取箱种信息...')
    // 使用产品批量查询接口
    const response = await request.post('/api/master/products/query', {
      product_cds: productCds,
    })
    // console.log('批量获取箱种响应:', response)

    if (response && response.success === true && Array.isArray(response.data)) {
      response.data.forEach((product) => {
        if (product.product_cd) {
          boxTypeMap[product.product_cd] = product.box_type || null
          // console.log(`产品 ${product.product_cd} 的箱种: ${product.box_type}`)
        }
      })
    } else if (response && Array.isArray(response)) {
      response.forEach((product) => {
        if (product.product_cd) {
          boxTypeMap[product.product_cd] = product.box_type || null
          // console.log(`产品 ${product.product_cd} 的箱种: ${product.box_type}`)
        }
      })
    } else {
      throw new Error('批量接口返回格式不正确')
    }
  } catch (error) {
    console.error('批量获取产品箱种信息失败, 启动回退机制:', error)
    // 2. 如果批量获取失败，则逐个获取
    try {
      for (const productCd of productCds) {
        try {
          // console.log(`尝试获取产品 ${productCd} 的箱种信息...`)
          // 使用产品详情API
          const response = await request.get(`/api/master/products/detail/${productCd}`)
          // console.log(`产品 ${productCd} 的响应:`, response)

          if (response && response.success && response.data) {
            boxTypeMap[productCd] = response.data.box_type || null
          } else if (response && response.box_type) {
            boxTypeMap[productCd] = response.box_type || null
          } else {
            boxTypeMap[productCd] = null
          }
          // console.log(`产品 ${productCd} 的箱种设置为: ${boxTypeMap[productCd]}`)
        } catch (innerError) {
          console.error(`获取产品 ${productCd} 信息失败:`, innerError)
          boxTypeMap[productCd] = null
        }
      }
    } catch (fallbackError) {
      console.error('逐个获取产品信息失败:', fallbackError)
    }
  }

  // console.log('最终获取到的箱种映射:', boxTypeMap)
  return boxTypeMap
}

// 添加单个或多个项目到右侧池子
async function addToSelectedItems(items) {
  if (!Array.isArray(items) || items.length === 0) return

  console.log('🔍 开始添加项目到右侧池子，项目数量:', items.length)

  // 第一层过滤：基本条件检查
  const basicFilteredItems = items.filter((item) => {
    // 检查是否已有shipping_no（已处理）
    if (item.shipping_no) {
      console.log(`❌ 项目已处理 (shipping_no: ${item.shipping_no}):`, item.product_cd)
      return false
    }
    return true
  })

  console.log('✅ 基本过滤后的项目数量:', basicFilteredItems.length)

  // 第二层过滤：重复检查
  const duplicateCheckedItems = []
  const duplicateItems = []
  const alreadyExistingItems = []

  for (const item of basicFilteredItems) {
    const itemKey = generateItemKey(item)

    // 检查是否已在右侧池子中
    const existingItem = selectedItems.value.find((selected) => {
      return generateItemKey(selected) === itemKey
    })

    if (existingItem) {
      // 进一步检查是否完全重复（包括数量）
      if (isDuplicateItem(item, existingItem)) {
        console.log(`⚠️  完全重复的项目:`, item.product_cd, '-', item.destination_name)
        duplicateItems.push({
          item,
          reason: '完全重复（产品、目的地、日期、数量都相同）',
        })
      } else {
        console.log(`⚠️  相似项目已存在:`, item.product_cd, '-', item.destination_name)
        alreadyExistingItems.push({
          item,
          existing: existingItem,
          reason: '相同产品和目的地已存在，但数量不同',
        })
      }
      continue
    }

    // 检查在当前批次中是否有重复
    const duplicateInBatch = duplicateCheckedItems.find((checkedItem) => {
      return generateItemKey(checkedItem) === itemKey
    })

    if (duplicateInBatch) {
      console.log(`⚠️  批次内重复项目:`, item.product_cd, '-', item.destination_name)
      duplicateItems.push({
        item,
        reason: '在当前选择的批次中重复',
      })
      continue
    }

    // 通过所有检查，添加到待处理列表
    duplicateCheckedItems.push(item)
  }

  console.log('✅ 重复检查后的有效项目数量:', duplicateCheckedItems.length)
  console.log('⚠️  重复项目数量:', duplicateItems.length)
  console.log('⚠️  已存在相似项目数量:', alreadyExistingItems.length)

  // 显示重复检查结果
  if (duplicateItems.length > 0 || alreadyExistingItems.length > 0) {
    let warningMessage = ''

    if (duplicateItems.length > 0) {
      warningMessage += `${duplicateItems.length} 件の重複項目をスキップしました。`
    }

    if (alreadyExistingItems.length > 0) {
      if (warningMessage) warningMessage += '\n'
      warningMessage += `${alreadyExistingItems.length} 件の類似項目が既に存在します。`
    }

    ElMessage.warning({
      message: warningMessage,
      duration: 4000,
      showClose: true,
    })

    // 在控制台显示详细信息
    if (duplicateItems.length > 0) {
      console.group('🔍 重复项目详情:')
      duplicateItems.forEach(({ item, reason }) => {
        console.log(`• ${item.product_cd} - ${item.destination_name}: ${reason}`)
      })
      console.groupEnd()
    }

    if (alreadyExistingItems.length > 0) {
      console.group('🔍 已存在相似项目详情:')
      alreadyExistingItems.forEach(({ item, existing, reason }) => {
        console.log(`• ${item.product_cd} - ${item.destination_name}:`)
        console.log(`  新项目: ${item.confirmed_boxes}箱/${item.confirmed_units}个`)
        console.log(`  现有项目: ${existing.confirmed_boxes}箱/${existing.confirmed_units}个`)
        console.log(`  原因: ${reason}`)
      })
      console.groupEnd()
    }
  }

  // 如果没有有效项目，直接返回
  if (duplicateCheckedItems.length === 0) {
    if (duplicateItems.length > 0 || alreadyExistingItems.length > 0) {
      ElMessage.info('選択された項目はすべて処理済みまたは追加済みです。')
    }
    return
  }

  // 继续处理有效项目
  const itemsToAdd = duplicateCheckedItems

  loading.value.orders = true
  let boxTypeMap = {}
  const missingBoxTypeProducts = []

  try {
    const productCds = [...new Set(itemsToAdd.map((item) => item.product_cd).filter(Boolean))]
    console.log('📦 需要获取箱种信息的产品:', productCds.length, '个')

    if (productCds.length > 0) {
      // 使用API获取所有产品信息
      const productsRes = await request.get('/api/master/products', {
        params: {
          product_cds: productCds.join(','),
          pageSize: 1000,
        },
      })

      let products = []
      if (
        productsRes &&
        productsRes.success === true &&
        productsRes.data &&
        productsRes.data.list
      ) {
        products = productsRes.data.list
      } else if (productsRes && productsRes.success === true && Array.isArray(productsRes.data)) {
        products = productsRes.data
      } else if (productsRes && Array.isArray(productsRes)) {
        products = productsRes
      } else if (productsRes && productsRes.list && Array.isArray(productsRes.list)) {
        products = productsRes.list
      } else {
        console.error('❌ 产品API响应格式不正确:', productsRes)
      }

      // 构建产品信息映射
      products.forEach((product) => {
        if (product.product_cd) {
          boxTypeMap[product.product_cd] = product.box_type || '-'
        }
      })

      // 检查哪些产品没有获取到箱种信息
      productCds.forEach((cd) => {
        if (!boxTypeMap[cd]) {
          missingBoxTypeProducts.push(cd)
        }
      })
    }

    if (missingBoxTypeProducts.length > 0) {
      console.warn('⚠️  以下产品未获取到箱种信息:', missingBoxTypeProducts)
      ElMessage.warning({
        message: `製品コード: ${missingBoxTypeProducts.join(', ')} の箱種情報を取得できませんでした。`,
        duration: 5000,
        showClose: true,
      })
    }
  } catch (error) {
    console.error('❌ 获取产品箱种信息时发生错误:', error)
    ElMessage.error('製品の箱種情報の取得に失敗しました。')
  } finally {
    loading.value.orders = false
  }

  // 映射新项目，即使没有箱种信息也继续添加
  const newItems = itemsToAdd.map((item) => {
    // 确保 confirmed_boxes 是有效的数字
    let boxes = item.confirmed_boxes
    if (typeof boxes !== 'number' || isNaN(boxes) || boxes <= 0) {
      boxes = 1 // 默认值
    }

    // 确保 confirmed_units 是有效的数字
    let units = item.confirmed_units
    if (typeof units !== 'number' || isNaN(units) || units <= 0) {
      units = settings.value.unitsPerBox * boxes // 默认值
    }

    // 优先使用原始数据中的box_type，如果没有则从产品信息API获取
    let boxType = item.box_type || boxTypeMap[item.product_cd] || '-'

    // 获取出荷日期，确保格式正确
    const formattedDate = formatShippingDate(item)

    const newItem = {
      ...item,
      shipping_date: formattedDate,
      original_units: units,
      original_boxes: boxes,
      confirmed_units: units,
      confirmed_boxes: boxes,
      box_type: boxType,
      id: generateItemKey(item), // 使用新的唯一标识符生成方法
    }

    console.log('✅ 创建新项目:', newItem.product_cd, '-', newItem.destination_name)
    return newItem
  })

  // 最终添加前的安全检查
  const finalItems = newItems.filter((newItem) => {
    const exists = selectedItems.value.some((existing) => existing.id === newItem.id)
    if (exists) {
      console.warn('⚠️  最终检查发现重复项目，跳过:', newItem.product_cd)
      return false
    }
    return true
  })

  console.log('✅ 最终添加到右侧池子的项目数量:', finalItems.length)
  selectedItems.value.push(...finalItems)

  if (finalItems.length > 0) {
    ElMessage.success(`${finalItems.length} 件の項目を追加しました`)
    // 添加后立即重新计算托盘分配
    recalculatePallets()
  }
}

// 添加已选择的项目
function addSelectedItems() {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('項目を選択してください。')
    return
  }

  // 显示重复检查统计信息
  const stats = getDuplicateStats(selectedRows.value)
  console.log('📊 重复检查统计:', stats)

  if (stats.valid === 0) {
    let message = '選択された項目はすべて追加できません：\n'
    if (stats.processed > 0) message += `• ${stats.processed} 件が処理済み\n`
    if (stats.exactDuplicates > 0) message += `• ${stats.exactDuplicates} 件が完全重複\n`
    if (stats.similarItems > 0) message += `• ${stats.similarItems} 件が類似項目として存在\n`
    if (stats.batchDuplicates > 0) message += `• ${stats.batchDuplicates} 件が選択内で重複\n`

    ElMessage.warning({
      message: message.trim(),
      duration: 5000,
      showClose: true,
    })
    return
  }

  if (stats.valid < stats.total) {
    const skippedCount = stats.total - stats.valid
    ElMessage.info({
      message: `${stats.total} 件中 ${stats.valid} 件を追加します。${skippedCount} 件をスキップします。`,
      duration: 3000,
    })
  }

  addToSelectedItems(selectedRows.value)
}

// 移除已选择的项目
function removeSelectedItem(item) {
  const index = selectedItems.value.findIndex((i) => i.id === item.id)
  if (index !== -1) {
    selectedItems.value.splice(index, 1)
    ElMessage.success('項目を削除しました')

    // 重新计算托盘分配
    if (selectedItems.value.length > 0) {
      recalculatePallets()
    } else {
      pallets.value = []
    }
  }
}

// 项目数量变更
function itemUnitsChanged(item) {
  // 根据数量更新箱数
  item.confirmed_boxes = Math.ceil(item.confirmed_units / settings.value.unitsPerBox)
  recalculatePallets()
}

// 项目箱数变更
function itemBoxesChanged(item) {
  // 根据箱数更新数量
  item.confirmed_units = item.confirmed_boxes * settings.value.unitsPerBox
  recalculatePallets()
}

// 重新计算托盘分配
function recalculatePallets() {
  // console.log('重新计算托盘分配开始', selectedItems.value)
  if (selectedItems.value.length === 0) {
    // console.log('没有选择的项目，不进行托盘分配')
    return
  }

  // 根据选择的优化方法进行托盘分配
  if (
    settings.value.optimizationMethod === 'heuristic' ||
    settings.value.optimizationMethod === 'greedy' ||
    settings.value.optimizationMethod === 'genetic' ||
    settings.value.optimizationMethod === 'decompose_only'
  ) {
    // 使用高级算法
    let algorithmName = '欲張り法'
    if (settings.value.optimizationMethod === 'genetic') {
      algorithmName = '遺伝的アルゴリズム'
    } else if (settings.value.optimizationMethod === 'decompose_only') {
      algorithmName = '条件分解のみ'
    }

    // 设置每种箱型的托盘容量
    const boxCapacitySettings = {
      小箱: boxSettings.value.小箱,
      大箱: boxSettings.value.大箱,
      TP箱: boxSettings.value.TP箱,
      段ボール: boxSettings.value.段ボール,
      加工箱: boxSettings.value.加工箱,
      default: boxSettings.value.default,
    }

    // 按照出荷日期和纳入先分组
    const groupedItems = {}
    selectedItems.value.forEach((item) => {
      // 确保shipping_date是有效值
      if (!item.shipping_date || item.shipping_date === '未設定') {
        console.warn(`项目 ${item.product_cd} 没有有效的出荷日期，使用当前日期`)
        item.shipping_date = new Date().toISOString().slice(0, 10)
      }

      const key = `${item.shipping_date}-${item.destination_cd}`
      if (!groupedItems[key]) {
        groupedItems[key] = []
      }
      groupedItems[key].push(item)
    })

    // 对每个分组分别进行托盘分配
    let allPallets = []
    Object.entries(groupedItems).forEach(([key, items]) => {
      const [shippingDate, destinationCD] = key.split('-')

      // 使用第一个项目来获取完整的日期信息
      const firstItem = items[0]
      let dateStr = formatShippingDateForPallet(firstItem)
      console.log('算法生成前缀，使用项目:', firstItem, '格式化后:', dateStr)

      if (!dateStr) {
        console.error(`无法从项目生成有效的日期字符串，将使用当前日期`)
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        dateStr = `${year}${month}${day}`
      }

      // 根据选择的算法进行托盘分配
      let groupPallets
      if (settings.value.optimizationMethod === 'genetic') {
        // 遺伝的アルゴリズムを使用してパレットを割り当て
        groupPallets = allocatePalletsGeneticAlgorithm(items, boxCapacitySettings)
      } else if (settings.value.optimizationMethod === 'decompose_only') {
        // 条件分解アルゴリズムを使用（組み合わせなし）
        groupPallets = allocatePalletsDecomposeOnly(items, boxCapacitySettings)
      } else {
        // 欲張りアルゴリズムを使用してパレットを割り当て
        groupPallets = allocatePallets(items, boxCapacitySettings)
      }

      // 为每个托盘设置编号
      for (let i = 0; i < groupPallets.length; i++) {
        const pallet = groupPallets[i]
        // 条件分解アルゴリズムの場合はパレット番号の序列番号を空のままにする
        if (settings.value.optimizationMethod === 'decompose_only') {
          // 出荷日 + 納入先CD の部分は設定するが、シリアル番号は空にする
          const prefix = `${dateStr}${pallet.destination_cd}`
          pallet.shipping_no_prefix = prefix
          pallet.shipping_no_serial = '' // 序列番号は空
          console.log(
            `条件分解アルゴリズム: パレット ${i + 1} は ${prefix} + 空のシリアル番号で生成`,
          )
        } else {
          // 他のアルゴリズムの場合は通常通りパレット番号を設定
          const prefix = `${dateStr}${pallet.destination_cd}`
          pallet.shipping_no_prefix = prefix
          pallet.shipping_no_serial = String(i + 1).padStart(2, '0')
          console.log(`生成托盘编号: ${prefix}${pallet.shipping_no_serial}, 日期部分: ${dateStr}`)
        }
      }

      allPallets = [...allPallets, ...groupPallets]
    })

    // パレットマージ最適化を適用（条件分解アルゴリズムはマージ最適化を行わない）
    if (settings.value.optimizationMethod !== 'decompose_only') {
      allPallets = optimizePalletsByMerging(allPallets)
    }
    pallets.value = allPallets
    //    console.log('贪心算法生成的托盘（合并优化后）:', pallets.value)
    return
  }

  // 原始分配算法（保留原来的逻辑）
  // console.log('使用原始分配算法')

  // 按照箱种和产品进行分组
  const groups = {}

  selectedItems.value.forEach((item) => {
    // console.log('处理选择项目:', item)
    const boxType = item.box_type || 'default'
    const key = `${boxType}-${item.product_cd}-${item.destination_cd}`
    if (!groups[key]) {
      groups[key] = {
        product_cd: item.product_cd,
        product_name: item.product_name,
        destination_cd: item.destination_cd,
        destination_name: item.destination_name,
        shipping_date: item.shipping_date,
        delivery_date: item.delivery_date,
        box_type: item.box_type || '-',
        confirmed_boxes: 0,
        confirmed_units: 0,
      }
    }
    // 确保确认箱数是数字
    const boxes =
      typeof item.confirmed_boxes === 'number'
        ? item.confirmed_boxes
        : parseInt(item.confirmed_boxes) || 0
    const units =
      typeof item.confirmed_units === 'number'
        ? item.confirmed_units
        : parseInt(item.confirmed_units) || 0

    groups[key].confirmed_boxes += boxes
    groups[key].confirmed_units += units
  })

  // console.log('分组后的数据:', groups)

  // 生成托盘分配
  const newPallets = []

  // 为每个出荷日期+纳入先组合创建一个计数器
  const dateDestCounters = {}

  // 先处理每个分组的完整托盘
  const remainingGroups = []

  Object.values(groups).forEach((group) => {
    // 确保settings.value存在
    if (!settings.value) {
      console.error('settings.value is not available')
      return
    }

    const boxType = group.box_type === '-' ? 'default' : group.box_type
    // console.log('处理箱种:', boxType)

    // 根据箱种获取每个托盘的最大箱数
    let maxBoxesPerPallet = boxSettings.value[boxType] || boxSettings.value.default

    // console.log('最大箱数:', maxBoxesPerPallet, '当前确认箱数:', group.confirmed_boxes)

    // 计算可以生成的完整托盘数
    const fullPallets = Math.floor(group.confirmed_boxes / maxBoxesPerPallet)
    const remainderBoxes = group.confirmed_boxes % maxBoxesPerPallet

    // console.log('完整托盘数:', fullPallets, '剩余箱数:', remainderBoxes)

    // 每箱产品数量
    const unitsPerBox =
      group.confirmed_boxes > 0
        ? Math.ceil(group.confirmed_units / group.confirmed_boxes)
        : settings.value.unitsPerBox

    // console.log('每箱产品数量:', unitsPerBox)

    // 使用订单中的实际出荷日期生成前缀
    let groupDateStr = formatShippingDateForPallet(group)
    console.log('原始算法生成前缀，使用组:', group, '格式化后:', groupDateStr)

    // 确保有有效的日期字符串
    if (!groupDateStr) {
      console.error(`无法从组生成有效的日期字符串，将使用当前日期`)
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      groupDateStr = `${year}${month}${day}`
    }

    // 为每个出荷日期+纳入先组合创建一个计数器
    const counterKey = `${groupDateStr}-${group.destination_cd}`
    if (!dateDestCounters[counterKey]) {
      dateDestCounters[counterKey] = 1
    }

    // 生成完整托盘
    for (let i = 0; i < fullPallets; i++) {
      // 使用destination_cd作为納入先CD
      const prefix = `${groupDateStr}${group.destination_cd}`
      const serial = String(dateDestCounters[counterKey]++).padStart(2, '0')

      const pallet = {
        shipping_no_prefix: prefix,
        shipping_no_serial: serial,
        product_cd: group.product_cd,
        product_name: group.product_name,
        destination_cd: group.destination_cd,
        destination_name: group.destination_name,
        shipping_date: group.shipping_date,
        delivery_date: group.delivery_date,
        box_type: group.box_type,
        confirmed_boxes: maxBoxesPerPallet,
        confirmed_units: maxBoxesPerPallet * unitsPerBox,
        unit: '本',
        remarks: '',
        detail: [
          {
            product_cd: group.product_cd,
            product_name: group.product_name,
            box_type: group.box_type,
            confirmed_boxes: maxBoxesPerPallet,
            confirmed_units: maxBoxesPerPallet * unitsPerBox,
            delivery_date: group.delivery_date,
            shipping_date: group.shipping_date,
          },
        ],
      }

      newPallets.push(pallet)
    }

    // 保存剩余的箱数到待处理组
    if (remainderBoxes > 0) {
      remainingGroups.push({
        ...group,
        confirmed_boxes: remainderBoxes,
        confirmed_units: remainderBoxes * unitsPerBox,
        unitsPerBox: unitsPerBox,
      })
    }
  })

  // console.log('剩余待处理组:', remainingGroups)

  // 处理剩余箱数，尝试组合不同产品到一个托盘
  if (remainingGroups.length > 0) {
    // 按箱种分组
    const boxTypeGroups = {}
    remainingGroups.forEach((group) => {
      const boxType = group.box_type === '-' ? 'default' : group.box_type
      if (!boxTypeGroups[boxType]) {
        boxTypeGroups[boxType] = []
      }
      boxTypeGroups[boxType].push(group)
    })

    // console.log('按箱种分组后的数据:', boxTypeGroups)

    // 对每种箱类型分别处理
    Object.entries(boxTypeGroups).forEach(([boxType, groups]) => {
      // 根据箱种获取每个托盘的最大箱数
      const maxBoxesPerPallet = boxSettings.value[boxType] || boxSettings.value.default

      // 进一步按照出荷日期和纳入先分组
      const dateDestGroups = {}
      groups.forEach((group) => {
        const groupDateStr = formatShippingDateForPallet(group)
        const key = `${groupDateStr}-${group.destination_cd}`
        if (!dateDestGroups[key]) {
          dateDestGroups[key] = []
        }
        dateDestGroups[key].push(group)
      })

      // 对每个出荷日期+纳入先组合分别处理
      Object.entries(dateDestGroups).forEach(([dateDestKey, dateDestGroup]) => {
        let currentPallet = {
          items: [],
          totalBoxes: 0,
          totalUnits: 0,
          destination_cd: dateDestGroup[0].destination_cd,
          destination_name: dateDestGroup[0].destination_name,
          shipping_date: dateDestGroup[0].shipping_date,
        }

        // 尝试组合不同产品
        dateDestGroup.forEach((group) => {
          // 如果当前托盘已满，创建新托盘
          if (currentPallet.totalBoxes + group.confirmed_boxes > maxBoxesPerPallet) {
            // 保存当前托盘
            if (currentPallet.totalBoxes > 0) {
              const palletItems = currentPallet.items.map((item) => ({
                product_cd: item.product_cd,
                product_name: item.product_name,
                box_type: item.box_type,
                confirmed_boxes: item.confirmed_boxes,
                confirmed_units: item.confirmed_units,
                delivery_date: item.delivery_date,
                shipping_date: item.shipping_date,
              }))

              // 使用第一个项目的出荷日期作为托盘编号的日期部分
              const firstItem = palletItems[0]
              let palletDateStr = formatShippingDateForPallet(firstItem)
              console.log('混载托盘生成前缀，使用项目:', firstItem, '格式化后:', palletDateStr)

              // 确保有有效的日期字符串
              if (!palletDateStr) {
                console.error(`无法从项目生成有效的日期字符串，将使用当前日期`)
                const today = new Date()
                const year = today.getFullYear()
                const month = String(today.getMonth() + 1).padStart(2, '0')
                const day = String(today.getDate()).padStart(2, '0')
                palletDateStr = `${year}${month}${day}`
              }

              // 使用对应的计数器
              const counterKey = `${palletDateStr}-${currentPallet.destination_cd}`
              if (!dateDestCounters[counterKey]) {
                dateDestCounters[counterKey] = 1
              }

              // 使用destination_cd作为納入先CD
              const prefix = `${palletDateStr}${currentPallet.destination_cd}`
              const serial = String(dateDestCounters[counterKey]++).padStart(2, '0')
              // console.log(`生成混载托盘编号: ${prefix}${serial}, 日期部分: ${palletDateStr}`)

              const pallet = {
                shipping_no_prefix: prefix,
                shipping_no_serial: serial,
                product_cd: palletItems.map((i) => i.product_cd).join(','),
                product_name: palletItems.map((i) => i.product_name).join(','),
                destination_cd: currentPallet.destination_cd,
                destination_name: currentPallet.destination_name,
                shipping_date: firstItem.shipping_date || currentPallet.shipping_date,
                delivery_date: palletItems.map((i) => i.delivery_date).join(','),
                box_type: boxType === 'default' ? '-' : boxType,
                confirmed_boxes: currentPallet.totalBoxes,
                confirmed_units: currentPallet.totalUnits,
                unit: '本',
                remarks: palletItems.length === 1 ? '' : '混載パレット',
                detail: palletItems, // 保存详细信息
              }
              //  console.log('添加混載パレット:', pallet)
              newPallets.push(pallet)
            }

            // 创建新托盘
            currentPallet = {
              items: [],
              totalBoxes: 0,
              totalUnits: 0,
              destination_cd: group.destination_cd,
              destination_name: group.destination_name,
              shipping_date: group.shipping_date,
            }
          }

          // 添加到当前托盘
          currentPallet.items.push(group)
          currentPallet.totalBoxes += group.confirmed_boxes
          currentPallet.totalUnits += group.confirmed_units
        })

        // 处理最后一个托盘
        if (currentPallet.totalBoxes > 0) {
          const palletItems = currentPallet.items.map((item) => ({
            product_cd: item.product_cd,
            product_name: item.product_name,
            box_type: item.box_type,
            confirmed_boxes: item.confirmed_boxes,
            confirmed_units: item.confirmed_units,
            delivery_date: item.delivery_date,
            shipping_date: item.shipping_date,
          }))

          // 使用第一个项目的出荷日期作为托盘编号的日期部分
          const firstItem = palletItems[0]
          let palletDateStr = formatShippingDateForPallet(firstItem)
          console.log('最后托盘生成前缀，原始日期:', firstItem, '格式化后:', palletDateStr)

          // 确保有有效的日期字符串
          if (!palletDateStr) {
            console.error(`无法从项目生成有效的日期字符串，将使用当前日期`)
            const today = new Date()
            const year = today.getFullYear()
            const month = String(today.getMonth() + 1).padStart(2, '0')
            const day = String(today.getDate()).padStart(2, '0')
            palletDateStr = `${year}${month}${day}`
          }

          // 使用对应的计数器
          const counterKey = `${palletDateStr}-${currentPallet.destination_cd}`
          if (!dateDestCounters[counterKey]) {
            dateDestCounters[counterKey] = 1
          }

          // 使用destination_cd作为納入先CD
          const prefix = `${palletDateStr}${currentPallet.destination_cd}`
          const serial = String(dateDestCounters[counterKey]++).padStart(2, '0')
          // console.log(`生成最后托盘编号: ${prefix}${serial}, 日期部分: ${palletDateStr}`)

          const pallet = {
            shipping_no_prefix: prefix,
            shipping_no_serial: serial,
            product_cd:
              palletItems.length === 1
                ? palletItems[0].product_cd
                : palletItems.map((i) => i.product_cd).join(','),
            product_name:
              palletItems.length === 1
                ? palletItems[0].product_name
                : palletItems.map((i) => i.product_name).join(','),
            destination_cd: currentPallet.destination_cd,
            destination_name: currentPallet.destination_name,
            shipping_date: firstItem.shipping_date || currentPallet.shipping_date,
            delivery_date:
              palletItems.length === 1
                ? palletItems[0].delivery_date
                : palletItems.map((i) => i.delivery_date).join(','),
            box_type: boxType === 'default' ? '-' : boxType,
            confirmed_boxes: currentPallet.totalBoxes,
            confirmed_units: currentPallet.totalUnits,
            unit: '本',
            remarks: palletItems.length === 1 ? '' : '混載パレット',
            detail: palletItems, // 保存详细信息
          }
          // console.log('添加最后一个托盘:', pallet)
          newPallets.push(pallet)
        }
      })
    })
  }

  //  console.log('生成的托盘数量:', newPallets.length)
  pallets.value = newPallets
}

/*
 * 算法优化总结 (2024优化版):
 *
 * 1. 欲張り法 (启发式算法) 优化:
 *    - 增加混載製品不能大于6种的约束条件
 *    - 优先组合成设定条件的箱数 (满载托盘优先)
 *    - 改进混载策略，提高箱数利用率
 *
 * 2. 遺伝的アルゴリズム 优化:
 *    - 增加约束条件验证和修复机制
 *    - 自动拆分超出限制的托盘 (箱数 > 设定值)
 *    - 自动拆分混載製品超过6种的托盘
 *    - 提高适应度计算精度，增加容量优化权重
 *
 * 3. 通用约束条件:
 *    - 混載製品种类 ≤ 6种
 *    - 同一产品总箱数 ≤ 设定条件的箱数
 *    - 优先生成满载托盘
 */

// 智能托盘分配算法 (欲張り法 - 优化版)
function allocatePallets(items, boxCapacitySettings) {
  // 按箱种分组
  const boxTypeGroups = {}
  items.forEach((item) => {
    const boxType = item.box_type || 'default'
    if (!boxTypeGroups[boxType]) {
      boxTypeGroups[boxType] = []
    }
    boxTypeGroups[boxType].push(item)
  })

  const pallets = []

  // 处理每种箱型
  Object.entries(boxTypeGroups).forEach(([boxType, typeItems]) => {
    // 获取该箱型的最大容量
    const maxBoxesPerPallet = boxCapacitySettings[boxType] || boxCapacitySettings.default

    // 按产品分组，将同一产品的项目合并
    const productGroups = {}
    typeItems.forEach((item) => {
      if (!productGroups[item.product_cd]) {
        productGroups[item.product_cd] = {
          ...item,
          totalBoxes: 0,
          totalUnits: 0,
        }
      }
      // 确保数值有效
      const boxes =
        typeof item.confirmed_boxes === 'number'
          ? item.confirmed_boxes
          : parseInt(item.confirmed_boxes) || 0
      const units =
        typeof item.confirmed_units === 'number'
          ? item.confirmed_units
          : parseInt(item.confirmed_units) || 0

      productGroups[item.product_cd].totalBoxes += boxes
      productGroups[item.product_cd].totalUnits += units
    })

    // 将产品按箱数从大到小排序
    const sortedProducts = Object.values(productGroups).sort((a, b) => b.totalBoxes - a.totalBoxes)

    // 处理每个产品
    sortedProducts.forEach((product) => {
      // 计算可以生成的完整托盘数
      const fullPallets = Math.floor(product.totalBoxes / maxBoxesPerPallet)
      const remainderBoxes = product.totalBoxes % maxBoxesPerPallet

      // 每箱产品数量
      const unitsPerBox =
        product.totalBoxes > 0 ? Math.ceil(product.totalUnits / product.totalBoxes) : 20

      // 生成完整托盘
      for (let i = 0; i < fullPallets; i++) {
        pallets.push({
          product_cd: product.product_cd,
          product_name: product.product_name,
          destination_cd: product.destination_cd,
          destination_name: product.destination_name,
          shipping_date: product.shipping_date,
          delivery_date: product.delivery_date,
          box_type: boxType === 'default' ? '-' : boxType,
          confirmed_boxes: maxBoxesPerPallet,
          confirmed_units: maxBoxesPerPallet * unitsPerBox,
          unit: '本',
          remarks: '',
          detail: [
            {
              product_cd: product.product_cd,
              product_name: product.product_name,
              box_type: boxType === 'default' ? '-' : boxType,
              confirmed_boxes: maxBoxesPerPallet,
              confirmed_units: maxBoxesPerPallet * unitsPerBox,
              delivery_date: product.delivery_date,
              shipping_date: product.shipping_date,
            },
          ],
        })
      }

      // 保存剩余箱数
      if (remainderBoxes > 0) {
        product.remainderBoxes = remainderBoxes
        product.remainderUnits = remainderBoxes * unitsPerBox
      } else {
        product.remainderBoxes = 0
        product.remainderUnits = 0
      }
    })

    // 处理剩余的箱数，尽量将同一产品放在一起
    const remainingProducts = sortedProducts.filter((p) => p.remainderBoxes > 0)

    if (remainingProducts.length > 0) {
      // 创建一个新的托盘分配算法，优先考虑同一产品
      const optimizedPallets = optimizePalletAllocation(
        remainingProducts,
        maxBoxesPerPallet,
        boxType,
      )
      pallets.push(...optimizedPallets)
    }
  })

  return pallets
}

// 优化托盘分配，尽量将同一产品放在一起
function optimizePalletAllocation(products, maxBoxesPerPallet, boxType) {
  const pallets = []

  // 按产品代码分组，确保同一品种尽量放在一起
  const productCodeGroups = {}
  products.forEach((product) => {
    if (!productCodeGroups[product.product_cd]) {
      productCodeGroups[product.product_cd] = []
    }
    productCodeGroups[product.product_cd].push(product)
  })

  // console.log('按产品代码分组:', Object.keys(productCodeGroups).length, '个不同产品')

  // 处理每个产品组
  Object.entries(productCodeGroups).forEach(([productCd, productGroup]) => {
    // 如果同一产品有多个项目，先合并它们
    if (productGroup.length > 1) {
      //  console.log(`合并同一产品 ${productCd} 的 ${productGroup.length} 个项目`)
      const mergedProduct = {
        ...productGroup[0],
        remainderBoxes: 0,
        remainderUnits: 0,
      }

      productGroup.forEach((product) => {
        mergedProduct.remainderBoxes += product.remainderBoxes
        mergedProduct.remainderUnits += product.remainderUnits
      })

      productGroup = [mergedProduct]
    }

    const product = productGroup[0]
    let remainingBoxes = product.remainderBoxes
    let remainingUnits = product.remainderUnits

    // 为这个产品创建尽可能多的完整托盘
    while (remainingBoxes >= maxBoxesPerPallet) {
      const boxesForThisPallet = maxBoxesPerPallet
      const unitsForThisPallet = Math.ceil(boxesForThisPallet * (remainingUnits / remainingBoxes))

      const pallet = {
        product_cd: product.product_cd,
        product_name: product.product_name,
        destination_cd: product.destination_cd,
        destination_name: product.destination_name,
        shipping_date: product.shipping_date,
        delivery_date: product.delivery_date,
        box_type: boxType === 'default' ? '-' : boxType,
        confirmed_boxes: boxesForThisPallet,
        confirmed_units: unitsForThisPallet,
        unit: '本',
        remarks: '',
        detail: [
          {
            product_cd: product.product_cd,
            product_name: product.product_name,
            box_type: boxType === 'default' ? '-' : boxType,
            confirmed_boxes: boxesForThisPallet,
            confirmed_units: unitsForThisPallet,
            delivery_date: product.delivery_date,
            shipping_date: product.shipping_date,
          },
        ],
      }

      pallets.push(pallet)
      remainingBoxes -= boxesForThisPallet
      remainingUnits -= unitsForThisPallet
    }

    // 保存剩余的箱数，用于后续混载处理
    if (remainingBoxes > 0) {
      product.remainderBoxes = remainingBoxes
      product.remainderUnits = remainingUnits
      productCodeGroups[productCd] = [product]
    } else {
      productCodeGroups[productCd] = []
    }
  })

  // 收集所有剩余的产品
  const remainingProducts = []
  Object.values(productCodeGroups).forEach((group) => {
    if (group.length > 0) {
      remainingProducts.push(...group)
    }
  })

  // 如果还有剩余产品，尝试优化混载
  if (remainingProducts.length > 0) {
    //  console.log(`处理剩余的 ${remainingProducts.length} 个产品项目`)

    // 按照箱数从大到小排序
    remainingProducts.sort((a, b) => b.remainderBoxes - a.remainderBoxes)

    // 使用优化的混载算法
    const mixedPallets = createOptimizedMixedPallets(remainingProducts, maxBoxesPerPallet, boxType)
    pallets.push(...mixedPallets)
  }

  return pallets
}

// 创建优化的混载托盘
function createOptimizedMixedPallets(products, maxBoxesPerPallet, boxType) {
  const pallets = []
  let remainingProducts = [...products]

  while (remainingProducts.length > 0) {
    // 创建新托盘
    const currentPallet = {
      items: [],
      totalBoxes: 0,
      totalUnits: 0,
      destination_cd: remainingProducts[0].destination_cd,
      destination_name: remainingProducts[0].destination_name,
      shipping_date: remainingProducts[0].shipping_date,
      box_type: boxType,
    }

    // 首先尝试找到一个产品，其箱数正好等于或接近最大容量
    let bestProductIndex = 0
    let bestFitScore = -1

    for (let i = 0; i < remainingProducts.length; i++) {
      const product = remainingProducts[i]
      // 计算适合度分数 - 越接近最大容量越好
      const fitScore = product.remainderBoxes / maxBoxesPerPallet

      // 如果找到完美匹配，立即使用
      if (product.remainderBoxes === maxBoxesPerPallet) {
        bestProductIndex = i
        break
      }

      // 如果找到更好的匹配，更新索引
      if (fitScore > bestFitScore && fitScore <= 1) {
        bestFitScore = fitScore
        bestProductIndex = i
      }
    }

    // 添加最佳匹配的产品
    const bestProduct = remainingProducts[bestProductIndex]

    // 如果最佳产品的箱数小于最大容量
    if (bestProduct.remainderBoxes < maxBoxesPerPallet) {
      currentPallet.items.push(bestProduct)
      currentPallet.totalBoxes += bestProduct.remainderBoxes
      currentPallet.totalUnits += bestProduct.remainderUnits

      // 从剩余产品中移除已添加的产品
      remainingProducts.splice(bestProductIndex, 1)

      // 尝试添加更多产品到当前托盘，但限制混载产品种类不超过6种
      for (let i = remainingProducts.length - 1; i >= 0; i--) {
        const product = remainingProducts[i]

        // 检查混载产品种类限制（不超过6种）
        if (currentPallet.items.length >= 6) {
          break
        }

        // 检查是否有空间
        if (currentPallet.totalBoxes + product.remainderBoxes <= maxBoxesPerPallet) {
          currentPallet.items.push(product)
          currentPallet.totalBoxes += product.remainderBoxes
          currentPallet.totalUnits += product.remainderUnits
          remainingProducts.splice(i, 1)
        }
      }
    } else {
      // 如果最佳产品正好等于最大容量，直接使用
      currentPallet.items.push(bestProduct)
      currentPallet.totalBoxes = bestProduct.remainderBoxes
      currentPallet.totalUnits = bestProduct.remainderUnits
      remainingProducts.splice(bestProductIndex, 1)
    }

    // 创建托盘对象
    const palletItems = currentPallet.items.map((item) => ({
      product_cd: item.product_cd,
      product_name: item.product_name,
      box_type: item.box_type,
      confirmed_boxes: item.remainderBoxes,
      confirmed_units: item.remainderUnits,
      delivery_date: item.delivery_date,
      shipping_date: item.shipping_date,
    }))

    const isMixed = palletItems.length > 1

    // 如果只有一个产品，或者所有产品都是同一个产品代码
    const allSameProduct = palletItems.every(
      (item) => item.product_cd === palletItems[0].product_cd,
    )

    const pallet = {
      product_cd: allSameProduct
        ? palletItems[0].product_cd
        : palletItems.map((i) => i.product_cd).join(','),
      product_name: allSameProduct
        ? palletItems[0].product_name
        : palletItems.map((i) => i.product_name).join(','),
      destination_cd: currentPallet.destination_cd,
      destination_name: currentPallet.destination_name,
      shipping_date: currentPallet.shipping_date,
      delivery_date: allSameProduct
        ? palletItems[0].delivery_date
        : palletItems.map((i) => i.delivery_date).join(','),
      box_type: boxType === 'default' ? '-' : boxType,
      confirmed_boxes: currentPallet.totalBoxes,
      confirmed_units: currentPallet.totalUnits,
      unit: '本',
      remarks: isMixed && !allSameProduct ? '混載パレット' : '',
      detail: palletItems,
    }

    pallets.push(pallet)
  }

  return pallets
}

// 优先填充同一产品
function fillWithSameProductFirst(
  currentPallet,
  remainingProducts,
  maxBoxesPerPallet,
  preferredProductCd,
) {
  const availableSpace = maxBoxesPerPallet - currentPallet.totalBoxes
  if (availableSpace <= 0) return

  // 首先尝试找同一产品代码的产品
  const sameProductIndex = remainingProducts.findIndex((p) => p.product_cd === preferredProductCd)

  if (sameProductIndex >= 0) {
    const sameProduct = remainingProducts[sameProductIndex]

    if (sameProduct.remainderBoxes <= availableSpace) {
      // 全部添加
      currentPallet.items.push({
        ...sameProduct,
        confirmed_boxes: sameProduct.remainderBoxes,
        confirmed_units: sameProduct.remainderUnits,
      })
      currentPallet.totalBoxes += sameProduct.remainderBoxes
      currentPallet.totalUnits += sameProduct.remainderUnits

      // 从剩余产品中移除
      remainingProducts.splice(sameProductIndex, 1)

      // 递归调用，继续尝试填充同一产品
      fillWithSameProductFirst(
        currentPallet,
        remainingProducts,
        maxBoxesPerPallet,
        preferredProductCd,
      )
    } else {
      // 部分添加
      const boxesToAdd = availableSpace
      const unitsToAdd = Math.ceil(
        boxesToAdd * (sameProduct.remainderUnits / sameProduct.remainderBoxes),
      )

      currentPallet.items.push({
        ...sameProduct,
        confirmed_boxes: boxesToAdd,
        confirmed_units: unitsToAdd,
      })
      currentPallet.totalBoxes += boxesToAdd
      currentPallet.totalUnits += unitsToAdd

      // 更新剩余产品
      sameProduct.remainderBoxes -= boxesToAdd
      sameProduct.remainderUnits -= unitsToAdd

      // 如果剩余箱数为0，从列表中移除
      if (sameProduct.remainderBoxes <= 0) {
        remainingProducts.splice(sameProductIndex, 1)
      }
    }
  } else {
    // 没有找到同一产品，尝试填充其他产品
    fillRemainingSpaceOptimized(currentPallet, remainingProducts, maxBoxesPerPallet)
  }
}

// 优化版填充托盘剩余空间
function fillRemainingSpaceOptimized(currentPallet, remainingProducts, maxBoxesPerPallet) {
  // 如果托盘已满或没有剩余产品，直接返回
  if (currentPallet.totalBoxes >= maxBoxesPerPallet || remainingProducts.length === 0) {
    return
  }

  // 检查混载产品种类限制（不超过6种）
  if (currentPallet.items.length >= 6) {
    return
  }

  // 计算可用空间
  const availableSpace = maxBoxesPerPallet - currentPallet.totalBoxes

  // 尝试找到最适合的产品填充剩余空间
  let bestFitIndex = -1
  let bestFitScore = -1

  for (let i = 0; i < remainingProducts.length; i++) {
    const product = remainingProducts[i]

    // 如果产品与托盘中已有的产品相同，优先选择
    const hasSameProduct = currentPallet.items.some(
      (item) => item.product_cd === product.product_cd,
    )

    // 计算适合度分数
    let fitScore = 0

    if (hasSameProduct) {
      // 同一产品得高分
      fitScore = 10 + Math.min(product.remainderBoxes / availableSpace, 1)
    } else if (product.remainderBoxes <= availableSpace) {
      // 能完全放入的产品得中等分数
      fitScore = Math.min(product.remainderBoxes / availableSpace, 0.9)
    } else {
      // 需要分割的产品得低分
      fitScore = 0.5
    }

    if (fitScore > bestFitScore) {
      bestFitScore = fitScore
      bestFitIndex = i
    }
  }

  // 如果找到合适的产品
  if (bestFitIndex >= 0) {
    const product = remainingProducts[bestFitIndex]

    if (product.remainderBoxes <= availableSpace) {
      // 全部添加
      currentPallet.items.push({
        ...product,
        confirmed_boxes: product.remainderBoxes,
        confirmed_units: product.remainderUnits,
      })
      currentPallet.totalBoxes += product.remainderBoxes
      currentPallet.totalUnits += product.remainderUnits

      // 从剩余产品中移除
      remainingProducts.splice(bestFitIndex, 1)

      // 递归调用，继续填充
      fillRemainingSpaceOptimized(currentPallet, remainingProducts, maxBoxesPerPallet)
    } else {
      // 部分添加
      const boxesToAdd = availableSpace
      const unitsToAdd = Math.ceil(boxesToAdd * (product.remainderUnits / product.remainderBoxes))

      currentPallet.items.push({
        ...product,
        confirmed_boxes: boxesToAdd,
        confirmed_units: unitsToAdd,
      })
      currentPallet.totalBoxes += boxesToAdd
      currentPallet.totalUnits += unitsToAdd

      // 更新剩余产品
      product.remainderBoxes -= boxesToAdd
      product.remainderUnits -= unitsToAdd

      // 如果剩余箱数为0，从列表中移除
      if (product.remainderBoxes <= 0) {
        remainingProducts.splice(bestFitIndex, 1)
      }
    }
  }
}

// 优化版保存托盘函数
function savePalletOptimized(currentPallet, boxType, pallets) {
  const palletItems = currentPallet.items.map((item) => ({
    product_cd: item.product_cd,
    product_name: item.product_name,
    box_type: item.box_type || (boxType === 'default' ? '-' : boxType),
    confirmed_boxes: item.confirmed_boxes,
    confirmed_units: item.confirmed_units,
    delivery_date: item.delivery_date,
    shipping_date: item.shipping_date,
  }))

  const isMixed = palletItems.length > 1

  // 如果只有一个产品，或者所有产品都是同一个产品代码
  const allSameProduct = palletItems.every((item) => item.product_cd === palletItems[0].product_cd)

  pallets.push({
    product_cd: allSameProduct
      ? palletItems[0].product_cd
      : palletItems.map((i) => i.product_cd).join(','),
    product_name: allSameProduct
      ? palletItems[0].product_name
      : palletItems.map((i) => i.product_name).join(','),
    destination_cd: currentPallet.destination_cd,
    destination_name: currentPallet.destination_name,
    shipping_date: currentPallet.shipping_date,
    delivery_date: allSameProduct
      ? palletItems[0].delivery_date
      : palletItems.map((i) => i.delivery_date).join(','),
    box_type: boxType === 'default' ? '-' : boxType,
    confirmed_boxes: currentPallet.totalBoxes,
    confirmed_units: currentPallet.totalUnits,
    unit: '本',
    remarks: isMixed && !allSameProduct ? '混載パレット' : '',
    detail: palletItems,
  })
}

// 提交保存
async function submitShipping() {
  if (submitDisabled.value) {
    ElMessage.warning('データが完全で、パレット割り当てが正しいことを確認してください')
    return
  }

  try {
    await ElMessageBox.confirm(
      ` ${pallets.value.length} パレット分の出荷伝票を作成しますか？`,
      '操作確認',
      {
        confirmButtonText: 'はい',
        cancelButtonText: 'いいえ',
        type: 'warning',
      },
    )

    loading.value.submit = true

    // 构建提交数据
    const shippingItemsPayload = []

    // 处理每个托盘
    for (const pallet of pallets.value) {
      const shippingNo = pallet.shipping_no_prefix + pallet.shipping_no_serial

      // 检查是否为混載パレット（有detail且长度大于1）
      if (pallet.detail && pallet.detail.length > 1) {
        console.log('处理混載パレット:', shippingNo)

        // 遍历每个明细项目，为每个项目创建单独的记录
        for (const item of pallet.detail) {
          shippingItemsPayload.push({
            shipping_no: shippingNo, // 保持相同的托盘编号
            product_cd: item.product_cd,
            product_name: item.product_name,
            product_alias: '',
            delivery_date: item.delivery_date || null,
            destination_cd: pallet.destination_cd,
            destination_name: pallet.destination_name,
            shipping_date: item.shipping_date, // 使用原始日订单的出荷日
            box_type: item.box_type || '-', // 确保箱タイプ有值
            confirmed_boxes: item.confirmed_boxes,
            confirmed_units: item.confirmed_units,
            unit: pallet.unit || '本',
            remarks: `${pallet.remarks || ''} 混載パレット`.trim(),
          })
        }
      } else {
        // 非混載パレット，直接添加
        const mainItem = pallet.detail && pallet.detail.length > 0 ? pallet.detail[0] : pallet
        shippingItemsPayload.push({
          shipping_no: shippingNo,
          product_cd: mainItem.product_cd,
          product_name: mainItem.product_name,
          product_alias: '',
          delivery_date: mainItem.delivery_date || null,
          destination_cd: pallet.destination_cd,
          destination_name: pallet.destination_name,
          shipping_date: mainItem.shipping_date || pallet.shipping_date, // 使用原始日订单的出荷日
          box_type: mainItem.box_type || pallet.box_type || '-', // 确保箱タイプ有值
          confirmed_boxes: mainItem.confirmed_boxes,
          confirmed_units: mainItem.confirmed_units,
          unit: pallet.unit || '本',
          remarks: pallet.remarks || '',
        })
      }
    }

    // Build a map to find the first pallet# for each product
    const productPalletMap = new Map()
    for (const pallet of pallets.value) {
      const shippingNo = pallet.shipping_no_prefix + pallet.shipping_no_serial
      if (pallet.detail && pallet.detail.length > 0) {
        for (const item of pallet.detail) {
          if (!productPalletMap.has(item.product_cd)) {
            productPalletMap.set(item.product_cd, shippingNo)
          }
        }
      } else {
        if (!productPalletMap.has(pallet.product_cd)) {
          productPalletMap.set(pallet.product_cd, shippingNo)
        }
      }
    }

    // Build payload to update the shipping_no in the source daily orders
    const updatePayload = selectedItems.value
      .map((item) => ({
        product_cd: item.product_cd,
        destination_cd: item.destination_cd,
        shipping_date: item.shipping_date,
        shipping_no: productPalletMap.get(item.product_cd) || null,
      }))
      .filter((item) => item.shipping_no)

    // console.log(`将保存 ${shippingItemsPayload.length} 条记录`)
    // console.log(`将更新 ${updatePayload.length} 条原始订单`)

    // Perform both API calls
    try {
      if (shippingItemsPayload.length > 0) {
        // console.log('开始保存出荷项目...')
        const bulkRes = await request.post('/api/shipping/items/bulk', shippingItemsPayload)
        // console.log('出荷项目保存成功:', bulkRes)
      }

      if (updatePayload.length > 0) {
        // console.log('开始更新原始订单的出荷编号...')
        // 修改API调用，不再使用/api/shipping/suggestion/update-shipping-no
        const updateRes = await request.patch('/api/order/daily/update-shipping-no', updatePayload)
        // console.log('原始订单更新成功:', updateRes)
      }

      ElMessage.success('出荷伝票の保存に成功しました')
      visible.value = false
      emit('submitted')
    } catch (apiError) {
      console.error('API调用失败:', apiError)
      const errorMessage = apiError.response?.data?.message || apiError.message || '不明なエラー'
      ElMessage.error(`出荷伝票の保存に失敗しました: ${errorMessage}`)
      throw apiError // 重新抛出错误以便外部catch捕获
    }
  } catch (error) {
    if (error === 'cancel') {
      // console.log('用户取消了操作')
      return
    }
    console.error('保存出荷单失败:', error)
    // 错误消息已在内部try-catch中处理，这里不需要再显示
  } finally {
    loading.value.submit = false
  }
}

// 显示托盘详情
function showPalletDetail(pallet) {
  const detailContent = pallet.detail
    .map(
      (item, index) => `
    <tr class="detail-row" style="border-bottom: 1px solid #f0f2f5; transition: background-color 0.2s;">
      <td style="padding: 12px 16px; border-right: 1px solid #f0f2f5; font-size: 14px; color: #303133;">${item.product_name}</td>
      <td style="padding: 12px 16px; border-right: 1px solid #f0f2f5; text-align: center; font-size: 14px; color: #606266;">
        <span style="background: #f4f4f5; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
          ${item.box_type || '-'}
        </span>
      </td>
      <td style="padding: 12px 16px; border-right: 1px solid #f0f2f5; text-align: right; font-size: 14px; font-weight: 600; color: #e6a23c;">
        ${item.confirmed_boxes}
      </td>
      <td style="padding: 12px 16px; text-align: right; font-size: 14px; font-weight: 600; color: #67c23a;">
        ${item.confirmed_units.toLocaleString()}
      </td>
    </tr>
  `,
    )
    .join('')

  const html = `
    <div style="max-height: 500px; overflow-y: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- 头部信息 -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="background: rgba(255,255,255,0.2); padding: 8px; border-radius: 8px; display: inline-flex;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 18px; font-weight: 600;">混載パレット詳細</h3>
            <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">パレット番号: ${pallet.shipping_no_prefix}${pallet.shipping_no_serial}</p>
          </div>
        </div>

        <!-- 基本信息卡片 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
          <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; backdrop-filter: blur(10px);">
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">箱種</div>
            <div style="font-size: 16px; font-weight: 600;">${pallet.box_type || '-'}</div>
          </div>
          <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; backdrop-filter: blur(10px);">
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">納入先</div>
            <div style="font-size: 16px; font-weight: 600;">${pallet.destination_name}</div>
          </div>
        </div>
      </div>

      <!-- 产品详细表格 -->
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); width: 120%;">
              <th style="padding: 8px; text-align: left; font-size: 11px; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="background: #409eff; width: 4px; height: 16px; border-radius: 2px; display: inline-block;"></span>
                  製品名
                </div>
              </th>
              <th style="padding: 5px; text-align: center; font-size: 11px; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">箱種</th>
              <th style="padding: 5px; text-align: right; font-size: 11px; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">箱数</th>
              <th style="padding: 5px; text-align: right; font-size: 11px; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">数量</th>
            </tr>
          </thead>
          <tbody>
            ${detailContent}
          </tbody>
          <tfoot>
            <tr style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-top: 2px solid #dee2e6;">
              <td style="padding: 16px; font-size: 11px; font-weight: 700; color: #495057;" colspan="2">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="background: #67c23a; width: 4px; height: 16px; border-radius: 2px; display: inline-block;"></span>
                  合計
                </div>
              </td>
              <td style="padding: 16px; text-align: right; font-size: 12px; font-weight: 700; color: #e6a23c;">
                <span style="background: rgba(230, 162, 60, 0.1); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(230, 162, 60, 0.3);">
                  ${pallet.confirmed_boxes}
                </span>
              </td>
              <td style="padding: 16px; text-align: right; font-size: 12px; font-weight: 700; color: #67c23a;">
                <span style="background: rgba(103, 194, 58, 0.1); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(103, 194, 58, 0.3);">
                  ${pallet.confirmed_units.toLocaleString()}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <style>
      .detail-row:hover {
        background-color: #f8f9fa !important;
      }
      .el-message-box {
        border-radius: 16px !important;
        overflow: hidden !important;
      }
      .el-message-box__header {
        padding: 0 !important;
        border-bottom: none !important;
      }
      .el-message-box__title {
        display: none !important;
      }
      .el-message-box__content {
        padding: 20px !important;
      }
      .el-message-box__btns {
        padding: 16px 20px !important;
        border-top: 1px solid #f0f2f5 !important;
        background: #fafbfc !important;
      }
      .el-button--primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 10px 24px !important;
        font-weight: 600 !important;
      }
    </style>
  `

  ElMessageBox.alert(html, '', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '閉じる',
    customClass: 'pallet-detail-dialog',
    showClose: false,
  })
}

// 更新托盘编号
function updatePalletNumber(pallet, increment) {
  const currentSerial = pallet.shipping_no_serial
  const currentNum = parseInt(currentSerial) || 1
  const newNum = Math.max(1, Math.min(99, currentNum + increment))
  pallet.shipping_no_serial = newNum.toString().padStart(2, '0')
}

// 验证托盘编号
function validatePalletNumber(pallet) {
  // el-input-number 会自动处理数值验证，我们只需要确保格式正确
  if (typeof pallet.shipping_no_serial === 'number') {
    // 将数字转换为两位数字符串格式
    pallet.shipping_no_serial = pallet.shipping_no_serial.toString().padStart(2, '0')
  } else {
    // 如果是字符串，移除非数字字符并格式化
    let currentSerial = pallet.shipping_no_serial.toString().replace(/\D/g, '')
    const numValue = Math.max(1, parseInt(currentSerial) || 1)
    pallet.shipping_no_serial = numValue.toString().padStart(2, '0')
  }
}

// 减少托盘编号
function decrementPalletNumber(pallet) {
  updatePalletNumber(pallet, -1)
}

// 增加托盘编号
function incrementPalletNumber(pallet) {
  updatePalletNumber(pallet, 1)
}

// 新增调试函数
function debugShowData() {
  // console.log('=== DEBUG INFO ===')
  // console.log('dailyOrders.value:', dailyOrders.value)
  // console.log('dailyOrders.value 长度:', dailyOrders.value.length)
  // console.log('filteredOrders.value:', filteredOrders.value)
  // console.log('filteredOrders.value 长度:', filteredOrders.value.length)
  // console.log('loading.orders:', loading.value.orders)
  // console.log('shippedIdentifiers:', shippedIdentifiers.value)

  if (dailyOrders.value.length > 0) {
  }

  ElMessage.success('调试信息已打印到控制台')
}

// 遗传算法实现托盘分配 - 优化版，增加约束条件
function allocatePalletsGeneticAlgorithm(items, boxCapacitySettings) {
  // console.log('使用遗传算法分配托盘，项目数量:', items.length)

  // 按箱种分组
  const boxTypeGroups = {}
  items.forEach((item) => {
    const boxType = item.box_type || 'default'
    if (!boxTypeGroups[boxType]) {
      boxTypeGroups[boxType] = []
    }
    boxTypeGroups[boxType].push(item)
  })

  const allPallets = []

  // 处理每种箱型
  Object.entries(boxTypeGroups).forEach(([boxType, typeItems]) => {
    // 获取该箱型的最大容量
    const maxBoxesPerPallet = boxCapacitySettings[boxType] || boxCapacitySettings.default

    // 按产品分组，将同一产品的项目合并
    const productGroups = {}
    typeItems.forEach((item) => {
      if (!productGroups[item.product_cd]) {
        productGroups[item.product_cd] = {
          ...item,
          totalBoxes: 0,
          totalUnits: 0,
        }
      }
      // 确保数值有效
      const boxes =
        typeof item.confirmed_boxes === 'number'
          ? item.confirmed_boxes
          : parseInt(item.confirmed_boxes) || 0
      const units =
        typeof item.confirmed_units === 'number'
          ? item.confirmed_units
          : parseInt(item.confirmed_units) || 0

      productGroups[item.product_cd].totalBoxes += boxes
      productGroups[item.product_cd].totalUnits += units
    })

    // 在转换为遗传算法格式之前，先处理大于32箱的产品拆分
    const splitProducts = []
    Object.values(productGroups).forEach((product) => {
      const totalBoxes = product.totalBoxes
      const totalUnits = product.totalUnits
      const unitsPerBox = totalBoxes > 0 ? totalUnits / totalBoxes : 0

      // 只对小箱进行拆分处理
      if (boxType === '小箱' && totalBoxes > 32) {
        // console.log(`产品 ${product.product_cd} 箱数 ${totalBoxes} > 32，需要拆分`)

        // 计算需要多少个32箱的组
        const fullGroups = Math.floor(totalBoxes / 32)
        const remainder = totalBoxes % 32

        // 创建32箱的组
        for (let i = 0; i < fullGroups; i++) {
          splitProducts.push({
            id: `${product.product_cd}_split_${i + 1}`,
            originalId: product.product_cd,
            name: product.product_name,
            boxes: 32,
            units: Math.round(32 * unitsPerBox),
            destination_cd: product.destination_cd,
            destination_name: product.destination_name,
            shipping_date: product.shipping_date,
            delivery_date: product.delivery_date,
            box_type: boxType === 'default' ? '-' : boxType,
            isSplit: true,
            splitGroup: i + 1,
            totalSplitGroups: fullGroups + (remainder > 0 ? 1 : 0),
          })
        }

        // 如果有剩余，创建剩余组
        if (remainder > 0) {
          splitProducts.push({
            id: `${product.product_cd}_split_${fullGroups + 1}`,
            originalId: product.product_cd,
            name: product.product_name,
            boxes: remainder,
            units: Math.round(remainder * unitsPerBox),
            destination_cd: product.destination_cd,
            destination_name: product.destination_name,
            shipping_date: product.shipping_date,
            delivery_date: product.delivery_date,
            box_type: boxType === 'default' ? '-' : boxType,
            isSplit: true,
            splitGroup: fullGroups + 1,
            totalSplitGroups: fullGroups + 1,
          })
        }

        // console.log(
        //   `产品 ${product.product_cd} 拆分完成：${fullGroups}个32箱组 + ${remainder > 0 ? '1个' + remainder + '箱组' : '无剩余'}`,
        // )
      } else {
        // 不需要拆分的产品直接添加
        splitProducts.push({
          id: product.product_cd,
          originalId: product.product_cd,
          name: product.product_name,
          boxes: totalBoxes,
          units: totalUnits,
          destination_cd: product.destination_cd,
          destination_name: product.destination_name,
          shipping_date: product.shipping_date,
          delivery_date: product.delivery_date,
          box_type: boxType === 'default' ? '-' : boxType,
          isSplit: false,
        })
      }
    })

    //  console.log(
    //   `箱种 ${boxType} 拆分后产品数量：${Object.keys(productGroups).length} -> ${splitProducts.length}`,
    // )

    // 使用拆分后的产品进行遗传算法
    const products = splitProducts

    // 使用遗传算法优化托盘分配
    const geneticResult = runGeneticAlgorithm(products, maxBoxesPerPallet)

    // 验证和修复遗传算法结果
    const validatedResult = validateAndFixGeneticResult(geneticResult, maxBoxesPerPallet)

    // 将结果转换为托盘数据
    const pallets = validatedResult.map((palletData) => {
      const palletItems = palletData.items.map((item) => {
        // 使用原始产品ID显示，隐藏拆分信息
        const displayProductCd = item.originalId || item.id
        const displayProductName = item.name

        return {
          product_cd: displayProductCd,
          product_name: displayProductName,
          box_type: item.box_type,
          confirmed_boxes: item.boxes,
          confirmed_units: item.units,
          delivery_date: item.delivery_date,
          shipping_date: item.shipping_date,
          // 保留拆分信息用于调试
          _splitInfo: item.isSplit
            ? {
                splitGroup: item.splitGroup,
                totalSplitGroups: item.totalSplitGroups,
                originalId: item.originalId,
              }
            : null,
        }
      })

      // 按原始产品ID合并显示（合并拆分的产品项）
      const mergedItems = {}
      palletItems.forEach((item) => {
        const key = item.product_cd
        if (!mergedItems[key]) {
          mergedItems[key] = {
            product_cd: item.product_cd,
            product_name: item.product_name,
            box_type: item.box_type,
            confirmed_boxes: item.confirmed_boxes,
            confirmed_units: item.confirmed_units,
            delivery_date: item.delivery_date,
            shipping_date: item.shipping_date,
          }
        } else {
          // 合并同一产品的不同拆分组
          mergedItems[key].confirmed_boxes += item.confirmed_boxes
          mergedItems[key].confirmed_units += item.confirmed_units
        }
      })

      const finalPalletItems = Object.values(mergedItems)

      // 确定是否为混载托盘
      const isMixed = finalPalletItems.length > 1
      const allSameProduct = finalPalletItems.every(
        (item) => item.product_cd === finalPalletItems[0].product_cd,
      )

      return {
        product_cd: allSameProduct
          ? finalPalletItems[0].product_cd
          : finalPalletItems.map((i) => i.product_cd).join(','),
        product_name: allSameProduct
          ? finalPalletItems[0].product_name
          : finalPalletItems.map((i) => i.product_name).join(','),
        destination_cd: palletItems[0].destination_cd || palletData.items[0].destination_cd,
        destination_name: palletItems[0].destination_name || palletData.items[0].destination_name,
        shipping_date: palletItems[0].shipping_date || palletData.items[0].shipping_date,
        delivery_date: allSameProduct
          ? finalPalletItems[0].delivery_date
          : finalPalletItems.map((i) => i.delivery_date).join(','),
        box_type: boxType === 'default' ? '-' : boxType,
        confirmed_boxes: palletData.totalBoxes,
        confirmed_units: palletData.totalUnits,
        unit: '本',
        remarks: isMixed && !allSameProduct ? '混載パレット' : '',
        detail: finalPalletItems,
      }
    })

    allPallets.push(...pallets)
  })

  // 应用托盘合并优化（与贪心算法相同的优化逻辑）
  const optimizedPallets = optimizePalletsByMerging(allPallets)
  // console.log(
  //   `遗传算法托盘合并优化完成，优化前: ${allPallets.length}，优化后: ${optimizedPallets.length}`,
  // )

  return optimizedPallets
}

// 验证和修复遗传算法结果
function validateAndFixGeneticResult(solution, maxBoxesPerPallet) {
  const fixedSolution = []

  solution.forEach((pallet) => {
    // 检查并修复超出箱数限制的托盘
    if (pallet.totalBoxes > maxBoxesPerPallet) {
      // console.log(`发现超出限制的托盘: ${pallet.totalBoxes} > ${maxBoxesPerPallet}`)

      // 将超出限制的托盘拆分成多个托盘
      const splitPallets = splitOverflowPallet(pallet, maxBoxesPerPallet)
      fixedSolution.push(...splitPallets)
    } else if (pallet.items.length > 6) {
      // 检查并修复混载产品种类超过6种的托盘
      // console.log(`发现混载产品种类超过6种的托盘: ${pallet.items.length}种产品`)

      const splitPallets = splitMixedProductPallet(pallet, maxBoxesPerPallet)
      fixedSolution.push(...splitPallets)
    } else {
      // 托盘符合要求，直接添加
      fixedSolution.push(pallet)
    }
  })

  return fixedSolution
}

// 拆分超出箱数限制的托盘
function splitOverflowPallet(pallet, maxBoxesPerPallet) {
  const splitPallets = []
  let remainingItems = [...pallet.items]

  while (remainingItems.length > 0) {
    const newPallet = {
      totalBoxes: 0,
      totalUnits: 0,
      items: [],
    }

    // 按箱数从大到小排序，优先放入大的产品
    remainingItems.sort((a, b) => b.boxes - a.boxes)

    let i = 0
    while (i < remainingItems.length && newPallet.totalBoxes < maxBoxesPerPallet) {
      const item = remainingItems[i]

      if (newPallet.totalBoxes + item.boxes <= maxBoxesPerPallet) {
        // 完全放入
        newPallet.items.push(item)
        newPallet.totalBoxes += item.boxes
        newPallet.totalUnits += item.units
        remainingItems.splice(i, 1)
      } else if (newPallet.items.length === 0) {
        // 单个产品就超过限制，需要拆分产品
        const availableSpace = maxBoxesPerPallet
        const splitRatio = availableSpace / item.boxes

        const newItem = {
          ...item,
          boxes: availableSpace,
          units: Math.floor(item.units * splitRatio),
        }

        newPallet.items.push(newItem)
        newPallet.totalBoxes += newItem.boxes
        newPallet.totalUnits += newItem.units

        // 更新剩余产品
        item.boxes -= availableSpace
        item.units -= newItem.units

        if (item.boxes <= 0) {
          remainingItems.splice(i, 1)
        } else {
          i++
        }
      } else {
        i++
      }
    }

    if (newPallet.items.length > 0) {
      splitPallets.push(newPallet)
    }
  }

  return splitPallets
}

// 拆分混载产品种类超过6种的托盘
function splitMixedProductPallet(pallet, maxBoxesPerPallet) {
  const splitPallets = []
  let remainingItems = [...pallet.items]

  while (remainingItems.length > 0) {
    const newPallet = {
      totalBoxes: 0,
      totalUnits: 0,
      items: [],
    }

    // 按箱数从大到小排序
    remainingItems.sort((a, b) => b.boxes - a.boxes)

    let i = 0
    while (
      i < remainingItems.length &&
      newPallet.items.length < 6 &&
      newPallet.totalBoxes < maxBoxesPerPallet
    ) {
      const item = remainingItems[i]

      if (newPallet.totalBoxes + item.boxes <= maxBoxesPerPallet) {
        // 完全放入
        newPallet.items.push(item)
        newPallet.totalBoxes += item.boxes
        newPallet.totalUnits += item.units
        remainingItems.splice(i, 1)
      } else {
        i++
      }
    }

    if (newPallet.items.length > 0) {
      splitPallets.push(newPallet)
    } else {
      // 如果无法放入任何项目，强制放入第一个项目（可能需要拆分）
      if (remainingItems.length > 0) {
        const item = remainingItems[0]
        if (item.boxes > maxBoxesPerPallet) {
          // 拆分大产品
          const splitRatio = maxBoxesPerPallet / item.boxes
          const newItem = {
            ...item,
            boxes: maxBoxesPerPallet,
            units: Math.floor(item.units * splitRatio),
          }

          newPallet.items.push(newItem)
          newPallet.totalBoxes += newItem.boxes
          newPallet.totalUnits += newItem.units

          // 更新剩余产品
          item.boxes -= maxBoxesPerPallet
          item.units -= newItem.units

          if (item.boxes <= 0) {
            remainingItems.splice(0, 1)
          }
        } else {
          // 直接放入
          newPallet.items.push(item)
          newPallet.totalBoxes += item.boxes
          newPallet.totalUnits += item.units
          remainingItems.splice(0, 1)
        }

        splitPallets.push(newPallet)
      }
    }
  }

  return splitPallets
}

// 遗传算法核心实现
function runGeneticAlgorithm(products, maxBoxesPerPallet) {
  //    console.log('运行遗传算法，产品数量:', products.length, '最大箱数:', maxBoxesPerPallet)

  // 如果产品数量为0，直接返回空数组
  if (products.length === 0) return []

  // 如果只有一个产品，使用简单分配
  if (products.length === 1) {
    return simpleAllocation(products[0], maxBoxesPerPallet)
  }

  // 首先按目的地和日期分组
  const groupedProducts = groupProductsByDestinationAndDate(products)

  // 如果分组后每组只有一个产品，使用简单分配
  if (Object.keys(groupedProducts).length === products.length) {
    return products.flatMap((product) => simpleAllocation(product, maxBoxesPerPallet))
  }

  // 遗传算法参数
  const populationSize = 100 // 进一步增加种群大小以提高多样性
  const generations = 200 // 进一步增加迭代代数以提高收敛质量
  const initialMutationRate = 0.25 // 初始变异率较高，以增加探索能力
  const finalMutationRate = 0.05 // 最终变异率较低，以增加利用能力
  const crossoverRate = 0.9 // 增加交叉率以增加利用能力

  // 动态变异率 - 随着代数增加而减小
  const getMutationRate = (currentGen) => {
    return (
      initialMutationRate - (initialMutationRate - finalMutationRate) * (currentGen / generations)
    )
  }

  // 初始化种群
  let population = []

  // 添加一些按目的地和日期分组的解决方案
  population.push(generateDestinationBasedSolution(products, maxBoxesPerPallet))
  population.push(generateDateBasedSolution(products, maxBoxesPerPallet))
  population.push(generateProductBasedSolution(products, maxBoxesPerPallet))

  // 添加一些贪心算法生成的解决方案
  population.push(firstFitDecreasing([...products], maxBoxesPerPallet))
  population.push(bestFitDecreasing([...products], maxBoxesPerPallet))

  // 填充剩余的种群
  while (population.length < populationSize) {
    population.push(generateRandomSolution(products, maxBoxesPerPallet))
  }

  // 迭代进化
  // 保存历史最佳解
  let globalBestSolution = null
  let globalBestFitness = -1

  // 跟踪种群多样性
  let diversityHistory = []

  for (let gen = 0; gen < generations; gen++) {
    // 计算当前代的变异率
    const currentMutationRate = getMutationRate(gen)

    // 计算适应度
    const fitnessScores = population.map((solution) =>
      calculateFitness(solution, maxBoxesPerPallet),
    )

    // 找出当前代最佳解
    const bestIndex = fitnessScores.indexOf(Math.max(...fitnessScores))
    const bestSolution = population[bestIndex]
    const bestFitness = fitnessScores[bestIndex]

    // 更新全局最佳解
    if (bestFitness > globalBestFitness) {
      globalBestSolution = JSON.parse(JSON.stringify(bestSolution))
      globalBestFitness = bestFitness
    }

    // 计算种群多样性 (使用适应度标准差作为多样性度量)
    const avgFitness = fitnessScores.reduce((sum, f) => sum + f, 0) / fitnessScores.length
    const fitnessVariance =
      fitnessScores.reduce((sum, f) => sum + Math.pow(f - avgFitness, 2), 0) / fitnessScores.length
    const diversity = Math.sqrt(fitnessVariance)
    diversityHistory.push(diversity)

    // 选择
    const selectedIndices = selection(fitnessScores, populationSize)
    const selectedPopulation = selectedIndices.map((index) => population[index])

    // 新一代种群
    const newPopulation = []

    // 精英保留策略 - 保留全局最佳解和当前代最佳解
    newPopulation.push(JSON.parse(JSON.stringify(globalBestSolution)))
    if (bestSolution !== globalBestSolution) {
      newPopulation.push(JSON.parse(JSON.stringify(bestSolution)))
    }

    // 如果多样性过低，注入一些新的随机解
    const recentDiversity = diversityHistory.slice(-5)
    const avgRecentDiversity =
      recentDiversity.reduce((sum, d) => sum + d, 0) / recentDiversity.length

    if (avgRecentDiversity < 0.01 && gen > 50) {
      // 多样性太低，注入新的随机解
      const numNewSolutions = Math.floor(populationSize * 0.1) // 注入10%新解
      for (let i = 0; i < numNewSolutions; i++) {
        if (Math.random() < 0.5) {
          // 使用随机解
          newPopulation.push(generateRandomSolution(products, maxBoxesPerPallet))
        } else {
          // 使用基于目的地或日期的解决方案
          if (Math.random() < 0.5) {
            newPopulation.push(generateDestinationBasedSolution(products, maxBoxesPerPallet))
          } else {
            newPopulation.push(generateDateBasedSolution(products, maxBoxesPerPallet))
          }
        }
      }
    }

    // 交叉和变异
    while (newPopulation.length < populationSize) {
      // 选择父代 - 使用锦标赛选择
      const tournamentSize = 3
      let parent1Index = Math.floor(Math.random() * selectedPopulation.length)
      let parent2Index = Math.floor(Math.random() * selectedPopulation.length)

      // 锦标赛选择父代1
      for (let i = 0; i < tournamentSize - 1; i++) {
        const candidateIndex = Math.floor(Math.random() * selectedPopulation.length)
        const candidateFitness = calculateFitness(
          selectedPopulation[candidateIndex],
          maxBoxesPerPallet,
        )
        const currentFitness = calculateFitness(selectedPopulation[parent1Index], maxBoxesPerPallet)

        if (candidateFitness > currentFitness) {
          parent1Index = candidateIndex
        }
      }

      // 锦标赛选择父代2
      for (let i = 0; i < tournamentSize - 1; i++) {
        const candidateIndex = Math.floor(Math.random() * selectedPopulation.length)
        const candidateFitness = calculateFitness(
          selectedPopulation[candidateIndex],
          maxBoxesPerPallet,
        )
        const currentFitness = calculateFitness(selectedPopulation[parent2Index], maxBoxesPerPallet)

        if (candidateFitness > currentFitness) {
          parent2Index = candidateIndex
        }
      }

      let offspring

      // 交叉
      if (Math.random() < crossoverRate) {
        offspring = crossover(
          selectedPopulation[parent1Index],
          selectedPopulation[parent2Index],
          maxBoxesPerPallet,
        )
      } else {
        // 不交叉，直接复制更好的父代
        const parent1Fitness = calculateFitness(selectedPopulation[parent1Index], maxBoxesPerPallet)
        const parent2Fitness = calculateFitness(selectedPopulation[parent2Index], maxBoxesPerPallet)

        if (parent1Fitness > parent2Fitness) {
          offspring = JSON.parse(JSON.stringify(selectedPopulation[parent1Index]))
        } else {
          offspring = JSON.parse(JSON.stringify(selectedPopulation[parent2Index]))
        }
      }

      // 变异 - 使用当前代的动态变异率
      if (Math.random() < currentMutationRate) {
        offspring = mutate(offspring, maxBoxesPerPallet)
      }

      newPopulation.push(offspring)
    }

    // 更新种群
    population = newPopulation

    // 打印进度
    if (gen % 20 === 0 || gen === generations - 1) {
      // console.log(
      //   `遗传算法迭代 ${gen}/${generations}, 最佳适应度: ${bestFitness.toFixed(4)}, 平均适应度: ${avgFitness.toFixed(4)}, 多样性: ${diversity.toFixed(4)}, 变异率: ${currentMutationRate.toFixed(4)}`,
      // )
    }
  }

  // 计算最终适应度
  const finalFitnessScores = population.map((solution) =>
    calculateFitness(solution, maxBoxesPerPallet),
  )
  const bestIndex = finalFitnessScores.indexOf(Math.max(...finalFitnessScores))
  const currentBestSolution = population[bestIndex]
  const currentBestFitness = finalFitnessScores[bestIndex]

  // 比较当前最佳解和全局最佳解
  if (currentBestFitness > globalBestFitness) {
    // console.log('最终迭代产生了更好的解决方案，适应度:', currentBestFitness.toFixed(4))
    return currentBestSolution
  } else {
    // console.log('使用全局最佳解决方案，适应度:', globalBestFitness.toFixed(4))
    return globalBestSolution
  }
}

// 为单个产品生成简单分配
function simpleAllocation(product, maxBoxesPerPallet) {
  const totalBoxes = product.boxes
  const fullPallets = Math.floor(totalBoxes / maxBoxesPerPallet)
  const remainderBoxes = totalBoxes % maxBoxesPerPallet

  const pallets = []

  // 创建满载托盘
  for (let i = 0; i < fullPallets; i++) {
    const boxesInPallet = maxBoxesPerPallet
    const unitsInPallet = Math.ceil(boxesInPallet * (product.units / product.boxes))

    pallets.push({
      totalBoxes: boxesInPallet,
      totalUnits: unitsInPallet,
      items: [
        {
          ...product,
          boxes: boxesInPallet,
          units: unitsInPallet,
        },
      ],
    })
  }

  // 创建剩余托盘
  if (remainderBoxes > 0) {
    const unitsInPallet = Math.ceil(remainderBoxes * (product.units / product.boxes))

    pallets.push({
      totalBoxes: remainderBoxes,
      totalUnits: unitsInPallet,
      items: [
        {
          ...product,
          boxes: remainderBoxes,
          units: unitsInPallet,
        },
      ],
    })
  }

  return pallets
}

// 按目的地和日期对产品分组
function groupProductsByDestinationAndDate(products) {
  const groups = {}

  products.forEach((product) => {
    const destKey = product.destination_cd || 'unknown'
    const dateKey = product.shipping_date || 'unknown'
    const groupKey = `${destKey}-${dateKey}`

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(product)
  })

  return groups
}

// 生成基于目的地的解决方案
function generateDestinationBasedSolution(products, maxBoxesPerPallet) {
  // 按目的地分组
  const destGroups = {}
  products.forEach((product) => {
    const destKey = product.destination_cd || 'unknown'
    if (!destGroups[destKey]) {
      destGroups[destKey] = []
    }
    destGroups[destKey].push({ ...product })
  })

  // 对每个目的地组使用First Fit Decreasing
  const pallets = []
  Object.values(destGroups).forEach((group) => {
    // 按箱数从大到小排序
    group.sort((a, b) => b.boxes - a.boxes)
    const groupPallets = firstFitDecreasing(group, maxBoxesPerPallet)
    pallets.push(...groupPallets)
  })

  return pallets
}

// 生成基于日期的解决方案
function generateDateBasedSolution(products, maxBoxesPerPallet) {
  // 按日期分组
  const dateGroups = {}
  products.forEach((product) => {
    const dateKey = product.shipping_date || 'unknown'
    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = []
    }
    dateGroups[dateKey].push({ ...product })
  })

  // 对每个日期组使用First Fit Decreasing
  const pallets = []
  Object.values(dateGroups).forEach((group) => {
    // 按箱数从大到小排序
    group.sort((a, b) => b.boxes - a.boxes)
    const groupPallets = firstFitDecreasing(group, maxBoxesPerPallet)
    pallets.push(...groupPallets)
  })

  return pallets
}

// 生成基于产品的解决方案
function generateProductBasedSolution(products, maxBoxesPerPallet) {
  // 按产品ID分组
  const productGroups = {}
  products.forEach((product) => {
    const productKey = product.id
    if (!productGroups[productKey]) {
      productGroups[productKey] = { ...product }
    } else {
      productGroups[productKey].boxes += product.boxes
      productGroups[productKey].units += product.units
    }
  })

  // 将合并后的产品转换为数组
  const mergedProducts = Object.values(productGroups)

  // 对每个产品使用简单分配
  const pallets = []
  mergedProducts.forEach((product) => {
    const productPallets = simpleAllocation(product, maxBoxesPerPallet)
    pallets.push(...productPallets)
  })

  return pallets
}

// Best Fit Decreasing算法 - 优化版，增加混载产品限制
function bestFitDecreasing(products, maxBoxesPerPallet) {
  // 按箱数从大到小排序
  products.sort((a, b) => b.boxes - a.boxes)

  const pallets = []
  const remainingProducts = [...products]

  while (remainingProducts.length > 0) {
    // 取出第一个产品
    const currentProduct = remainingProducts.shift()

    // 尝试找到最佳托盘（剩余空间最小的托盘）
    let bestPalletIndex = -1
    let bestRemainingSpace = maxBoxesPerPallet + 1

    for (let i = 0; i < pallets.length; i++) {
      const pallet = pallets[i]
      const remainingSpace = maxBoxesPerPallet - pallet.totalBoxes

      // 检查混载产品种类限制（不超过6种）
      const existingProduct = pallet.items.find((item) => item.id === currentProduct.id)
      const wouldExceedProductLimit = !existingProduct && pallet.items.length >= 6

      if (
        !wouldExceedProductLimit &&
        remainingSpace >= currentProduct.boxes &&
        remainingSpace < bestRemainingSpace
      ) {
        bestPalletIndex = i
        bestRemainingSpace = remainingSpace
      }
    }

    // 如果找到合适的托盘
    if (bestPalletIndex !== -1) {
      const pallet = pallets[bestPalletIndex]

      // 检查是否有同一产品
      const sameProductItemIndex = pallet.items.findIndex((item) => item.id === currentProduct.id)

      if (sameProductItemIndex !== -1) {
        // 更新现有产品
        const item = pallet.items[sameProductItemIndex]
        item.boxes += currentProduct.boxes
        item.units += currentProduct.units
      } else {
        // 添加新产品
        pallet.items.push({ ...currentProduct })
      }

      // 更新托盘总数
      pallet.totalBoxes += currentProduct.boxes
      pallet.totalUnits += currentProduct.units
    } else {
      // 创建新托盘
      pallets.push({
        totalBoxes: currentProduct.boxes,
        totalUnits: currentProduct.units,
        items: [{ ...currentProduct }],
      })
    }
  }

  return pallets
}

// 生成随机解决方案
function generateRandomSolution(products, maxBoxesPerPallet) {
  // 深拷贝产品列表
  const productsCopy = JSON.parse(JSON.stringify(products))

  // 随机打乱产品顺序
  shuffleArray(productsCopy)

  // 随机选择分配策略
  const strategyChoice = Math.random()

  if (strategyChoice < 0.4) {
    // 使用First Fit Decreasing策略
    return firstFitDecreasing(productsCopy, maxBoxesPerPallet)
  } else if (strategyChoice < 0.8) {
    // 使用Best Fit Decreasing策略
    return bestFitDecreasing(productsCopy, maxBoxesPerPallet)
  } else {
    // 使用随机分组策略
    // 随机分组数量
    const numGroups = Math.max(1, Math.floor(Math.random() * Math.min(5, productsCopy.length)))
    const groups = Array(numGroups)
      .fill()
      .map(() => [])

    // 随机分配产品到组
    productsCopy.forEach((product) => {
      const groupIndex = Math.floor(Math.random() * numGroups)
      groups[groupIndex].push(product)
    })

    // 对每个组使用First Fit Decreasing
    const pallets = []
    groups.forEach((group) => {
      if (group.length > 0) {
        const groupPallets = firstFitDecreasing(group, maxBoxesPerPallet)
        pallets.push(...groupPallets)
      }
    })

    return pallets
  }
}

// 随机打乱数组
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

// First Fit Decreasing算法 - 优化版，增加混载产品限制
function firstFitDecreasing(products, maxBoxesPerPallet) {
  // 按箱数从大到小排序
  products.sort((a, b) => b.boxes - a.boxes)

  const pallets = []
  const remainingProducts = [...products]

  while (remainingProducts.length > 0) {
    // 取出第一个产品
    const currentProduct = remainingProducts.shift()

    // 尝试将产品放入现有托盘
    let placed = false

    // 首先尝试放入同一产品的托盘
    for (const pallet of pallets) {
      // 检查是否有同一产品的托盘且有足够空间
      const sameProductItem = pallet.items.find((item) => item.id === currentProduct.id)

      if (sameProductItem && pallet.totalBoxes + currentProduct.boxes <= maxBoxesPerPallet) {
        // 更新托盘信息
        pallet.totalBoxes += currentProduct.boxes
        pallet.totalUnits += currentProduct.units

        // 更新产品信息
        sameProductItem.boxes += currentProduct.boxes
        sameProductItem.units += currentProduct.units

        placed = true
        break
      }
    }

    // 如果没有放入同一产品的托盘，尝试放入任何有空间的托盘
    if (!placed) {
      for (const pallet of pallets) {
        // 检查混载产品种类限制（不超过6种）
        if (pallet.items.length >= 6) {
          continue
        }

        if (pallet.totalBoxes + currentProduct.boxes <= maxBoxesPerPallet) {
          // 更新托盘信息
          pallet.totalBoxes += currentProduct.boxes
          pallet.totalUnits += currentProduct.units

          // 添加新产品到托盘
          pallet.items.push({
            ...currentProduct,
          })

          placed = true
          break
        }
      }
    }

    // 如果无法放入任何现有托盘，创建新托盘
    if (!placed) {
      pallets.push({
        totalBoxes: currentProduct.boxes,
        totalUnits: currentProduct.units,
        items: [
          {
            ...currentProduct,
          },
        ],
      })
    }
  }

  return pallets
}

// 计算适应度 - 优化版，增加混载约束和箱数设定条件检查
function calculateFitness(solution, maxBoxesPerPallet) {
  // 计算托盘利用率
  const utilizationRates = solution.map((pallet) => pallet.totalBoxes / maxBoxesPerPallet)
  const avgUtilization = utilizationRates.reduce((sum, rate) => sum + rate, 0) / solution.length

  // 计算同一产品集中度
  let productConcentration = 0
  solution.forEach((pallet) => {
    if (pallet.items.length === 1) {
      // 单一产品托盘得高分
      productConcentration += 1
    } else {
      // 多种产品托盘，计算主要产品的比例
      const mainProduct = pallet.items.reduce(
        (max, item) => (item.boxes > max.boxes ? item : max),
        { boxes: 0 },
      )
      const mainProductRatio = mainProduct.boxes / pallet.totalBoxes
      productConcentration += mainProductRatio
    }
  })
  productConcentration /= solution.length

  // 检查混载产品种类约束（混载不超过6种）
  let mixedProductConstraint = 1
  solution.forEach((pallet) => {
    if (pallet.items.length > 6) {
      mixedProductConstraint *= 0.1 // 严重惩罚超过6种产品的托盘
    } else if (pallet.items.length > 1) {
      // 混载产品种类越少越好
      mixedProductConstraint *= (7 - pallet.items.length) / 6
    }
  })

  // 检查设定条件的箱数组合（优先生成正好等于设定容量的托盘）
  let capacityOptimization = 0
  solution.forEach((pallet) => {
    if (pallet.totalBoxes === maxBoxesPerPallet) {
      capacityOptimization += 1 // 满载托盘得高分
    } else {
      capacityOptimization += (pallet.totalBoxes / maxBoxesPerPallet) * 0.8 // 部分加载的托盘得分较低
    }
  })
  capacityOptimization /= solution.length

  // 计算同一目的地集中度
  const destinationGroups = new Map()
  solution.forEach((pallet) => {
    pallet.items.forEach((item) => {
      if (!item.destination_cd) return

      const destKey = item.destination_cd
      if (!destinationGroups.has(destKey)) {
        destinationGroups.set(destKey, new Set())
      }
      destinationGroups.get(destKey).add(pallet)
    })
  })

  // 目的地集中度 - 每个目的地使用的托盘数量越少越好
  let destinationConcentration = 0
  if (destinationGroups.size > 0) {
    let totalDestinationPallets = 0
    destinationGroups.forEach((pallets) => {
      totalDestinationPallets += pallets.size
    })
    // 平均每个目的地的托盘数量，越少越好
    destinationConcentration = destinationGroups.size / Math.max(1, totalDestinationPallets)
  }

  // 计算同一日期集中度
  const dateGroups = new Map()
  solution.forEach((pallet) => {
    pallet.items.forEach((item) => {
      if (!item.shipping_date) return

      const dateKey = item.shipping_date
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, new Set())
      }
      dateGroups.get(dateKey).add(pallet)
    })
  })

  // 日期集中度 - 每个日期使用的托盘数量越少越好
  let dateConcentration = 0
  if (dateGroups.size > 0) {
    let totalDatePallets = 0
    dateGroups.forEach((pallets) => {
      totalDatePallets += pallets.size
    })
    // 平均每个日期的托盘数量，越少越好
    dateConcentration = dateGroups.size / Math.max(1, totalDatePallets)
  }

  // 托盘数量惩罚因子
  const palletCountPenalty = 1 / (1 + solution.length * 0.05)

  // 综合适应度，优先考虑设定条件
  // 权重调整: 增加容量优化和混载约束的权重
  return (
    (0.2 * avgUtilization +
      0.2 * productConcentration +
      0.2 * capacityOptimization +
      0.15 * destinationConcentration +
      0.15 * dateConcentration) *
    mixedProductConstraint *
    palletCountPenalty
  )
}

// 选择操作
function selection(fitnessScores, populationSize) {
  // 轮盘赌选择
  const totalFitness = fitnessScores.reduce((sum, score) => sum + score, 0)
  const relativeFitness = fitnessScores.map((score) => score / totalFitness)

  // 累积概率
  const cumulativeProbabilities = []
  let sum = 0
  for (const fitness of relativeFitness) {
    sum += fitness
    cumulativeProbabilities.push(sum)
  }

  // 选择个体
  const selectedIndices = []
  for (let i = 0; i < populationSize; i++) {
    const r = Math.random()
    for (let j = 0; j < cumulativeProbabilities.length; j++) {
      if (r <= cumulativeProbabilities[j]) {
        selectedIndices.push(j)
        break
      }
    }
  }

  return selectedIndices
}

// 交叉操作
function crossover(parent1, parent2, maxBoxesPerPallet) {
  // 随机选择交叉类型
  const crossoverType = Math.random()

  if (crossoverType < 0.3) {
    // 标准交叉：合并产品后重新分配
    const productsMap = new Map()

    // 从父代1收集产品
    parent1.forEach((pallet) => {
      pallet.items.forEach((item) => {
        if (!productsMap.has(item.id)) {
          productsMap.set(item.id, { ...item, boxes: 0, units: 0 })
        }
        const product = productsMap.get(item.id)
        product.boxes += item.boxes
        product.units += item.units
      })
    })

    // 确保与父代2的产品总量一致
    parent2.forEach((pallet) => {
      pallet.items.forEach((item) => {
        if (!productsMap.has(item.id)) {
          productsMap.set(item.id, { ...item })
        }
      })
    })

    // 将产品转换为数组
    const products = Array.from(productsMap.values())

    // 随机打乱产品顺序
    shuffleArray(products)

    // 使用First Fit Decreasing重新分配
    return firstFitDecreasing(products, maxBoxesPerPallet)
  } else if (crossoverType < 0.6) {
    // 目的地优先交叉：尝试保留相同目的地的托盘
    // 从两个父代中提取托盘
    const pallets1 = JSON.parse(JSON.stringify(parent1))
    const pallets2 = JSON.parse(JSON.stringify(parent2))

    // 按目的地分组
    const destGroups1 = {}
    const destGroups2 = {}

    pallets1.forEach((pallet, idx) => {
      // 确定托盘的主要目的地
      const destCounts = {}
      pallet.items.forEach((item) => {
        const dest = item.destination_cd || 'unknown'
        destCounts[dest] = (destCounts[dest] || 0) + item.boxes
      })

      // 找出最多箱数的目的地
      let mainDest = 'unknown'
      let maxBoxes = 0

      for (const [dest, boxes] of Object.entries(destCounts)) {
        if (boxes > maxBoxes) {
          maxBoxes = boxes
          mainDest = dest
        }
      }

      if (!destGroups1[mainDest]) {
        destGroups1[mainDest] = []
      }
      destGroups1[mainDest].push(idx)
    })

    pallets2.forEach((pallet, idx) => {
      // 确定托盘的主要目的地
      const destCounts = {}
      pallet.items.forEach((item) => {
        const dest = item.destination_cd || 'unknown'
        destCounts[dest] = (destCounts[dest] || 0) + item.boxes
      })

      // 找出最多箱数的目的地
      let mainDest = 'unknown'
      let maxBoxes = 0

      for (const [dest, boxes] of Object.entries(destCounts)) {
        if (boxes > maxBoxes) {
          maxBoxes = boxes
          mainDest = dest
        }
      }

      if (!destGroups2[mainDest]) {
        destGroups2[mainDest] = []
      }
      destGroups2[mainDest].push(idx)
    })

    // 随机选择交换的目的地组
    const dests1 = Object.keys(destGroups1)
    const dests2 = Object.keys(destGroups2)

    if (dests1.length > 0 && dests2.length > 0) {
      const dest1 = dests1[Math.floor(Math.random() * dests1.length)]
      const dest2 = dests2[Math.floor(Math.random() * dests2.length)]

      // 提取选中的托盘
      const selectedPallets1 = destGroups1[dest1].map((idx) => pallets1[idx])
      const selectedPallets2 = destGroups2[dest2].map((idx) => pallets2[idx])

      // 从原列表中移除
      destGroups1[dest1]
        .sort((a, b) => b - a)
        .forEach((idx) => {
          pallets1.splice(idx, 1)
        })

      destGroups2[dest2]
        .sort((a, b) => b - a)
        .forEach((idx) => {
          pallets2.splice(idx, 1)
        })

      // 交换添加
      const child1 = [...pallets1, ...selectedPallets2]
      const child2 = [...pallets2, ...selectedPallets1]

      return Math.random() < 0.5 ? child1 : child2
    }
  }

  // 日期优先交叉
  // 从两个父代中提取托盘
  const pallets1 = JSON.parse(JSON.stringify(parent1))
  const pallets2 = JSON.parse(JSON.stringify(parent2))

  // 按日期分组
  const dateGroups1 = {}
  const dateGroups2 = {}

  pallets1.forEach((pallet, idx) => {
    // 确定托盘的主要日期
    const dateCounts = {}
    pallet.items.forEach((item) => {
      const date = item.shipping_date || 'unknown'
      dateCounts[date] = (dateCounts[date] || 0) + item.boxes
    })

    // 找出最多箱数的日期
    let mainDate = 'unknown'
    let maxBoxes = 0

    for (const [date, boxes] of Object.entries(dateCounts)) {
      if (boxes > maxBoxes) {
        maxBoxes = boxes
        mainDate = date
      }
    }

    if (!dateGroups1[mainDate]) {
      dateGroups1[mainDate] = []
    }
    dateGroups1[mainDate].push(idx)
  })

  pallets2.forEach((pallet, idx) => {
    // 确定托盘的主要日期
    const dateCounts = {}
    pallet.items.forEach((item) => {
      const date = item.shipping_date || 'unknown'
      dateCounts[date] = (dateCounts[date] || 0) + item.boxes
    })

    // 找出最多箱数的日期
    let mainDate = 'unknown'
    let maxBoxes = 0

    for (const [date, boxes] of Object.entries(dateCounts)) {
      if (boxes > maxBoxes) {
        maxBoxes = boxes
        mainDate = date
      }
    }

    if (!dateGroups2[mainDate]) {
      dateGroups2[mainDate] = []
    }
    dateGroups2[mainDate].push(idx)
  })

  // 随机选择交换的日期组
  const dates1 = Object.keys(dateGroups1)
  const dates2 = Object.keys(dateGroups2)

  if (dates1.length > 0 && dates2.length > 0) {
    const date1 = dates1[Math.floor(Math.random() * dates1.length)]
    const date2 = dates2[Math.floor(Math.random() * dates2.length)]

    // 提取选中的托盘
    const selectedPallets1 = dateGroups1[date1].map((idx) => pallets1[idx])
    const selectedPallets2 = dateGroups2[date2].map((idx) => pallets2[idx])

    // 从原列表中移除
    dateGroups1[date1]
      .sort((a, b) => b - a)
      .forEach((idx) => {
        pallets1.splice(idx, 1)
      })

    dateGroups2[date2]
      .sort((a, b) => b - a)
      .forEach((idx) => {
        pallets2.splice(idx, 1)
      })

    // 交换添加
    const child1 = [...pallets1, ...selectedPallets2]
    const child2 = [...pallets2, ...selectedPallets1]

    return Math.random() < 0.5 ? child1 : child2
  }

  // 如果前面的方法都失败，回退到默认方法
  return firstFitDecreasing(
    [...parent1.flatMap((p) => p.items), ...parent2.flatMap((p) => p.items)].slice(
      0,
      parent1.flatMap((p) => p.items).length,
    ),
    maxBoxesPerPallet,
  )
}

// 变异操作
function mutate(solution, maxBoxesPerPallet) {
  // 深拷贝解决方案
  const mutatedSolution = JSON.parse(JSON.stringify(solution))

  // 随机选择变异类型
  const mutationType = Math.floor(Math.random() * 3)

  switch (mutationType) {
    case 0:
      // 变异类型1: 随机交换两个托盘中的产品
      if (mutatedSolution.length >= 2) {
        const pallet1Index = Math.floor(Math.random() * mutatedSolution.length)
        let pallet2Index
        do {
          pallet2Index = Math.floor(Math.random() * mutatedSolution.length)
        } while (pallet1Index === pallet2Index)

        const pallet1 = mutatedSolution[pallet1Index]
        const pallet2 = mutatedSolution[pallet2Index]

        if (pallet1.items.length > 0 && pallet2.items.length > 0) {
          const item1Index = Math.floor(Math.random() * pallet1.items.length)
          const item2Index = Math.floor(Math.random() * pallet2.items.length)

          const item1 = pallet1.items[item1Index]
          const item2 = pallet2.items[item2Index]

          // 检查交换后是否超过托盘容量
          const pallet1NewBoxes = pallet1.totalBoxes - item1.boxes + item2.boxes
          const pallet2NewBoxes = pallet2.totalBoxes - item2.boxes + item1.boxes

          if (pallet1NewBoxes <= maxBoxesPerPallet && pallet2NewBoxes <= maxBoxesPerPallet) {
            // 更新托盘总数
            pallet1.totalBoxes = pallet1NewBoxes
            pallet1.totalUnits = pallet1.totalUnits - item1.units + item2.units

            pallet2.totalBoxes = pallet2NewBoxes
            pallet2.totalUnits = pallet2.totalUnits - item2.units + item1.units

            // 交换产品
            pallet1.items[item1Index] = item2
            pallet2.items[item2Index] = item1
          }
        }
      }
      break

    case 1:
      // 变异类型2: 随机将一个托盘中的产品移动到另一个托盘
      if (mutatedSolution.length >= 2) {
        const sourceIndex = Math.floor(Math.random() * mutatedSolution.length)
        const sourcePallet = mutatedSolution[sourceIndex]

        if (sourcePallet.items.length > 1) {
          const itemIndex = Math.floor(Math.random() * sourcePallet.items.length)
          const item = sourcePallet.items[itemIndex]

          // 寻找可以接收此产品的托盘
          const possibleTargets = mutatedSolution.filter(
            (p, idx) => idx !== sourceIndex && p.totalBoxes + item.boxes <= maxBoxesPerPallet,
          )

          if (possibleTargets.length > 0) {
            const targetPallet = possibleTargets[Math.floor(Math.random() * possibleTargets.length)]

            // 从源托盘移除
            sourcePallet.items.splice(itemIndex, 1)
            sourcePallet.totalBoxes -= item.boxes
            sourcePallet.totalUnits -= item.units

            // 添加到目标托盘
            targetPallet.items.push(item)
            targetPallet.totalBoxes += item.boxes
            targetPallet.totalUnits += item.units

            // 如果源托盘为空，移除它
            if (sourcePallet.items.length === 0) {
              mutatedSolution.splice(sourceIndex, 1)
            }
          }
        }
      }
      break

    case 2:
      // 变异类型3: 随机重新分配一个产品
      if (mutatedSolution.length > 0) {
        // 随机选择一个产品
        const productIds = new Set()
        mutatedSolution.forEach((pallet) => {
          pallet.items.forEach((item) => {
            productIds.add(item.id)
          })
        })

        const productIdArray = Array.from(productIds)
        if (productIdArray.length > 0) {
          const selectedProductId =
            productIdArray[Math.floor(Math.random() * productIdArray.length)]

          // 收集该产品的所有实例
          let totalBoxes = 0
          let totalUnits = 0
          let productTemplate = null

          // 从所有托盘中移除该产品
          for (let i = mutatedSolution.length - 1; i >= 0; i--) {
            const pallet = mutatedSolution[i]
            const itemIndices = []

            // 找出该产品在托盘中的所有实例
            pallet.items.forEach((item, idx) => {
              if (item.id === selectedProductId) {
                itemIndices.push(idx)
                totalBoxes += item.boxes
                totalUnits += item.units
                productTemplate = { ...item }
              }
            })

            // 从后向前移除，避免索引问题
            for (let j = itemIndices.length - 1; j >= 0; j--) {
              const idx = itemIndices[j]
              const item = pallet.items[idx]

              pallet.totalBoxes -= item.boxes
              pallet.totalUnits -= item.units
              pallet.items.splice(idx, 1)
            }

            // 如果托盘为空，移除它
            if (pallet.items.length === 0) {
              mutatedSolution.splice(i, 1)
            }
          }

          // 重新分配该产品
          if (productTemplate && totalBoxes > 0) {
            // 创建新产品实例
            const newProduct = {
              ...productTemplate,
              boxes: totalBoxes,
              units: totalUnits,
            }

            // 使用First Fit策略分配
            let placed = false

            // 尝试放入现有托盘
            for (const pallet of mutatedSolution) {
              if (pallet.totalBoxes + newProduct.boxes <= maxBoxesPerPallet) {
                pallet.items.push(newProduct)
                pallet.totalBoxes += newProduct.boxes
                pallet.totalUnits += newProduct.units
                placed = true
                break
              }
            }

            // 如果无法放入现有托盘，创建新托盘
            if (!placed) {
              mutatedSolution.push({
                totalBoxes: newProduct.boxes,
                totalUnits: newProduct.units,
                items: [newProduct],
              })
            }
          }
        }
      }
      break
  }

  return mutatedSolution
}

// 托盘合并优化函数
function optimizePalletsByMerging(pallets) {
  console.log('开始托盘合并优化，初始托盘数量:', pallets.length)

  // 按箱种分组处理
  const boxTypeGroups = {}
  pallets.forEach((pallet, index) => {
    const boxType = pallet.box_type || 'default'
    if (!boxTypeGroups[boxType]) {
      boxTypeGroups[boxType] = []
    }
    boxTypeGroups[boxType].push({ ...pallet, originalIndex: index })
  })

  const optimizedPallets = []

  Object.entries(boxTypeGroups).forEach(([boxType, typePallets]) => {
    console.log(`处理箱种 ${boxType}，托盘数量: ${typePallets.length}`)

    // 根据箱种确定合并阈值和最大容量
    let mergeThreshold, maxCapacity, maxVarieties
    if (boxType === '小箱') {
      mergeThreshold = 8
      maxCapacity = 40
      maxVarieties = 6
    } else if (boxType === '大箱') {
      mergeThreshold = 8
      maxCapacity = 24
      maxVarieties = 6
    } else if (boxType === 'TP箱') {
      mergeThreshold = 8
      maxCapacity = boxSettings.value.TP箱 || 20
      maxVarieties = 6
    } else if (boxType === '段ボール') {
      maxCapacity = boxSettings.value.段ボール || 40
      maxVarieties = 6
    } else if (boxType === '加工箱') {
      maxCapacity = boxSettings.value.加工箱 || 18
      maxVarieties = 6
    } else {
      mergeThreshold = 8
      maxCapacity = boxSettings.value.default || 40
      maxVarieties = 6
    }

    // 找出需要合并的小托盘
    const smallPallets = []
    const normalPallets = []

    typePallets.forEach((pallet) => {
      if (pallet.confirmed_boxes <= mergeThreshold) {
        smallPallets.push(pallet)
      } else {
        normalPallets.push(pallet)
      }
    })

    console.log(
      `箱种 ${boxType} - 小托盘: ${smallPallets.length}, 正常托盘: ${normalPallets.length}`,
    )

    // 尝试将小托盘合并到正常托盘中
    const remainingSmallPallets = [...smallPallets]

    normalPallets.forEach((targetPallet) => {
      for (let i = remainingSmallPallets.length - 1; i >= 0; i--) {
        const smallPallet = remainingSmallPallets[i]

        // 检查是否可以合并（同一出荷日期和纳入先）
        if (
          targetPallet.shipping_date === smallPallet.shipping_date &&
          targetPallet.destination_cd === smallPallet.destination_cd
        ) {
          // 检查合并后是否超过容量限制
          const totalBoxes = targetPallet.confirmed_boxes + smallPallet.confirmed_boxes

          // 计算合并后的产品种类数
          const targetVarieties = new Set()
          const smallVarieties = new Set()

          if (targetPallet.detail && targetPallet.detail.length > 0) {
            targetPallet.detail.forEach((item) => targetVarieties.add(item.product_cd))
          } else {
            targetVarieties.add(targetPallet.product_cd)
          }

          if (smallPallet.detail && smallPallet.detail.length > 0) {
            smallPallet.detail.forEach((item) => smallVarieties.add(item.product_cd))
          } else {
            smallVarieties.add(smallPallet.product_cd)
          }

          const totalVarieties = new Set([...targetVarieties, ...smallVarieties]).size

          if (totalBoxes <= maxCapacity && totalVarieties <= maxVarieties) {
            console.log(
              `合并小托盘到正常托盘: ${smallPallet.shipping_no_prefix}${smallPallet.shipping_no_serial} -> ${targetPallet.shipping_no_prefix}${targetPallet.shipping_no_serial}`,
            )

            // 执行合并
            targetPallet.confirmed_boxes = totalBoxes
            targetPallet.confirmed_units += smallPallet.confirmed_units

            // 合并详细信息
            if (!targetPallet.detail) {
              targetPallet.detail = [
                {
                  product_cd: targetPallet.product_cd,
                  product_name: targetPallet.product_name,
                  box_type: targetPallet.box_type,
                  confirmed_boxes: targetPallet.confirmed_boxes - smallPallet.confirmed_boxes,
                  confirmed_units: targetPallet.confirmed_units - smallPallet.confirmed_units,
                  delivery_date: targetPallet.delivery_date,
                  shipping_date: targetPallet.shipping_date,
                },
              ]
            }

            if (smallPallet.detail && smallPallet.detail.length > 0) {
              targetPallet.detail.push(...smallPallet.detail)
            } else {
              targetPallet.detail.push({
                product_cd: smallPallet.product_cd,
                product_name: smallPallet.product_name,
                box_type: smallPallet.box_type,
                confirmed_boxes: smallPallet.confirmed_boxes,
                confirmed_units: smallPallet.confirmed_units,
                delivery_date: smallPallet.delivery_date,
                shipping_date: smallPallet.shipping_date,
              })
            }

            // 更新托盘信息
            if (targetPallet.detail.length > 1) {
              targetPallet.product_name = targetPallet.detail
                .map((item) => item.product_name)
                .join(',')
              targetPallet.product_cd = targetPallet.detail.map((item) => item.product_cd).join(',')
              targetPallet.remarks = '混載パレット'
            }

            // 从待合并列表中移除
            remainingSmallPallets.splice(i, 1)
            break
          }
        }
      }
    })

    // 对剩余的小托盘尝试相互合并
    const mergedSmallPallets = []
    const processedIndices = new Set()

    for (let i = 0; i < remainingSmallPallets.length; i++) {
      if (processedIndices.has(i)) continue

      const basePallet = { ...remainingSmallPallets[i] }
      processedIndices.add(i)

      // 初始化detail
      if (!basePallet.detail) {
        basePallet.detail = [
          {
            product_cd: basePallet.product_cd,
            product_name: basePallet.product_name,
            box_type: basePallet.box_type,
            confirmed_boxes: basePallet.confirmed_boxes,
            confirmed_units: basePallet.confirmed_units,
            delivery_date: basePallet.delivery_date,
            shipping_date: basePallet.shipping_date,
          },
        ]
      }

      // 尝试与其他小托盘合并
      for (let j = i + 1; j < remainingSmallPallets.length; j++) {
        if (processedIndices.has(j)) continue

        const candidatePallet = remainingSmallPallets[j]

        // 检查是否可以合并
        if (
          basePallet.shipping_date === candidatePallet.shipping_date &&
          basePallet.destination_cd === candidatePallet.destination_cd
        ) {
          const totalBoxes = basePallet.confirmed_boxes + candidatePallet.confirmed_boxes

          // 计算种类数
          const varieties = new Set()
          basePallet.detail.forEach((item) => varieties.add(item.product_cd))

          if (candidatePallet.detail && candidatePallet.detail.length > 0) {
            candidatePallet.detail.forEach((item) => varieties.add(item.product_cd))
          } else {
            varieties.add(candidatePallet.product_cd)
          }

          if (totalBoxes <= maxCapacity && varieties.size <= maxVarieties) {
            console.log(
              `合并小托盘: ${candidatePallet.shipping_no_prefix}${candidatePallet.shipping_no_serial} -> ${basePallet.shipping_no_prefix}${basePallet.shipping_no_serial}`,
            )

            // 执行合并
            basePallet.confirmed_boxes = totalBoxes
            basePallet.confirmed_units += candidatePallet.confirmed_units

            // 合并详细信息
            if (candidatePallet.detail && candidatePallet.detail.length > 0) {
              basePallet.detail.push(...candidatePallet.detail)
            } else {
              basePallet.detail.push({
                product_cd: candidatePallet.product_cd,
                product_name: candidatePallet.product_name,
                box_type: candidatePallet.box_type,
                confirmed_boxes: candidatePallet.confirmed_boxes,
                confirmed_units: candidatePallet.confirmed_units,
                delivery_date: candidatePallet.delivery_date,
                shipping_date: candidatePallet.shipping_date,
              })
            }

            processedIndices.add(j)
          }
        }
      }

      // 更新合并后的托盘信息
      if (basePallet.detail.length > 1) {
        basePallet.product_name = basePallet.detail.map((item) => item.product_name).join(',')
        basePallet.product_cd = basePallet.detail.map((item) => item.product_cd).join(',')
        basePallet.remarks = '混載パレット'
      }

      mergedSmallPallets.push(basePallet)
    }

    // 添加到结果中
    optimizedPallets.push(...normalPallets, ...mergedSmallPallets)
  })

  // 重新分配托盘编号
  const groupedByDestDate = {}
  optimizedPallets.forEach((pallet) => {
    const key = `${pallet.shipping_date}-${pallet.destination_cd}`
    if (!groupedByDestDate[key]) {
      groupedByDestDate[key] = []
    }
    groupedByDestDate[key].push(pallet)
  })

  Object.values(groupedByDestDate).forEach((group) => {
    group.forEach((pallet, index) => {
      pallet.shipping_no_serial = String(index + 1).padStart(2, '0')
    })
  })

  console.log(`托盘合并优化完成，优化前: ${pallets.length}，优化后: ${optimizedPallets.length}`)
  return optimizedPallets
}

function formatSerialForDisplay(serial) {
  if (serial === null || serial === undefined) {
    return '01'
  }
  const numValue = parseInt(serial) || 1
  return numValue.toString().padStart(2, '0')
}

// 批量检查重复项目
function findDuplicatesInBatch(items) {
  const seen = new Map()
  const duplicates = []

  items.forEach((item, index) => {
    const key = generateItemKey(item)

    if (seen.has(key)) {
      duplicates.push({
        item,
        index,
        originalIndex: seen.get(key).index,
        key,
      })
    } else {
      seen.set(key, { item, index })
    }
  })

  return duplicates
}

// 检查项目与现有项目的冲突情况
function checkItemConflicts(item) {
  const itemKey = generateItemKey(item)
  const conflicts = []

  selectedItems.value.forEach((existing, index) => {
    const existingKey = generateItemKey(existing)

    if (existingKey === itemKey) {
      conflicts.push({
        type: isDuplicateItem(item, existing) ? 'exact' : 'similar',
        existing,
        index,
        details: {
          newBoxes: item.confirmed_boxes,
          newUnits: item.confirmed_units,
          existingBoxes: existing.confirmed_boxes,
          existingUnits: existing.confirmed_units,
        },
      })
    }
  })

  return conflicts
}

// 获取重复检查统计信息
function getDuplicateStats(items) {
  const stats = {
    total: items.length,
    processed: 0,
    exactDuplicates: 0,
    similarItems: 0,
    batchDuplicates: 0,
    valid: 0,
  }

  // 检查已处理项目
  items.forEach((item) => {
    if (item.shipping_no) {
      stats.processed++
      return
    }

    const conflicts = checkItemConflicts(item)
    if (conflicts.length > 0) {
      const hasExact = conflicts.some((c) => c.type === 'exact')
      if (hasExact) {
        stats.exactDuplicates++
      } else {
        stats.similarItems++
      }
    } else {
      stats.valid++
    }
  })

  // 检查批次内重复
  const batchDuplicates = findDuplicatesInBatch(items.filter((item) => !item.shipping_no))
  stats.batchDuplicates = batchDuplicates.length

  return stats
}

// 条件分解アルゴリズム - 分解のみ、組み合わせなし
function allocatePalletsDecomposeOnly(items, boxCapacitySettings) {
  console.log('条件分解アルゴリズムを使用、項目数量:', items.length)

  const allPallets = []

  // 各項目を個別に処理（組み合わせは一切行わない）
  items.forEach((item) => {
    const boxType = item.box_type || 'default'
    const maxBoxesPerPallet = boxCapacitySettings[boxType] || boxCapacitySettings.default

    console.log(
      `製品 ${item.product_cd} (箱種: ${boxType}): 箱数 ${item.confirmed_boxes}, 最大容量: ${maxBoxesPerPallet}`,
    )

    // 各項目に対して個別にパレットを作成
    const productPallets = createSingleProductPallets(item, maxBoxesPerPallet, boxType)
    allPallets.push(...productPallets)
  })

  console.log(`条件分解アルゴリズム完了、生成されたパレット数: ${allPallets.length}`)
  return allPallets
}

// 単一製品用のパレット作成（組み合わせなし、パレット番号なし）
function createSingleProductPallets(item, maxBoxesPerPallet, boxType) {
  const pallets = []
  const totalBoxes = item.confirmed_boxes || 0
  const totalUnits = item.confirmed_units || 0

  if (totalBoxes <= 0) {
    console.log(`製品 ${item.product_cd}: 箱数が0のためスキップ`)
    return pallets
  }

  // 1箱あたりの製品数量
  const unitsPerBox = totalBoxes > 0 ? Math.ceil(totalUnits / totalBoxes) : 20

  // 必要なパレット数を計算
  const fullPallets = Math.floor(totalBoxes / maxBoxesPerPallet)
  const remainderBoxes = totalBoxes % maxBoxesPerPallet

  console.log(
    `製品 ${item.product_cd}: 総箱数 ${totalBoxes}, 完全パレット ${fullPallets}, 残り ${remainderBoxes}`,
  )

  // 完全パレットを作成
  for (let i = 0; i < fullPallets; i++) {
    const pallet = {
      product_cd: item.product_cd,
      product_name: item.product_name,
      destination_cd: item.destination_cd,
      destination_name: item.destination_name,
      shipping_date: item.shipping_date,
      delivery_date: item.delivery_date,
      box_type: boxType === 'default' ? '-' : boxType,
      confirmed_boxes: maxBoxesPerPallet,
      confirmed_units: maxBoxesPerPallet * unitsPerBox,
      unit: '本',
      remarks: '条件分解のみ',
      // パレット番号は空のまま（後で手動設定）
      shipping_no_prefix: '',
      shipping_no_serial: '',
      detail: [
        {
          product_cd: item.product_cd,
          product_name: item.product_name,
          box_type: boxType === 'default' ? '-' : boxType,
          confirmed_boxes: maxBoxesPerPallet,
          confirmed_units: maxBoxesPerPallet * unitsPerBox,
          delivery_date: item.delivery_date,
          shipping_date: item.shipping_date,
        },
      ],
    }
    pallets.push(pallet)
  }

  // 残りパレットを作成
  if (remainderBoxes > 0) {
    const pallet = {
      product_cd: item.product_cd,
      product_name: item.product_name,
      destination_cd: item.destination_cd,
      destination_name: item.destination_name,
      shipping_date: item.shipping_date,
      delivery_date: item.delivery_date,
      box_type: boxType === 'default' ? '-' : boxType,
      confirmed_boxes: remainderBoxes,
      confirmed_units: remainderBoxes * unitsPerBox,
      unit: '本',
      remarks: '条件分解のみ',
      // パレット番号は空のまま（後で手動設定）
      shipping_no_prefix: '',
      shipping_no_serial: '',
      detail: [
        {
          product_cd: item.product_cd,
          product_name: item.product_name,
          box_type: boxType === 'default' ? '-' : boxType,
          confirmed_boxes: remainderBoxes,
          confirmed_units: remainderBoxes * unitsPerBox,
          delivery_date: item.delivery_date,
          shipping_date: item.shipping_date,
        },
      ],
    }
    pallets.push(pallet)
  }

  return pallets
}

// 显示托盘编辑对话框
function showPalletEditDialog() {
  if (pallets.value.length === 0) {
    ElMessage.warning('編集するパレットがありません')
    return
  }
  palletEditDialogVisible.value = true
}

// 更新目的地名称
function updateDestinationName(row) {
  const destination = destinationOptions.value.find((dest) => dest.value === row.destination_cd)
  if (destination) {
    row.destination_name = destination.label.split(' - ')[1] || destination.label
  }
}

// 验证托盘序列号
function validatePalletSerial(index) {
  const pallet = pallets.value[index]
  if (pallet.shipping_no_serial) {
    // 确保序列号是数字且格式正确
    const serial = pallet.shipping_no_serial.toString().replace(/\D/g, '')
    if (serial) {
      pallet.shipping_no_serial = serial.padStart(2, '0')
    }
  }
}

// 更新托盘数量
function updatePalletUnits(row) {
  // 根据箱数自动计算数量
  if (row.detail && row.detail.length > 0) {
    // 如果是混载托盘，更新detail中的数量
    const totalBoxes = row.confirmed_boxes
    const originalTotalBoxes = row.detail.reduce((sum, item) => sum + item.confirmed_boxes, 0)

    if (originalTotalBoxes > 0) {
      // 按比例分配箱数
      let remainingBoxes = totalBoxes
      row.detail.forEach((item, index) => {
        if (index === row.detail.length - 1) {
          // 最后一个项目分配剩余的箱数
          item.confirmed_boxes = remainingBoxes
        } else {
          const ratio = item.confirmed_boxes / originalTotalBoxes
          const newBoxes = Math.floor(totalBoxes * ratio)
          item.confirmed_boxes = newBoxes
          remainingBoxes -= newBoxes
        }

        // 重新计算数量
        const unitsPerBox = item.confirmed_units / (item.confirmed_boxes || 1)
        item.confirmed_units = Math.ceil(item.confirmed_boxes * unitsPerBox)
      })

      // 更新总数量
      row.confirmed_units = row.detail.reduce((sum, item) => sum + item.confirmed_units, 0)
    }
  } else {
    // 单一产品托盘，使用默认的每箱数量
    const unitsPerBox = settings.value.unitsPerBox || 20
    row.confirmed_units = row.confirmed_boxes * unitsPerBox
  }
}

// 复制托盘
function duplicatePallet(row, index) {
  const newPallet = JSON.parse(JSON.stringify(row))

  // 清空托盘编号序列号，需要用户手动设置
  newPallet.shipping_no_serial = ''

  // 添加复制标识
  newPallet.remarks = (newPallet.remarks || '') + ' (複製)'

  // 如果有详细信息，也需要深拷贝
  if (newPallet.detail) {
    newPallet.detail = JSON.parse(JSON.stringify(newPallet.detail))
  }

  // 插入到当前行的下一行
  pallets.value.splice(index + 1, 0, newPallet)

  ElMessage.success('パレットを複製しました')
}

// 删除托盘
function deletePallet(index) {
  if (pallets.value.length <= 1) {
    ElMessage.warning('最低1つのパレットが必要です')
    return
  }

  ElMessageBox.confirm('このパレットを削除しますか？', '削除確認', {
    confirmButtonText: '削除',
    cancelButtonText: 'キャンセル',
    type: 'warning',
  })
    .then(() => {
      const deletedPallet = pallets.value[index]
      pallets.value.splice(index, 1)

      ElMessage.success(
        `パレット ${deletedPallet.shipping_no_prefix}${deletedPallet.shipping_no_serial || ''} を削除しました`,
      )
    })
    .catch(() => {
      // 用户取消删除
    })
}

// 应用托盘变更
function applyPalletChanges() {
  // 验证托盘数据
  const errors = []

  pallets.value.forEach((pallet, index) => {
    const palletNumber = index + 1

    if (!pallet.shipping_date) {
      errors.push(`パレット ${palletNumber}: 出荷日が設定されていません`)
    }
    if (!pallet.destination_cd) {
      errors.push(`パレット ${palletNumber}: 納入先が設定されていません`)
    }
    if (!pallet.confirmed_boxes || pallet.confirmed_boxes <= 0) {
      errors.push(`パレット ${palletNumber}: 箱数が正しく設定されていません`)
    }
    if (!pallet.confirmed_units || pallet.confirmed_units <= 0) {
      errors.push(`パレット ${palletNumber}: 数量が正しく設定されていません`)
    }
  })

  if (errors.length > 0) {
    ElMessageBox.alert(errors.join('\n'), 'データ検証エラー', {
      confirmButtonText: 'OK',
      type: 'error',
      customClass: 'validation-error-dialog',
    })
    return
  }

  // 检查重复的托盘编号
  const palletNumbers = new Map()
  const duplicateNumbers = []

  pallets.value.forEach((pallet, index) => {
    if (pallet.shipping_no_serial) {
      const fullNumber = `${pallet.shipping_no_prefix}${pallet.shipping_no_serial}`
      if (palletNumbers.has(fullNumber)) {
        duplicateNumbers.push(`パレット ${index + 1}: ${fullNumber}`)
      } else {
        palletNumbers.add(fullNumber, index + 1)
      }
    }
  })

  if (duplicateNumbers.length > 0) {
    ElMessageBox.confirm(
      `以下のパレット番号が重複しています：\n${duplicateNumbers.join('\n')}\n\n続行しますか？`,
      '重複警告',
      {
        confirmButtonText: '続行',
        cancelButtonText: 'キャンセル',
        type: 'warning',
        customClass: 'duplicate-warning-dialog',
      },
    )
      .then(() => {
        applyChangesAndClose()
      })
      .catch(() => {
        // 用户取消
      })
  } else {
    applyChangesAndClose()
  }
}

// 应用变更并关闭对话框
function applyChangesAndClose() {
  // 重新计算相关数据
  try {
    // 更新托盘的前缀（如果日期或目的地发生变化）
    pallets.value.forEach((pallet) => {
      if (pallet.shipping_date && pallet.destination_cd) {
        const dateStr = formatShippingDateForPallet(pallet)
        if (dateStr) {
          pallet.shipping_no_prefix = `${dateStr}${pallet.destination_cd}`
        }
      }
    })

    // 触发重新计算总数等
    // 这里可以添加额外的业务逻辑

    palletEditDialogVisible.value = false
    ElMessage.success({
      message: 'パレットの変更を適用しました',
      type: 'success',
      duration: 3000,
    })

    console.log('パレット編集完了:', pallets.value)
  } catch (error) {
    console.error('パレット変更適用エラー:', error)
    ElMessage.error('変更の適用中にエラーが発生しました')
  }
}
</script>

<style scoped>
/* 对话框整体样式 */
:deep(.shipping-dialog) {
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

:deep(.shipping-dialog .el-dialog__header) {
  padding: 0;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.shipping-dialog .el-dialog__body) {
  padding: 0;
}

:deep(.shipping-dialog .el-dialog__footer) {
  padding: 8px 20px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
}

/* 对话框头部 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: linear-gradient(135deg, #667eea 0%, #ebcd23 100%);
  color: white;
  border-radius: 8px 8px 0 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 24px;
  color: #fff;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 12px;
}

.header-stats .el-tag {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  font-weight: 500;
}

/* 主要内容区域 */
.shipping-creator {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  padding: 8px;
  background: #f8f9fa;
}

.pool-container {
  display: flex;
  gap: 12px;
  height: 100%;
  min-height: 600px;
}

.left-pool,
.right-pool {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.pool-header {
  background: linear-gradient(135deg, #667eea 0%, #969c37 100%);
  color: white;
  padding: 8px 8px;
  border-bottom: 1px solid #e9ecef;
}

.pool-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.pool-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pool-icon {
  font-size: 18px;
}

.pool-content {
  flex: 1;
  padding: 8px;
  overflow: auto;
}

.pool-footer {
  padding: 8px 8px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: center;
}

/* 筛选区域 */
.filter-section {
  margin-top: 5px;
}

.filter-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.filter-card .el-card__body) {
  padding: 5px;
}

.filter-form-compact {
  width: 100%;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.filter-label {
  font-size: 12px;
  font-weight: 500;
  color: white;
  min-width: fit-content;
}

.filter-actions {
  margin-left: auto;
}

.reset-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 12px;
  padding: 3px 4px;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 设置区域 */
.shipping-settings {
  margin-top: 5px;
}

.settings-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.settings-card .el-card__body) {
  padding: 5px;
}

.settings-section {
  margin-bottom: 4px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.section-icon {
  font-size: 14px;
}

.help-icon {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  cursor: help;
}

.capacity-item,
.algorithm-item {
  margin-bottom: 4px;
}

:deep(.capacity-item .el-form-item__label),
:deep(.algorithm-item .el-form-item__label) {
  font-size: 12px;
  color: white;
  font-weight: 500;
}

.settings-divider {
  margin: 5px 0;
  border-color: rgba(255, 255, 255, 0.2);
}

.recalculate-btn {
  background: rgba(103, 194, 58, 0.8);
  border: 1px solid rgba(103, 194, 58, 0.3);
  color: white;
  font-size: 12px;
}

.recalculate-btn:hover {
  background: rgba(103, 194, 58, 1);
}

/* 表格样式 */
.table-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.orders-table),
:deep(.selected-items-table),
:deep(.pallets-table) {
  font-size: 11px;
}

:deep(.orders-table .el-table__header),
:deep(.selected-items-table .el-table__header),
:deep(.pallets-table .el-table__header) {
  font-size: 11px;
  font-weight: 600;
}

:deep(.orders-table .el-table__header th),
:deep(.selected-items-table .el-table__header th),
:deep(.pallets-table .el-table__header th) {
  background-color: #f5f7fa;
  color: #606266;
  font-size: 11px;
  padding: 1px 0;
  border-bottom: 1px solid #ebeef5;
}

:deep(.orders-table .el-table__body),
:deep(.selected-items-table .el-table__body),
:deep(.pallets-table .el-table__body) {
  font-size: 11px;
}

:deep(.orders-table .el-table__body td),
:deep(.selected-items-table .el-table__body td),
:deep(.pallets-table .el-table__body td) {
  font-size: 11px;
  padding: 1px 0;
}

:deep(.orders-table .el-table__body tr:hover),
:deep(.selected-items-table .el-table__body tr:hover),
:deep(.pallets-table .el-table__body tr:hover) {
  background-color: #f8f9fa;
}

:deep(.orders-table .el-text),
:deep(.selected-items-table .el-text),
:deep(.pallets-table .el-text) {
  font-size: 11px;
}

.number-text {
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 11px;
}

.placeholder-text {
  color: #adb5bd;
  font-style: italic;
  font-size: 11px;
}

/* 按钮样式 */
.action-btn {
  border-radius: 50%;
  transition: all 0.3s ease;
  width: 24px;
  height: 24px;
  padding: 0;
}

.action-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.add-selected-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.add-selected-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

/* 选择项目区域 */
.selected-items-section {
  margin-bottom: 5px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  padding-bottom: 1px;
  border-bottom: 2px solid #e9ecef;
}

.section-header .section-title {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

/* 托盘区域 */
.pallets-section {
  margin-top: 1px;
}

.pallets-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1px;
  padding: 2px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.pallets-section .section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 8px;
}

.allocation-summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 托盘编号控制 */
.number-input-with-controls {
  display: flex;
  align-items: center;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  width: fit-content;
  background: rgb(243, 199, 103);
}

.number-input-with-controls .el-input {
  margin: 0;
}

:deep(.number-input-with-controls .el-input__wrapper) {
  border: none;
  border-radius: 0;
  box-shadow: none;
}

:deep(.number-input-with-controls .el-input__inner) {
  text-align: center;
  padding: 0 8px;
  height: 20px;
  font-size: 11px;
  font-weight: 600;
}

.control-button {
  height: 20px;
  width: 20px;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  background: #f5f7fa;
  border: none;
  transition: all 0.2s ease;
}

.control-button:hover {
  background-color: #e4e7ed;
  color: #409eff;
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  transform: translateY(-1px);
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 8px 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

/* 状态行样式 */
:deep(.processed-row) {
  background-color: #f0f9eb !important;
  color: #909399;
}

:deep(.selected-row) {
  background-color: #e1f3ff !important;
  color: #606266;
}

:deep(.shipped-row) {
  background-color: #f4f4f5 !important;
  color: #909399;
}

/* 空状态样式 */
:deep(.el-empty) {
  padding: 10px 0;
}

:deep(.el-empty__description) {
  color: #6c757d;
  font-size: 13px;
}

/* 工具提示样式 */
.pallet-detail-tooltip {
  max-height: 300px;
  overflow-y: auto;
  background: rgb(221, 146, 6);
  border-radius: 8px;
  padding: 5px;
}

.pallet-detail-tooltip h4 {
  color: #495057;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 8px;
}

.pallet-detail-tooltip table {
  border-radius: 6px;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .pool-container {
    flex-direction: column;
    gap: 12px;
  }

  .left-pool,
  .right-pool {
    min-height: 350px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .filter-actions {
    margin-left: 0;
    align-self: flex-end;
  }
}

/* 标签样式增强 */
:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
  font-size: 11px;
  padding: 2px 6px;
}

:deep(.el-tag.el-tag--info.el-tag--light) {
  background-color: rgba(144, 147, 153, 0.1);
  border-color: rgba(144, 147, 153, 0.2);
  color: #606266;
}

:deep(.el-tag.el-tag--success.el-tag--light) {
  background-color: rgba(103, 194, 58, 0.1);
  border-color: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

:deep(.el-tag.el-tag--primary.el-tag--light) {
  background-color: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

:deep(.el-tag.el-tag--warning.el-tag--light) {
  background-color: rgba(230, 162, 60, 0.1);
  border-color: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

:deep(.el-tag.el-tag--danger.el-tag--light) {
  background-color: rgba(245, 108, 108, 0.1);
  border-color: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

/* 加载状态 */
:deep(.el-loading-mask) {
  border-radius: 8px;
}

/* 表格汇总行样式 */
:deep(.el-table__footer) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  font-size: 11px;
}

:deep(.el-table__footer td) {
  color: #495057;
  padding: 6px 0;
}

/* 对话框头部样式 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
  color: #409eff;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-stats {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 表格行高优化 */
:deep(.el-table .el-table__row) {
  height: 20px;
}

:deep(.el-table .el-table__header-wrapper .el-table__header tr) {
  height: 20px;
}

:deep(.el-table__footer-wrapper .el-table__footer tr) {
  height: 20px;
}

/* パレット番号输入框样式优化 */
:deep(.el-input-number) {
  background: rgb(248, 191, 67);
}

:deep(.el-input-number .el-input__wrapper) {
  background-color: white !important;
  border: 1px solid #dcdfe6 !important;
  box-shadow: none !important;
}

:deep(.el-input-number .el-input__inner) {
  background-color: white !important;
  color: #303133 !important;
  font-weight: 600 !important;
  text-align: center !important;
  font-size: 12px !important;
}

:deep(.el-input-number .el-input-number__decrease),
:deep(.el-input-number .el-input-number__increase) {
  background-color: #f5f7fa !important;
  border-color: #dcdfe6 !important;
  color: #606266 !important;
}

:deep(.el-input-number .el-input-number__decrease:hover),
:deep(.el-input-number .el-input-number__increase:hover) {
  background-color: #409eff !important;
  border-color: #409eff !important;
  color: white !important;
}

/* 对话框头部样式 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 20px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
}

.header-stats .el-tag {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  font-weight: 500;
}

/* 编辑内容区域 */
.pallet-edit-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

/* 托盘编辑对话框 */
:deep(.pallet-edit-dialog) {
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

:deep(.pallet-edit-dialog .el-dialog__header) {
  padding: 0;
  border-bottom: none;
}

:deep(.pallet-edit-dialog .el-dialog__body) {
  padding: 0;
}

:deep(.pallet-edit-dialog .el-dialog__footer) {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
}

/* 查看表格样式 */
:deep(.view-pallets-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
}

:deep(.view-pallets-table .el-table__header th) {
  background: linear-gradient(135deg, #409eff 0%, #73b3ff 100%);
  color: white;
  font-weight: 600;
  font-size: 13px;
  padding: 14px 0;
  border: none;
}

:deep(.view-pallets-table .el-table__body td) {
  padding: 14px 0;
  vertical-align: middle;
  border-color: #ebeef5;
}

:deep(.view-pallets-table .el-table__row:hover td) {
  background-color: #f5f7fa;
}

/* 只读字段样式 */
.read-only-field {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  color: #606266;
  font-size: 13px;
  transition: all 0.3s ease;
}

.read-only-field:hover {
  background: linear-gradient(135deg, #ecf5ff 0%, #e1efff 100%);
  border-color: #c6e2ff;
  color: #409eff;
}

.read-only-field .field-icon {
  color: #909399;
  font-size: 14px;
  flex-shrink: 0;
}

.read-only-field:hover .field-icon {
  color: #409eff;
}

.read-only-field .field-value {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.number-field .field-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
  color: #67c23a;
}

.remarks-field .field-value {
  font-style: italic;
  color: #909399;
}

/* パレット番号编辑器样式 */
.pallet-number-editor {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
}

.prefix-label {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  white-space: nowrap;
  flex-shrink: 0;
}

.serial-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.serial-input {
  width: 40px;
  flex-shrink: 0;
}

.serial-controls {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.serial-btn {
  width: 20px;
  height: 14px;
  padding: 0;
  border-radius: 3px;
  font-size: 10px;
  border: 1px solid #409eff;
  background: linear-gradient(135deg, #409eff 0%, #73b3ff 100%);
  transition: all 0.2s ease;
}

.serial-btn:hover {
  background: linear-gradient(135deg, #337ecc 0%, #5a9cdb 100%);
  transform: scale(1.05);
}

.serial-btn:active {
  transform: scale(0.95);
}

.serial-btn-up {
  border-bottom-left-radius: 1px;
  border-bottom-right-radius: 1px;
}

.serial-btn-down {
  border-top-left-radius: 1px;
  border-top-right-radius: 1px;
}

:deep(.serial-btn .el-icon) {
  font-size: 8px !important;
}

/* 产品显示样式 */
.product-display {
  padding: 4px 0;
}

.mixed-product-tag {
  margin-bottom: 6px;
}

.mixed-product-tag .el-icon {
  margin-right: 4px;
}

.product-list {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.more-indicator {
  color: #409eff;
  font-weight: 600;
}

.single-product {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.product-icon {
  color: #909399;
  font-size: 14px;
}

/* 箱种标签样式 */
.box-type-tag {
  font-weight: 600;
  border-radius: 12px;
  padding: 4px 12px;
}

/* パレット番号输入框样式 */
:deep(.view-pallets-table .serial-input .el-input__wrapper) {
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 1px solid #dcdfe6;
}

:deep(.view-pallets-table .serial-input .el-input__wrapper:hover) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 日期快捷按钮样式 */
.date-range-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.date-quick-buttons {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.date-btn {
  font-size: 11px;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.3s ease;
  border: 1px solid #dcdfe6;
  background: white;
  color: #606266;
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-btn:hover {
  background: #f0f9ff;
  border-color: #409eff;
  color: #409eff;
  transform: translateY(-1px);
}

.today-btn {
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: white;
  border-color: #409eff;
  font-weight: 600;
}

.today-btn:hover {
  background: linear-gradient(135deg, #337ecc, #2d6db3);
  border-color: #337ecc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 納入先選択ボタン样式 */
.destination-select-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 4px 8px;
  transition: all 0.3s ease;
  text-align: left;
  min-width: 100px;
  height: 28px;
  font-size: 12px;
}

.destination-select-button:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.placeholder-text {
  color: #c0c4cc;
  font-size: 12px;
}

.selected-text {
  color: #606266;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70px;
}

.select-arrow {
  font-size: 10px;
  color: #c0c4cc;
  transition: transform 0.3s ease;
  flex-shrink: 0;
  margin-left: 4px;
}

.destination-select-button:hover .select-arrow {
  color: #409eff;
}

/* 納入先選択ダイアログ样式 */
.destination-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.destination-dialog :deep(.el-dialog) {
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
}

.destination-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 20px 24px;
  margin: 0;
}

.destination-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.destination-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.destination-select-container {
  padding: 16px;
}

.destination-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.destination-search-input {
  flex: 1;
  max-width: 300px;
}

.destination-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.destination-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e1e8ed;
  background: white;
  transition: all 0.3s ease;
  text-align: center;
  min-height: 50px;
  position: relative;
  overflow: hidden;
}

.destination-button:hover {
  border-color: #409eff;
  background: #f0f9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.destination-button.selected {
  border-color: #409eff;
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: white;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.destination-button.selected:hover {
  background: linear-gradient(135deg, #337ecc, #2d6db3);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.destination-code {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.8;
}

.destination-name {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  word-break: break-word;
}

.destination-button.selected .destination-code,
.destination-button.selected .destination-name {
  color: white;
}

.check-overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background: #67c23a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s ease;
}

.destination-button.selected .check-overlay {
  opacity: 1;
  transform: scale(1);
}

.check-overlay .el-icon {
  font-size: 10px;
  color: white;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(64, 158, 255, 0.1);
}

.reset-button {
  background: linear-gradient(135deg, #909399, #7d7d7d);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.3);
}

.reset-button:hover {
  background: linear-gradient(135deg, #7d7d7d, #6a6a6a);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(144, 147, 153, 0.4);
}

.select-all-button {
  background: linear-gradient(135deg, #67c23a, #5cb85c);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.select-all-button:hover {
  background: linear-gradient(135deg, #5cb85c, #4cae4c);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(103, 194, 58, 0.4);
}

.confirm-button {
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.confirm-button:hover {
  background: linear-gradient(135deg, #337ecc, #2d6db3);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .date-range-container {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .date-quick-buttons {
    justify-content: center;
  }

  .date-btn {
    flex: 1;
    min-width: 50px;
    height: 32px;
  }

  .destination-select-button {
    width: 100% !important;
    min-width: auto !important;
    height: 32px;
  }

  .selected-text {
    max-width: none;
  }

  .destination-buttons-grid {
    grid-template-columns: 1fr;
    gap: 6px;
    max-height: 300px;
  }

  .destination-button {
    min-height: 40px;
    padding: 8px 10px;
  }

  .destination-code {
    font-size: 10px;
  }

  .destination-name {
    font-size: 11px;
  }

  .destination-dialog-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .destination-search-input {
    max-width: none;
  }
}

:deep(.view-pallets-table .serial-input .el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 按钮组样式 */
:deep(.view-pallets-table .el-button-group) {
  display: flex;
  gap: 4px;
}

:deep(.view-pallets-table .el-button-group .el-button) {
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

:deep(.view-pallets-table .el-button-group .el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

:deep(.view-pallets-table .el-button--info) {
  background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
  color: white;
}

:deep(.view-pallets-table .el-button--primary) {
  background: linear-gradient(135deg, #409eff 0%, #5dade2 100%);
  color: white;
}

:deep(.view-pallets-table .el-button--danger) {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  color: white;
}

:deep(.view-pallets-table .el-button:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 底部按钮样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .el-button {
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.dialog-footer .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 滚动条样式 */
:deep(.el-table__body-wrapper)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #c1c1c1 0%, #a8a8a8 100%);
  border-radius: 4px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #a8a8a8 0%, #909090 100%);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  :deep(.pallet-edit-dialog) {
    width: 98% !important;
  }

  .pallet-edit-content {
    padding: 12px;
  }

  :deep(.view-pallets-table) {
    font-size: 12px;
  }

  .read-only-field {
    padding: 6px 10px;
    font-size: 12px;
  }

  .pallet-number-editor {
    gap: 6px;
  }

  .serial-input {
    width: 35px;
  }

  .serial-btn {
    width: 18px;
    height: 12px;
  }

  :deep(.serial-btn .el-icon) {
    font-size: 7px !important;
  }
}
/* 编辑托盘按钮样式 */
.edit-pallet-btn {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.3s ease;
  margin-left: 12px;
}

.edit-pallet-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(103, 194, 58, 0.3);
}

.edit-pallet-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
