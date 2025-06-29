<template>
  <div class="permission-management">
    <!-- 顶部标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <div class="icon-wrapper">
            <el-icon class="header-icon">
              <Lock />
            </el-icon>
          </div>
          <div class="title-text">
            <h1>権限管理システム</h1>
            <p>ロール、ページ、ユーザー権限を統合管理</p>
          </div>
        </div>
        <div class="header-actions">
          <el-tooltip content="設定をリフレッシュ" placement="bottom">
            <el-button circle @click="refreshAllData" :loading="refreshing" type="primary">
              <el-icon>
                <Refresh />
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-tabs v-model="activeMainTab" class="pm-main-tabs" @tab-change="handleMainTabChange">
        <!-- 角色权限管理 -->
        <el-tab-pane name="role">
          <template #label>
            <div class="tab-label">
              <el-icon>
                <UserFilled />
              </el-icon>
              <span>ロール権限管理</span>
            </div>
          </template>

          <div class="tab-content">
            <div class="section-header">
              <div>
                <h2>ロール別権限設定</h2>
                <p>各ロールに付与する権限を管理できます</p>
              </div>
              <div class="header-stats">
                <el-statistic title="総権限数" :value="permissionsList.length" />
                <el-statistic title="選択済み" :value="Object.values(selectedPermissions).filter(Boolean).length" />
              </div>
            </div>

            <el-tabs v-model="activeRoleTab" type="border-card" class="role-tabs">
              <el-tab-pane v-for="role in roles" :key="role.value" :label="role.label" :name="role.value">
                <transition name="fade-slide" mode="out-in">
                  <div class="role-content" :key="activeRoleTab">
                    <!-- 操作按钮区域 -->
                    <div class="operation-bar" v-if="Object.keys(groupedPermissions).length">
                      <div class="batch-actions">
                        <el-button-group>
                          <el-button size="small" @click="selectAll(true)" :disabled="!permissionsList.length"
                            type="primary">
                            <el-icon><Select /></el-icon>
                            全選択
                          </el-button>
                          <el-button size="small" @click="selectAll(false)" :disabled="!permissionsList.length">
                            <el-icon>
                              <Close />
                            </el-icon>
                            全解除
                          </el-button>
                        </el-button-group>
                      </div>
                      <div class="selected-count">
                        <el-tag type="success" size="large">
                          選択済み: {{ Object.values(selectedPermissions).filter(Boolean).length }} / {{
                            permissionsList.length }}
                        </el-tag>
                      </div>
                    </div>

                    <!-- 权限分组显示 -->
                    <div class="permission-groups">
                      <div v-for="(group, groupName) in groupedPermissions" :key="groupName" class="permission-group">
                        <div class="group-header">
                          <div class="group-title">
                            <el-icon class="group-icon">
                              <Key />
                            </el-icon>
                            <span class="group-name">{{ getGroupDisplayName(groupName) }}</span>
                            <el-tag size="small" class="group-count" type="info">{{ group.length }}件</el-tag>
                          </div>
                          <div class="group-actions">
                            <el-button size="small" type="primary" link @click="selectGroupAll(groupName, true)">
                              <el-icon><Select /></el-icon>
                              グループ選択
                            </el-button>
                            <el-button size="small" type="danger" link @click="selectGroupAll(groupName, false)">
                              <el-icon>
                                <Close />
                              </el-icon>
                              グループ解除
                            </el-button>
                          </div>
                        </div>

                        <el-table :data="group" class="permission-table" stripe>
                          <el-table-column width="80" align="center">
                            <template #default="{ row }">
                              <el-checkbox v-model="selectedPermissions[row.id]" @change="handlePermissionChange"
                                size="large" />
                            </template>
                          </el-table-column>
                          <el-table-column prop="code" label="権限コード" width="220">
                            <template #default="{ row }">
                              <el-tag type="info" size="small" class="code-tag">{{ row.code }}</el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column prop="name" label="権限名" width="240">
                            <template #default="{ row }">
                              <div class="permission-name">{{ row.name }}</div>
                            </template>
                          </el-table-column>
                          <el-table-column prop="description" label="説明">
                            <template #default="{ row }">
                              <div class="permission-desc">{{ row.description }}</div>
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                    </div>

                    <!-- 空状态 -->
                    <el-empty v-if="!permissionsList.length" description="権限データがありません" :image-size="120" />
                  </div>
                </transition>

                <!-- 保存按钮 -->
                <div class="action-footer">
                  <el-button type="primary" @click="saveRolePermissions" :loading="saving" size="large"
                    class="save-button">
                    <el-icon v-if="saving">
                      <Loading />
                    </el-icon>
                    <el-icon v-else>
                      <Check />
                    </el-icon>
                    権限を保存
                  </el-button>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-tab-pane>

        <!-- 页面权限管理 -->
        <el-tab-pane name="page">
          <template #label>
            <div class="tab-label">
              <el-icon>
                <Document />
              </el-icon>
              <span>ページ権限管理</span>
            </div>
          </template>

          <div class="tab-content">
            <div class="section-header">
              <div>
                <h2>ページアクセス権限設定</h2>
                <p>各ページに必要な権限を設定できます</p>
              </div>
              <div class="header-stats">
                <el-statistic title="変更待ち" :value="pagePermissionChanges.length" />
              </div>
            </div>

            <div class="page-permission-content">
              <el-tabs v-model="activeModuleTab" type="card" class="module-tabs">
                <el-tab-pane v-for="(pages, moduleName) in groupedPagePermissions" :key="moduleName"
                  :label="getModuleDisplayName(moduleName)" :name="moduleName">
                  <el-table :data="pages" class="page-table" stripe>
                    <el-table-column prop="page_name" label="ページ名" width="220">
                      <template #default="{ row }">
                        <div class="page-info">
                          <div class="page-name">{{ row.page_name }}</div>
                          <div class="page-code">{{ row.page_code }}</div>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column prop="page_path" label="パス" width="280">
                      <template #default="{ row }">
                        <el-tag type="info" size="small" class="path-tag">{{ row.page_path }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="必要権限" width="300">
                      <template #default="{ row }">
                        <el-select v-model="row.required_permission" placeholder="権限を選択" clearable
                          @change="handlePagePermissionChange(row)" style="width: 100%;" filterable>
                          <el-option v-for="perm in permissionsList" :key="perm.code"
                            :label="`${perm.code} - ${perm.name}`" :value="perm.code" />
                        </el-select>
                      </template>
                    </el-table-column>
                    <el-table-column prop="description" label="説明">
                      <template #default="{ row }">
                        <div class="description-cell">{{ row.description }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="120" align="center">
                      <template #default="{ row }">
                        <el-button type="primary" link @click="editPagePermission(row)" :icon="Edit">
                          編集
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>
              </el-tabs>
            </div>

            <div class="action-footer">
              <el-button type="primary" @click="savePagePermissions" :loading="savingPages" size="large"
                :disabled="pagePermissionChanges.length === 0" class="save-button">
                <el-icon v-if="savingPages">
                  <Loading />
                </el-icon>
                <el-icon v-else>
                  <Check />
                </el-icon>
                ページ権限を保存 ({{ pagePermissionChanges.length }}件)
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- 用户特殊权限管理 -->
        <el-tab-pane name="user">
          <template #label>
            <div class="tab-label">
              <el-icon>
                <UserIcon />
              </el-icon>
              <span>ユーザー特別権限</span>
            </div>
          </template>

          <div class="tab-content">
            <div class="section-header">
              <div>
                <h2>ユーザー個別権限設定</h2>
                <p>特定のユーザーに追加権限を付与できます</p>
              </div>
              <div class="header-stats">
                <el-statistic title="特別権限" :value="userPermissionsList.length" />
              </div>
            </div>

            <div class="user-permission-content">
              <!-- 用户选择区域 -->
              <div class="user-selector-section">
                <el-card class="selector-card">
                  <div class="selector-content">
                    <div class="selector-input">
                      <label class="input-label">ユーザー選択</label>
                      <el-select v-model="selectedUserId" placeholder="ユーザーを選択してください" @change="loadUserPermissions"
                        filterable style="width: 350px;" size="large">
                        <el-option v-for="user in usersList" :key="user.id"
                          :label="`${user.username} (${user.name || ''})`" :value="user.id">
                          <div class="user-option">
                            <span class="username">{{ user.username }}</span>
                            <el-tag size="small" :type="getRoleTagType(user.role)">
                              {{ getRoleDisplayName(user.role) }}
                            </el-tag>
                          </div>
                        </el-option>
                      </el-select>
                    </div>
                    <el-button type="primary" @click="showAddUserPermissionDialog" :disabled="!selectedUserId"
                      :icon="Plus" size="large">
                      権限追加
                    </el-button>
                  </div>
                </el-card>
              </div>

              <!-- 用户权限列表 -->
              <div v-if="selectedUserId" class="user-permissions-section">
                <el-card>
                  <template #header>
                    <div class="card-header">
                      <span>特別権限一覧</span>
                      <el-tag type="success" size="large">{{ userPermissionsList.length }}件</el-tag>
                    </div>
                  </template>

                  <el-table :data="userPermissionsList" class="user-permissions-table" stripe>
                    <el-table-column prop="code" label="権限コード" width="200">
                      <template #default="{ row }">
                        <el-tag type="warning" size="small" class="code-tag">{{ row.code }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="name" label="権限名" width="220" />
                    <el-table-column prop="granted_reason" label="付与理由">
                      <template #default="{ row }">
                        <div class="reason-cell">{{ row.granted_reason || '理由なし' }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column prop="expires_at" label="有効期限" width="150" align="center">
                      <template #default="{ row }">
                        <el-tag :type="getExpiryTagType(row.expires_at)" size="small">
                          {{ row.expires_at ? formatDate(row.expires_at) : '無期限' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="granted_by_username" label="付与者" width="120" />
                    <el-table-column label="操作" width="100" align="center">
                      <template #default="{ row }">
                        <el-popconfirm title="この権限を撤回しますか？" @confirm="revokeUserPermission(row)"
                          confirm-button-text="撤回" cancel-button-text="キャンセル">
                          <template #reference>
                            <el-button type="danger" link :icon="Delete">
                              撤回
                            </el-button>
                          </template>
                        </el-popconfirm>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-card>
              </div>

              <!-- 空状态 -->
              <el-empty v-else description="ユーザーを選択してください" :image-size="120" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 权限模板管理 -->
        <el-tab-pane name="template">
          <template #label>
            <div class="tab-label">
              <el-icon>
                <Collection />
              </el-icon>
              <span>権限テンプレート</span>
            </div>
          </template>

          <div class="tab-content">
            <div class="section-header">
              <div>
                <h2>権限テンプレート管理</h2>
                <p>権限の組み合わせをテンプレートとして保存し、ロールに適用できます</p>
              </div>
              <el-button type="primary" @click="showCreateTemplateDialog" :icon="Plus" size="large">
                新規テンプレート作成
              </el-button>
            </div>

            <div class="template-content">
              <el-table :data="templatesList" class="template-table" stripe>
                <el-table-column prop="template_name" label="テンプレート名" width="220">
                  <template #default="{ row }">
                    <div class="template-name">{{ row.template_name }}</div>
                  </template>
                </el-table-column>
                <el-table-column prop="template_description" label="説明">
                  <template #default="{ row }">
                    <div class="template-desc">{{ row.template_description || '説明なし' }}</div>
                  </template>
                </el-table-column>
                <el-table-column label="権限数" width="120" align="center">
                  <template #default="{ row }">
                    <el-tag type="info" size="small">{{ JSON.parse(row.template_data).length }}件</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="created_by_username" label="作成者" width="140" />
                <el-table-column prop="created_at" label="作成日" width="150">
                  <template #default="{ row }">
                    {{ formatDate(row.created_at) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="220" align="center">
                  <template #default="{ row }">
                    <el-button-group>
                      <el-button type="primary" link @click="editTemplate(row)" :icon="Edit">
                        編集
                      </el-button>
                      <el-button type="success" link @click="showApplyTemplateDialog(row)" :icon="Position">
                        適用
                      </el-button>
                      <el-popconfirm title="このテンプレートを削除しますか？" @confirm="deleteTemplate(row)" confirm-button-text="削除"
                        cancel-button-text="キャンセル">
                        <template #reference>
                          <el-button type="danger" link :icon="Delete">
                            削除
                          </el-button>
                        </template>
                      </el-popconfirm>
                    </el-button-group>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <!-- 权限统计 -->
        <el-tab-pane name="statistics">
          <template #label>
            <div class="tab-label">
              <el-icon>
                <DataAnalysis />
              </el-icon>
              <span>権限統計</span>
            </div>
          </template>

          <div class="tab-content">
            <div class="section-header">
              <div>
                <h2>権限使用統計</h2>
                <p>システム内の権限使用状況を確認できます</p>
              </div>
            </div>

            <div class="statistics-content">
              <!-- 统计卡片 -->
              <el-row :gutter="24" class="stats-row">
                <el-col :span="8">
                  <el-card class="stat-card gradient-blue">
                    <div class="stat-content">
                      <div class="stat-icon">
                        <el-icon>
                          <UserIcon />
                        </el-icon>
                      </div>
                      <div class="stat-info">
                        <div class="stat-value">{{ statistics.userStats?.users_with_special_permissions || 0 }}</div>
                        <div class="stat-label">特別権限ユーザー</div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="8">
                  <el-card class="stat-card gradient-green">
                    <div class="stat-content">
                      <div class="stat-icon">
                        <el-icon>
                          <Key />
                        </el-icon>
                      </div>
                      <div class="stat-info">
                        <div class="stat-value">{{ statistics.userStats?.total_user_permissions || 0 }}</div>
                        <div class="stat-label">総特別権限数</div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="8">
                  <el-card class="stat-card gradient-orange">
                    <div class="stat-content">
                      <div class="stat-icon">
                        <el-icon>
                          <Lock />
                        </el-icon>
                      </div>
                      <div class="stat-info">
                        <div class="stat-value">{{ permissionsList.length }}</div>
                        <div class="stat-label">総権限数</div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>

              <!-- 统计图表 -->
              <el-row :gutter="24" class="charts-row">
                <el-col :span="12">
                  <el-card class="chart-card">
                    <template #header>
                      <div class="card-header">
                        <span>ロール別権限数</span>
                      </div>
                    </template>
                    <el-table :data="statistics.roleStats" size="small">
                      <el-table-column prop="role_id" label="ロール" width="140">
                        <template #default="{ row }">
                          <el-tag :type="getRoleTagType(row.role_id)" size="small">
                            {{ getRoleDisplayName(row.role_id) }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="permission_count" label="権限数" align="center">
                        <template #default="{ row }">
                          <el-progress :percentage="(row.permission_count / permissionsList.length) * 100"
                            :show-text="false" :stroke-width="8" color="#667eea" />
                          <span class="count-text">{{ row.permission_count }}件</span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card class="chart-card">
                    <template #header>
                      <div class="card-header">
                        <span>権限使用頻度 TOP10</span>
                      </div>
                    </template>
                    <el-table :data="statistics.permissionStats?.slice(0, 10)" size="small">
                      <el-table-column prop="code" label="権限コード" width="160">
                        <template #default="{ row }">
                          <el-tag size="small" class="code-tag">{{ row.code }}</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="name" label="権限名" />
                      <el-table-column label="使用数" width="100" align="center">
                        <template #default="{ row }">
                          <el-tag type="success" size="small">
                            {{ row.role_usage_count + row.user_usage_count }}件
                          </el-tag>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 用户权限添加对话框 -->
    <el-dialog v-model="addUserPermissionDialogVisible" title="ユーザー権限追加" width="600px" :close-on-click-modal="false">
      <el-form :model="userPermissionForm" label-width="120px" class="permission-form">
        <el-form-item label="権限選択" required>
          <el-select v-model="userPermissionForm.permissionIds" multiple placeholder="権限を選択してください" style="width: 100%;"
            filterable>
            <el-option v-for="perm in permissionsList" :key="perm.id" :label="`${perm.code} - ${perm.name}`"
              :value="perm.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="付与理由">
          <el-input v-model="userPermissionForm.reason" type="textarea" placeholder="権限付与の理由を入力してください" :rows="3" />
        </el-form-item>
        <el-form-item label="有効期限">
          <el-date-picker v-model="userPermissionForm.expiresAt" type="datetime" placeholder="期限を選択（空白で無期限）"
            style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addUserPermissionDialogVisible = false" size="large">キャンセル</el-button>
          <el-button type="primary" @click="addUserPermissions" :loading="addingUserPermission"
            :disabled="!userPermissionForm.permissionIds.length" size="large">
            権限追加
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 权限模板创建/编辑对话框 -->
    <el-dialog v-model="templateDialogVisible" :title="templateForm.id ? 'テンプレート編集' : 'テンプレート作成'" width="700px"
      :close-on-click-modal="false">
      <el-form :model="templateForm" label-width="120px" class="template-form">
        <el-form-item label="テンプレート名" required>
          <el-input v-model="templateForm.template_name" placeholder="テンプレート名を入力してください" />
        </el-form-item>
        <el-form-item label="説明">
          <el-input v-model="templateForm.template_description" type="textarea" placeholder="テンプレートの説明を入力してください"
            :rows="3" />
        </el-form-item>
        <el-form-item label="権限選択" required>
          <el-select v-model="templateForm.permission_codes" multiple placeholder="権限を選択してください" style="width: 100%;"
            filterable>
            <el-option v-for="perm in permissionsList" :key="perm.code" :label="`${perm.code} - ${perm.name}`"
              :value="perm.code" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="templateDialogVisible = false" size="large">キャンセル</el-button>
          <el-button type="primary" @click="saveTemplate" :loading="savingTemplate"
            :disabled="!templateForm.template_name || !templateForm.permission_codes.length" size="large">
            テンプレート保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 模板应用对话框 -->
    <el-dialog v-model="applyTemplateDialogVisible" title="テンプレート適用" width="400px" :close-on-click-modal="false">
      <el-form label-width="100px" class="apply-form">
        <el-form-item label="テンプレート">
          <div class="template-info">{{ currentTemplate?.template_name }}</div>
        </el-form-item>
        <el-form-item label="適用先ロール" required>
          <el-select v-model="applyToRole" placeholder="ロールを選択してください" style="width: 100%;">
            <el-option v-for="role in roles" :key="role.value" :label="role.label" :value="role.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="applyTemplateDialogVisible = false" size="large">キャンセル</el-button>
          <el-button type="primary" @click="applyTemplate" :loading="applyingTemplate" :disabled="!applyToRole"
            size="large">
            テンプレート適用
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Lock, Key, Edit, Delete, Loading, Refresh, UserFilled, Document, User as UserIcon,
  Collection, DataAnalysis, Plus, Check, Select, Close, Position
} from '@element-plus/icons-vue';
import {
  getAllPermissions,
  getRolePermissions,
  updateRolePermissions,
  getGroupedPagePermissions,
  batchUpdatePagePermissions,
  getUsers,
  getUserPermissions,
  addUserPermissions as addUserPermissionsApi,
  revokeUserPermission as revokeUserPermissionApi,
  getPermissionTemplates,
  createPermissionTemplate,
  updatePermissionTemplate,
  deletePermissionTemplate,
  applyTemplateToRole,
  getPermissionStatistics,
  type Permission,
  type PagePermission,
  type User,
  type UserPermission,
  type PermissionTemplate,
  type PermissionStatistics
} from '@/api/permissions';

// 角色配置
const roles = [
  { label: '管理者', value: 'admin' },
  { label: 'マネージャー', value: 'manager' },
  { label: '一般職員', value: 'staff' },
];

// 主要状态
const activeMainTab = ref('role');
const activeRoleTab = ref('admin');
const activeModuleTab = ref('');
const refreshing = ref(false);

// 权限数据
const permissionsList = ref<Permission[]>([]);
const selectedPermissions = ref<Record<number, boolean>>({});
const saving = ref(false);

// 页面权限数据
const groupedPagePermissions = ref<Record<string, PagePermission[]>>({});
const savingPages = ref(false);
const pagePermissionChanges = ref<PagePermission[]>([]);

// 用户权限数据
const usersList = ref<User[]>([]);
const selectedUserId = ref<number>();
const userPermissionsList = ref<UserPermission[]>([]);
const addUserPermissionDialogVisible = ref(false);
const addingUserPermission = ref(false);
const userPermissionForm = ref({
  permissionIds: [] as number[],
  reason: '',
  expiresAt: undefined as Date | undefined
});

// 权限模板数据
const templatesList = ref<PermissionTemplate[]>([]);
const templateDialogVisible = ref(false);
const savingTemplate = ref(false);
const templateForm = ref({
  id: null as number | null,
  template_name: '',
  template_description: '',
  permission_codes: [] as string[]
});

// 模板应用对话框
const applyTemplateDialogVisible = ref(false);
const applyingTemplate = ref(false);
const currentTemplate = ref<PermissionTemplate | null>(null);
const applyToRole = ref('');

// 统计数据
const statistics = ref<PermissionStatistics>({
  roleStats: [],
  userStats: { total_user_permissions: 0, users_with_special_permissions: 0 },
  permissionStats: []
});

// 计算属性
const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {};
  permissionsList.value.forEach((perm) => {
    const prefix = perm.code.split(':')[0] || 'その他';
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(perm);
  });
  return groups;
});

// 工具函数
const getGroupDisplayName = (groupName: string) => {
  const nameMap: Record<string, string> = {
    'order': '受注管理',
    'plan': '生産計画',
    'shipping': '出荷管理',
    'system': 'システム管理',
    'page': 'ページアクセス',
    'data': 'データ操作',
    'admin': '管理者機能',
    'その他': 'その他'
  };
  return nameMap[groupName] || groupName;
};

const getModuleDisplayName = (moduleName: string) => {
  const nameMap: Record<string, string> = {
    'order': '受注管理',
    'plan': '生産計画',
    'shipping': '出荷管理',
    'system': 'システム管理',
    'staff': '人員管理',
    'master': 'マスタ管理'
  };
  return nameMap[moduleName] || moduleName;
};

const getRoleDisplayName = (role: string) => {
  const roleMap: Record<string, string> = {
    'admin': '管理者',
    'manager': 'マネージャー',
    'staff': '一般職員',
  };
  return roleMap[role] || role;
};

const getRoleTagType = (role: string): "primary" | "success" | "warning" | "info" | "danger" => {
  const typeMap: Record<string, "primary" | "success" | "warning" | "info" | "danger"> = {
    'admin': 'danger',
    'manager': 'warning',
    'staff': 'success',
  };
  return typeMap[role] || 'info';
};

const getExpiryTagType = (expiresAt: string | null): "primary" | "success" | "warning" | "info" | "danger" => {
  if (!expiresAt) return 'success';

  const expiry = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntilExpiry < 0) return 'danger';
  if (daysUntilExpiry < 7) return 'warning';
  return 'success';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ja-JP');
};

// 数据加载函数
const loadAllPermissions = async () => {
  try {
    const res = await getAllPermissions();
    // 拦截器已经处理了响应结构，直接使用返回的数据
    if (Array.isArray(res)) {
      permissionsList.value = res;
    } else if (res && res.success && res.data) {
      // 备用处理：如果返回的是完整结构
      permissionsList.value = res.data;
    } else {
      console.error('权限API返回格式异常:', res);
      ElMessage.error('権限データの形式が正しくありません');
    }
  } catch (error) {
    ElMessage.error('権限の読み込みに失敗しました');
  }
};

const loadRolePermissions = async (role: string) => {
  try {
    const res = await getRolePermissions(role);
    const newSelected: Record<number, boolean> = {};
    permissionsList.value.forEach(p => {
      newSelected[p.id] = false;
    });

    // 拦截器已经处理了响应结构，直接使用返回的数据
    let rolePermissions: Permission[] = [];
    if (Array.isArray(res)) {
      rolePermissions = res;
    } else if (res && res.success && res.data) {
      rolePermissions = res.data;
    }

    rolePermissions.forEach((p: Permission) => {
      newSelected[p.id] = true;
    });
    selectedPermissions.value = newSelected;
  } catch (error) {
    ElMessage.error('ロール権限の読み込みに失敗しました');
  }
};

const loadPagePermissions = async () => {
  try {
    const res = await getGroupedPagePermissions();
    // 拦截器已经处理了响应结构，直接使用返回的数据
    if (res && typeof res === 'object' && !Array.isArray(res)) {
      // 如果是对象形式的分组数据
      if (res.success && res.data) {
        groupedPagePermissions.value = res.data;
      } else {
        groupedPagePermissions.value = res;
      }

      const modules = Object.keys(groupedPagePermissions.value);
      if (modules.length > 0 && !activeModuleTab.value) {
        activeModuleTab.value = modules[0];
      }
    } else {
      console.error('页面权限API返回格式异常:', res);
      ElMessage.error('ページ権限データの形式が正しくありません');
    }
  } catch (error) {
    ElMessage.error('ページ権限の読み込みに失敗しました');
  }
};

const loadUsers = async () => {
  try {
    const res = await getUsers();
    // 拦截器已经处理了响应结构，直接使用返回的数据
    if (Array.isArray(res)) {
      usersList.value = res;
      console.log('用户列表加载成功:', usersList.value);
    } else if (res && res.success && res.data) {
      // 备用处理：如果返回的是完整结构
      usersList.value = res.data;
      console.log('用户列表加载成功（备用）:', usersList.value);
    } else {
      console.error('用户API返回格式异常:', res);
      ElMessage.error('ユーザーデータの形式が正しくありません');
    }
  } catch (error) {
    console.error('加载用户列表时发生错误:', error);
    ElMessage.error('ユーザー一覧の読み込みに失敗しました');
  }
};

const loadUserPermissions = async () => {
  if (!selectedUserId.value) return;
  try {
    const res = await getUserPermissions(selectedUserId.value);
    // 拦截器已经处理了响应结构，直接使用返回的数据
    if (Array.isArray(res)) {
      userPermissionsList.value = res;
      console.log('用户权限加载成功:', userPermissionsList.value);
    } else if (res && res.success && res.data) {
      // 备用处理：如果返回的是完整结构
      userPermissionsList.value = res.data;
      console.log('用户权限加载成功（备用）:', userPermissionsList.value);
    } else {
      console.error('用户权限API返回格式异常:', res);
      ElMessage.error('ユーザー権限データの形式が正しくありません');
    }
  } catch (error) {
    console.error('加载用户权限时发生错误:', error);
    ElMessage.error('ユーザー権限の読み込みに失敗しました');
  }
};

const loadTemplates = async () => {
  try {
    const res = await getPermissionTemplates();
    // 拦截器已经处理了响应结构，直接使用返回的数据
    if (Array.isArray(res)) {
      templatesList.value = res;
    } else if (res && res.success && res.data) {
      templatesList.value = res.data;
    } else {
      console.error('模板API返回格式异常:', res);
      ElMessage.error('テンプレートデータの形式が正しくありません');
    }
  } catch (error) {
    ElMessage.error('テンプレートの読み込みに失敗しました');
  }
};

const loadStatistics = async () => {
  try {
    const res = await getPermissionStatistics();
    // 拦截器已经处理了响应结构，直接使用返回的数据
    if (res && typeof res === 'object') {
      if (res.success && res.data) {
        statistics.value = res.data;
      } else if (res.roleStats || res.userStats || res.permissionStats) {
        statistics.value = res;
      } else {
        console.error('统计API返回格式异常:', res);
        ElMessage.error('統計データの形式が正しくありません');
      }
    }
  } catch (error) {
    ElMessage.error('統計データの読み込みに失敗しました');
  }
};

// 新增：刷新所有数据
const refreshAllData = async () => {
  refreshing.value = true;
  try {
    await Promise.all([
      loadAllPermissions(),
      loadRolePermissions(activeRoleTab.value)
    ]);

    // 根据当前标签页加载相应数据
    if (activeMainTab.value === 'page') {
      await loadPagePermissions();
    } else if (activeMainTab.value === 'user' && usersList.value.length === 0) {
      await loadUsers();
    } else if (activeMainTab.value === 'template' && templatesList.value.length === 0) {
      await loadTemplates();
    } else if (activeMainTab.value === 'statistics') {
      await loadStatistics();
    }

    ElMessage.success('データが更新されました');
  } catch (error) {
    ElMessage.error('データの更新に失敗しました');
  } finally {
    refreshing.value = false;
  }
};

// 事件处理函数
const handleMainTabChange = async (tabName: string | number) => {
  const name = String(tabName);

  if (name === 'page' && Object.keys(groupedPagePermissions.value).length === 0) {
    await loadPagePermissions();
  } else if (name === 'user' && usersList.value.length === 0) {
    await loadUsers();
  } else if (name === 'template' && templatesList.value.length === 0) {
    await loadTemplates();
  } else if (name === 'statistics') {
    await loadStatistics();
  }
};

const saveRolePermissions = async () => {
  try {
    saving.value = true;
    const permissionIds = Object.entries(selectedPermissions.value)
      .filter(([_, selected]) => selected)
      .map(([id]) => Number(id));
    const res = await updateRolePermissions(activeRoleTab.value, permissionIds);
    if (res.success) {
      ElMessage.success('ロール権限が更新されました');
    }
  } catch (error) {
    ElMessage.error('ロール権限の更新に失敗しました');
  } finally {
    saving.value = false;
  }
};

const selectAll = (checked: boolean) => {
  Object.keys(selectedPermissions.value).forEach(id => {
    selectedPermissions.value[Number(id)] = checked;
  });
};

// 新增：按组选择权限
const selectGroupAll = (groupName: string, checked: boolean) => {
  const group = groupedPermissions.value[groupName];
  if (group) {
    group.forEach(perm => {
      selectedPermissions.value[perm.id] = checked;
    });
  }
};

const handlePermissionChange = () => {
  // 权限变更处理，可以在这里添加额外逻辑
};

const handlePagePermissionChange = (page: PagePermission) => {
  const existingIndex = pagePermissionChanges.value.findIndex(p => p.id === page.id);
  if (existingIndex >= 0) {
    pagePermissionChanges.value[existingIndex] = page;
  } else {
    pagePermissionChanges.value.push(page);
  }
};

const editPagePermission = (page: PagePermission) => {
  ElMessageBox.prompt('ページの説明を入力してください', 'ページ権限編集', {
    inputValue: page.description || '',
    inputType: 'textarea',
    inputPlaceholder: 'ページの詳細説明を入力',
    confirmButtonText: '更新',
    cancelButtonText: 'キャンセル'
  }).then(({ value }) => {
    page.description = value;
    handlePagePermissionChange(page);
    ElMessage.success('ページ情報が更新されました');
  }).catch(() => {
    // 用户取消操作
  });
};

const savePagePermissions = async () => {
  if (pagePermissionChanges.value.length === 0) {
    ElMessage.info('変更がありません');
    return;
  }

  try {
    savingPages.value = true;
    const res = await batchUpdatePagePermissions(pagePermissionChanges.value);
    if (res.success) {
      ElMessage.success('ページ権限が更新されました');
      pagePermissionChanges.value = [];
    }
  } catch (error) {
    ElMessage.error('ページ権限の更新に失敗しました');
  } finally {
    savingPages.value = false;
  }
};

const showAddUserPermissionDialog = () => {
  userPermissionForm.value = {
    permissionIds: [],
    reason: '',
    expiresAt: undefined
  };
  addUserPermissionDialogVisible.value = true;
};

const addUserPermissions = async () => {
  if (!selectedUserId.value || userPermissionForm.value.permissionIds.length === 0) {
    ElMessage.warning('ユーザーと権限を選択してください');
    return;
  }

  try {
    addingUserPermission.value = true;
    const res = await addUserPermissionsApi(selectedUserId.value, {
      permissionIds: userPermissionForm.value.permissionIds,
      reason: userPermissionForm.value.reason,
      expiresAt: userPermissionForm.value.expiresAt?.toISOString()
    });
    if (res.success) {
      ElMessage.success('ユーザー権限が追加されました');
      addUserPermissionDialogVisible.value = false;
      await loadUserPermissions();
    }
  } catch (error) {
    ElMessage.error('ユーザー権限の追加に失敗しました');
  } finally {
    addingUserPermission.value = false;
  }
};

const revokeUserPermission = async (permission: UserPermission) => {
  try {
    const res = await revokeUserPermissionApi(selectedUserId.value!, permission.id);
    if (res.success) {
      ElMessage.success('権限が撤回されました');
      await loadUserPermissions();
    }
  } catch (error) {
    ElMessage.error('権限の撤回に失敗しました');
  }
};

const showCreateTemplateDialog = () => {
  templateForm.value = {
    id: null,
    template_name: '',
    template_description: '',
    permission_codes: []
  };
  templateDialogVisible.value = true;
};

const editTemplate = (template: PermissionTemplate) => {
  templateForm.value = {
    id: template.id,
    template_name: template.template_name,
    template_description: template.template_description || '',
    permission_codes: JSON.parse(template.template_data)
  };
  templateDialogVisible.value = true;
};

const saveTemplate = async () => {
  if (!templateForm.value.template_name || templateForm.value.permission_codes.length === 0) {
    ElMessage.warning('テンプレート名と権限を入力してください');
    return;
  }

  try {
    savingTemplate.value = true;
    const data = {
      template_name: templateForm.value.template_name,
      template_description: templateForm.value.template_description,
      permission_codes: templateForm.value.permission_codes
    };

    let res;
    if (templateForm.value.id) {
      res = await updatePermissionTemplate(templateForm.value.id, data);
    } else {
      res = await createPermissionTemplate(data);
    }

    if (res.success) {
      ElMessage.success('テンプレートが保存されました');
      templateDialogVisible.value = false;
      await loadTemplates();
    }
  } catch (error) {
    ElMessage.error('テンプレートの保存に失敗しました');
  } finally {
    savingTemplate.value = false;
  }
};

const deleteTemplate = async (template: PermissionTemplate) => {
  try {
    const res = await deletePermissionTemplate(template.id);
    if (res.success) {
      ElMessage.success('テンプレートが削除されました');
      await loadTemplates();
    }
  } catch (error) {
    ElMessage.error('テンプレートの削除に失敗しました');
  }
};

const showApplyTemplateDialog = (template: PermissionTemplate) => {
  currentTemplate.value = template;
  applyToRole.value = '';
  applyTemplateDialogVisible.value = true;
};

const applyTemplate = async () => {
  if (!currentTemplate.value || !applyToRole.value) {
    ElMessage.warning('テンプレートとロールを選択してください');
    return;
  }

  try {
    applyingTemplate.value = true;
    const res = await applyTemplateToRole(currentTemplate.value.id, applyToRole.value);
    if (res.success) {
      ElMessage.success('テンプレートが適用されました');
      applyTemplateDialogVisible.value = false;
      if (activeRoleTab.value === applyToRole.value) {
        await loadRolePermissions(applyToRole.value);
      }
    }
  } catch (error) {
    ElMessage.error('テンプレートの適用に失敗しました');
  } finally {
    applyingTemplate.value = false;
  }
};

// 监听器
watch(activeRoleTab, (newRole) => {
  loadRolePermissions(newRole);
});

watch(permissionsList, () => {
  if (activeRoleTab.value) {
    loadRolePermissions(activeRoleTab.value);
  }
});

// 初始化
onMounted(async () => {
  await loadAllPermissions();
  await loadRolePermissions(activeRoleTab.value);
});
</script>

<style scoped>
/* 主容器样式 */
.permission-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
}

.permission-management::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(120, 200, 255, 0.3) 0%, transparent 50%);
  pointer-events: none;
}

/* 页面头部样式 */
.page-header {
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px 36px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.header-content:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.08);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  box-shadow:
    0 8px 24px rgba(102, 126, 234, 0.3),
    inset 0 2px 8px rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.icon-wrapper::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: rotate(45deg);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }

  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

.header-icon {
  font-size: 28px;
  color: white;
  position: relative;
  z-index: 1;
}

.title-text h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #1a1a1a;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.title-text p {
  margin: 6px 0 0 0;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 16px;
}

.header-stats {
  display: flex;
  gap: 32px;
  align-items: center;
}

.header-stats :deep(.el-statistic__head) {
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
}

.header-stats :deep(.el-statistic__content) {
  color: #667eea;
  font-weight: 700;
  font-size: 20px;
}

/* 主内容区域 */
.main-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 1;
}

/* 标签页样式 */
.pm-main-tabs {
  background: transparent;
}

.pm-main-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.pm-main-tabs :deep(.el-tabs__header)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
}

.pm-main-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 36px;
}

.pm-main-tabs :deep(.el-tabs__item) {
  height: 64px;
  line-height: 64px;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 3px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.pm-main-tabs :deep(.el-tabs__item)::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 3px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  transition: all 0.3s ease;
  transform: translateX(-50%);
  border-radius: 2px;
}

.pm-main-tabs :deep(.el-tabs__item.is-active) {
  color: #667eea;
}

.pm-main-tabs :deep(.el-tabs__item.is-active)::before {
  width: 100%;
}

.pm-main-tabs :deep(.el-tabs__item:hover) {
  color: #667eea;
  transform: translateY(-1px);
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
}

.tab-label .el-icon {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.pm-main-tabs :deep(.el-tabs__item:hover) .tab-label .el-icon {
  transform: scale(1.1);
}

/* 标签内容样式 */
.tab-content {
  padding: 36px;
  position: relative;
}

.section-header {
  margin-bottom: 36px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
}

.section-header::after {
  content: '';
  position: absolute;
  bottom: -18px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, #667eea, transparent);
}

.section-header div:first-child {
  flex: 1;
}

.section-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
  letter-spacing: -0.5px;
}

.section-header p {
  margin: 0;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.6;
  font-weight: 500;
}

/* 角色权限管理样式 */
.role-tabs {
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.role-tabs :deep(.el-tabs__header) {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  margin: 0;
  border-bottom: 1px solid #e5e7eb;
}

.role-tabs :deep(.el-tabs__item) {
  padding: 20px 28px;
  font-weight: 600;
  border-radius: 12px 12px 0 0;
  margin-right: 6px;
  transition: all 0.3s ease;
  position: relative;
}

.role-tabs :deep(.el-tabs__item)::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.role-tabs :deep(.el-tabs__item.is-active) {
  background: white;
  border-bottom-color: white;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.role-tabs :deep(.el-tabs__item.is-active)::before {
  transform: scaleX(1);
}

.role-content {
  background: white;
  padding: 32px;
  position: relative;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.operation-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.batch-actions .el-button-group .el-button {
  border-radius: 10px;
  font-weight: 500;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.batch-actions .el-button-group .el-button:first-child {
  border-radius: 10px 0 0 10px;
}

.batch-actions .el-button-group .el-button:last-child {
  border-radius: 0 10px 10px 0;
}

.batch-actions .el-button-group .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.selected-count {
  font-size: 14px;
  font-weight: 600;
}

.permission-groups {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.permission-group {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  background: white;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  position: relative;
}

.permission-group:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.05);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.group-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 24px;
  right: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.group-icon {
  color: #667eea;
  font-size: 20px;
  padding: 8px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
}

.group-name {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.group-count {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
}

.group-actions {
  display: flex;
  gap: 12px;
}

.group-actions .el-button {
  font-weight: 500;
  transition: all 0.3s ease;
}

.group-actions .el-button:hover {
  transform: translateY(-1px);
}

.permission-table {
  border: none;
  background: white;
}

.permission-table :deep(.el-table__header) {
  background: #fafafa;
}

.permission-table :deep(.el-table__header-wrapper) {
  border-radius: 0;
}

.permission-table :deep(.el-table__row) {
  transition: all 0.3s ease;
}

.permission-table :deep(.el-table__row:hover > td) {
  background-color: #f8fafc !important;
  transform: scale(1.001);
}

.permission-table :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #667eea;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.permission-table :deep(.el-checkbox__inner) {
  border-radius: 6px;
  transition: all 0.3s ease;
}

.permission-table :deep(.el-checkbox__inner:hover) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.code-tag {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  color: #374151;
  border: 1px solid #d1d5db;
  font-weight: 600;
  border-radius: 8px;
  padding: 4px 8px;
}

.path-tag {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #1e40af;
  border: 1px solid #bfdbfe;
  font-weight: 500;
  border-radius: 8px;
}

.permission-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.permission-desc {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}

/* 页面权限管理样式 */
.page-permission-content {
  background: white;
  border-radius: 16px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.module-tabs {
  border-radius: 16px;
  overflow: hidden;
}

.module-tabs :deep(.el-tabs__header) {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  margin: 0;
  border-bottom: 1px solid #e5e7eb;
}

.module-tabs :deep(.el-tabs__item) {
  padding: 18px 28px;
  font-weight: 600;
  transition: all 0.3s ease;
  border-radius: 12px 12px 0 0;
  margin-right: 4px;
}

.module-tabs :deep(.el-tabs__item.is-active) {
  background: white;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.module-tabs :deep(.el-tabs__item:hover) {
  color: #667eea;
  transform: translateY(-1px);
}

.page-table {
  border: none;
}

.page-table :deep(.el-table__body-wrapper) {
  background: white;
}

.page-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.page-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.page-code {
  font-size: 12px;
  color: #6b7280;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.description-cell {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}

/* 用户权限管理样式 */
.user-permission-content {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.user-selector-section {
  margin-bottom: 28px;
}

.selector-card {
  border-radius: 16px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.selector-card :deep(.el-card__body) {
  padding: 28px;
}

.selector-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 28px;
}

.selector-input {
  flex: 1;
}

.input-label {
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: #374151;
  font-size: 15px;
}

.user-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}

.username {
  font-weight: 600;
  color: #1f2937;
}

.user-permissions-section {
  background: white;
  border-radius: 16px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.user-permissions-table {
  border: none;
}

.reason-cell {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 模板管理样式 */
.template-content {
  background: white;
  border-radius: 16px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.template-table {
  border: none;
}

.template-name {
  font-weight: 700;
  color: #1f2937;
  font-size: 15px;
}

.template-desc {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}

/* 统计页面样式 */
.statistics-content {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.stats-row {
  margin-bottom: 0;
}

.stat-card {
  border-radius: 20px;
  border: none;
  overflow: hidden;
  position: relative;
  color: white;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow:
    0 20px 48px rgba(0, 0, 0, 0.2),
    0 8px 24px rgba(0, 0, 0, 0.12);
}

.gradient-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.gradient-green {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  position: relative;
}

.gradient-orange {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  position: relative;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px;
  position: relative;
  z-index: 1;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.stat-icon .el-icon {
  font-size: 28px;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  color: white;
  margin-bottom: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.stat-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.charts-row {
  margin-bottom: 0;
}

.chart-card {
  border-radius: 16px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.06);
}

.count-text {
  margin-left: 16px;
  font-weight: 700;
  color: #374151;
  font-size: 14px;
}

/* 操作按钮样式 */
.action-footer {
  margin-top: 36px;
  padding-top: 28px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
  position: relative;
}

.action-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 100px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
  transform: translateX(-50%);
}

.save-button {
  min-width: 180px;
  height: 52px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  box-shadow:
    0 6px 20px rgba(102, 126, 234, 0.3),
    0 2px 8px rgba(102, 126, 234, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.save-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.save-button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow:
    0 10px 28px rgba(102, 126, 234, 0.4),
    0 4px 16px rgba(102, 126, 234, 0.3);
}

.save-button:hover::before {
  left: 100%;
}

.save-button:active {
  transform: translateY(-1px) scale(1.02);
}

/* 对话框样式 */
.permission-form,
.template-form,
.apply-form {
  padding: 12px 0;
}

.permission-form :deep(.el-form-item__label),
.template-form :deep(.el-form-item__label),
.apply-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
  font-size: 15px;
}

.template-info {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  border-radius: 12px;
  font-weight: 600;
  color: #1f2937;
  border: 1px solid #d1d5db;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 8px;
}

.dialog-footer .el-button {
  min-width: 100px;
  height: 44px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.dialog-footer .el-button--primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.dialog-footer .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: #1f2937;
  font-size: 16px;
}

/* 动画效果 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .main-content {
    margin: 0 16px;
  }

  .stat-content {
    padding: 24px;
  }

  .stat-value {
    font-size: 32px;
  }
}

@media (max-width: 1200px) {
  .tab-content {
    padding: 28px;
  }

  .header-content {
    padding: 24px 28px;
  }

  .title-text h1 {
    font-size: 28px;
  }

  .section-header h2 {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .permission-management {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 20px;
    padding: 24px;
  }

  .title-section {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .tab-content {
    padding: 20px;
  }

  .section-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }

  .operation-bar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .selector-content {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }

  .stats-row .el-col {
    margin-bottom: 20px;
  }

  .stat-content {
    padding: 20px;
    gap: 16px;
  }

  .stat-value {
    font-size: 28px;
  }

  .charts-row .el-col {
    margin-bottom: 20px;
  }

  .header-stats {
    gap: 20px;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .title-text h1 {
    font-size: 24px;
  }

  .icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .header-icon {
    font-size: 24px;
  }

  .permission-table :deep(.el-table__cell) {
    padding: 8px 4px;
  }

  .page-table :deep(.el-table__cell) {
    padding: 8px 4px;
  }

  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .stat-icon {
    align-self: center;
  }
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
  background: linear-gradient(135deg, #c1c1c1, #a8a8a8);
  border-radius: 4px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #a8a8a8, #909090);
}

/* 表格hover效果 */
:deep(.el-table__row):hover {
  background-color: #f8fafc !important;
}

/* 按钮组样式改进 */
:deep(.el-button-group) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 选择器样式改进 */
:deep(.el-select) {
  border-radius: 12px;
}

:deep(.el-input__wrapper) {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px solid #e5e7eb;
}

:deep(.el-input__wrapper:hover) {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 进度条样式 */
:deep(.el-progress-bar__outer) {
  border-radius: 6px;
  background-color: #f0f0f0;
}

:deep(.el-progress-bar__inner) {
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

:deep(.el-progress-bar__inner)::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: progress-shine 2s infinite;
}

@keyframes progress-shine {
  0% {
    left: -100%;
  }

  100% {
    left: 100%;
  }
}

/* 标签样式改进 */
:deep(.el-tag) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-tag:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 空状态样式 */
:deep(.el-empty) {
  padding: 60px 0;
}

:deep(.el-empty__image) {
  opacity: 0.6;
}

:deep(.el-empty__description) {
  color: #6b7280;
  font-weight: 500;
}

/* 对话框样式改进 */
:deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.2),
    0 8px 24px rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e5e7eb;
  padding: 24px 28px;
}

:deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

:deep(.el-dialog__body) {
  padding: 28px;
}

/* 选择框选项样式 */
:deep(.el-select-dropdown__item) {
  padding: 12px 16px;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin: 2px 8px;
}

:deep(.el-select-dropdown__item:hover) {
  background-color: #f8fafc;
  transform: translateX(4px);
}

:deep(.el-select-dropdown__item.selected) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

/* 日期选择器样式 */
:deep(.el-date-editor) {
  border-radius: 12px;
}

/* 文本域样式 */
:deep(.el-textarea__inner) {
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

:deep(.el-textarea__inner:hover) {
  border-color: #667eea;
}

:deep(.el-textarea__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 确认弹窗样式 */
:deep(.el-popconfirm) {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
</style>
