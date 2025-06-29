<template>
  <el-dialog v-model="dialogVisible" :title="mode === 'create' ? '新規棚卸単作成' : '棚卸単編集'" width="900px"
    :close-on-click-modal="false" @close="handleClose" class="inventory-count-dialog">
    <div class="dialog-content">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" class="dialog-form"
        :label-position="'top'">
        <!-- 基本情報区域 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon>
                <InfoFilled />
              </el-icon>
              基本情報
            </h3>
          </div>
          <div class="section-content">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="棚卸種別" prop="countType" class="form-item">
                  <el-select v-model="formData.countType" placeholder="棚卸種別を選択してください" style="width: 100%"
                    @change="handleCountTypeChange" class="select-input">
                    <el-option v-for="item in INVENTORY_COUNT_TYPE_OPTIONS" :key="item.value"
                      :label="getTypeLabel(item.value)" :value="item.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="棚卸日付" prop="countDate" class="form-item">
                  <el-date-picker v-model="formData.countDate" type="date" placeholder="棚卸日付を選択してください"
                    format="YYYY/MM/DD" value-format="YYYY-MM-DD" style="width: 100%" class="date-picker" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 担当者情報区域 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon>
                <User />
              </el-icon>
              担当者情報
            </h3>
          </div>
          <div class="section-content">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="棚卸担当者" prop="countPerson" class="form-item">
                  <el-select v-model="formData.countPerson" placeholder="棚卸担当者を選択してください" style="width: 100%" filterable
                    class="select-input">
                    <el-option v-for="user in userList" :key="user.id" :label="user.realName" :value="user.realName" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="確認者" class="form-item">
                  <el-select v-model="formData.checkPerson" placeholder="確認者を選択してください（任意）" style="width: 100%"
                    filterable clearable class="select-input">
                    <el-option v-for="user in userList" :key="user.id" :label="user.realName" :value="user.realName" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 仕掛品専用フィールド -->
        <div v-if="formData.countType === 'wip'" class="form-section wip-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon>
                <Operation />
              </el-icon>
              仕掛品設定
            </h3>
            <div class="section-subtitle">仕掛品棚卸に必要な部門と工程を設定してください</div>
          </div>
          <div class="section-content">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="部門" prop="departmentId" class="form-item">
                  <el-select v-model="formData.departmentId" placeholder="部門を選択してください" style="width: 100%"
                    @change="handleDepartmentChange" class="select-input">
                    <el-option v-for="dept in departmentList" :key="dept.id" :label="dept.departmentName"
                      :value="dept.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="工程" prop="processId" class="form-item">
                  <el-select v-model="formData.processId" placeholder="工程を選択してください" style="width: 100%"
                    @change="handleProcessChange" :disabled="!formData.departmentId" class="select-input">
                    <el-option v-for="process in processList" :key="process.id" :label="process.processName"
                      :value="process.id" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 其他类型的库位选择 -->
        <div v-if="formData.countType !== 'wip'" class="form-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon>
                <LocationFilled />
              </el-icon>
              保管場所設定
            </h3>
            <div class="section-subtitle">棚卸対象の保管場所を指定してください（任意）</div>
          </div>
          <div class="section-content">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="保管場所" class="form-item">
                  <el-select v-model="formData.locationId" placeholder="保管場所を選択してください" style="width: 100%" clearable
                    @change="handleLocationChange" class="select-input">
                    <el-option v-for="location in locationList" :key="location.id" :label="location.locationName"
                      :value="location.id" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 备注区域 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon>
                <EditPen />
              </el-icon>
              備考
            </h3>
          </div>
          <div class="section-content">
            <el-row>
              <el-col :span="24">
                <el-form-item class="form-item">
                  <el-input v-model="formData.remark" type="textarea" :rows="4" placeholder="棚卸に関する備考を入力してください（任意）"
                    maxlength="500" show-word-limit class="textarea-input" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <el-icon>
            <InfoFilled />
          </el-icon>
          <span>{{ mode === 'create' ? '新しい棚卸単を作成します' : '棚卸単の情報を更新します' }}</span>
        </div>
        <div class="footer-actions">
          <el-button @click="handleClose" size="large" class="cancel-btn">
            <el-icon>
              <Close />
            </el-icon>
            キャンセル
          </el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit" size="large" class="submit-btn">
            <el-icon>
              <Check />
            </el-icon>
            {{ mode === 'create' ? '作成' : '更新' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  InfoFilled,
  User,
  Operation,
  LocationFilled,
  EditPen,
  Close,
  Check
} from '@element-plus/icons-vue'
import {
  createInventoryCount,
  updateInventoryCount,
  getDepartmentList,
  getProcessList,
  getLocationList,
  getUserList,
} from '@/api/inventoryCount'
import {
  INVENTORY_COUNT_TYPE_OPTIONS,
  type InventoryCount,
  type CreateInventoryCountParams,
  type UpdateInventoryCountParams,
  type Department,
  type Process,
  type Location,
  InventoryCountType,
} from '@/types/inventoryCount'

interface Props {
  visible: boolean
  data?: InventoryCount | null
  mode: 'create' | 'edit'
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<CreateInventoryCountParams & UpdateInventoryCountParams>({
  countType: InventoryCountType.PRODUCT,
  countDate: new Date().toISOString().split('T')[0],
  countPerson: '',
  checkPerson: '',
  departmentId: undefined,
  departmentName: '',
  processId: undefined,
  processName: '',
  locationId: undefined,
  locationName: '',
  remark: '',
  createdBy: 'current_user', // 替换为实际用户
  updatedBy: 'current_user', // 替换为实际用户
})

// 选项数据
const departmentList = ref<Department[]>([])
const processList = ref<Process[]>([])
const locationList = ref<Location[]>([])
const userList = ref<{ id: number; username: string; realName: string }[]>([])

// 表单验证规则
const formRules: FormRules = {
  countType: [
    { required: true, message: '棚卸種別を選択してください', trigger: 'change' }
  ],
  countDate: [
    { required: true, message: '棚卸日付を選択してください', trigger: 'change' }
  ],
  countPerson: [
    { required: true, message: '棚卸担当者を選択してください', trigger: 'change' }
  ],
  departmentId: [
    {
      required: true,
      message: '部門を選択してください',
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (formData.countType === 'wip' && !value) {
          callback(new Error('仕掛品棚卸では部門の選択が必須です'))
        } else {
          callback()
        }
      }
    }
  ],
  processId: [
    {
      required: true,
      message: '工程を選択してください',
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (formData.countType === 'wip' && !value) {
          callback(new Error('仕掛品棚卸では工程の選択が必須です'))
        } else {
          callback()
        }
      }
    }
  ],
}

// 监听对话框显示状态
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal
    if (newVal) {
      initFormData()
    }
  }
)

// 监听对话框关闭
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false)
  }
})

// 方法
const initFormData = () => {
  if (props.mode === 'edit' && props.data) {
    Object.assign(formData, {
      countType: props.data.countType,
      countDate: props.data.countDate,
      countPerson: props.data.countPerson,
      checkPerson: props.data.checkPerson || '',
      departmentId: props.data.departmentId,
      departmentName: props.data.departmentName || '',
      processId: props.data.processId,
      processName: props.data.processName || '',
      locationId: props.data.locationId,
      locationName: props.data.locationName || '',
      remark: props.data.remark || '',
    })

    // 如果是仕掛品类型，加载对应的工程列表
    if (formData.countType === 'wip' && formData.departmentId) {
      loadProcessList(formData.departmentId)
    }
  } else {
    // 重置表单
    Object.assign(formData, {
      countType: InventoryCountType.PRODUCT,
      countDate: new Date().toISOString().split('T')[0],
      countPerson: '',
      checkPerson: '',
      departmentId: undefined,
      departmentName: '',
      processId: undefined,
      processName: '',
      locationId: undefined,
      locationName: '',
      remark: '',
      createdBy: 'current_user',
      updatedBy: 'current_user',
    })
  }
}

const loadDepartmentList = async () => {
  try {
    const response = await getDepartmentList()
    departmentList.value = response.data
  } catch (error) {
    console.error('部門リスト読み込み失敗:', error)
  }
}

const loadProcessList = async (departmentId?: number) => {
  try {
    const response = await getProcessList(departmentId)
    processList.value = response.data
  } catch (error) {
    console.error('工程リスト読み込み失敗:', error)
  }
}

const loadLocationList = async () => {
  try {
    const response = await getLocationList()
    locationList.value = response.data
  } catch (error) {
    console.error('保管場所リスト読み込み失敗:', error)
  }
}

const loadUserList = async () => {
  try {
    const response = await getUserList()
    userList.value = response.data
  } catch (error) {
    console.error('ユーザーリスト読み込み失敗:', error)
  }
}

const handleCountTypeChange = (value: InventoryCountType) => {
  // 棚卸種別変更時に関連フィールドをリセット
  formData.departmentId = undefined
  formData.departmentName = ''
  formData.processId = undefined
  formData.processName = ''
  formData.locationId = undefined
  formData.locationName = ''

  if (value === 'wip') {
    processList.value = []
  }
}

const handleDepartmentChange = (departmentId: number) => {
  const department = departmentList.value.find(d => d.id === departmentId)
  if (department) {
    formData.departmentName = department.departmentName
    formData.processId = undefined
    formData.processName = ''
    loadProcessList(departmentId)
  }
}

const handleProcessChange = (processId: number) => {
  const process = processList.value.find(p => p.id === processId)
  if (process) {
    formData.processName = process.processName
  }
}

const handleLocationChange = (locationId: number) => {
  const location = locationList.value.find(l => l.id === locationId)
  if (location) {
    formData.locationName = location.locationName
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    if (props.mode === 'create') {
      await createInventoryCount(formData as CreateInventoryCountParams)
      ElMessage.success('棚卸単の作成が完了しました')
    } else {
      await updateInventoryCount(props.data!.id, formData as UpdateInventoryCountParams)
      ElMessage.success('棚卸単の更新が完了しました')
    }

    emit('success')
    handleClose()
  } catch (error) {
    console.error('送信失敗:', error)
    ElMessage.error('送信に失敗しました')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

// 工具方法
const getTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    product: '製品',
    wip: '仕掛品',
    material: '材料',
    component: '部品',
  }
  return typeMap[type] || type
}

// 生命周期
onMounted(() => {
  loadDepartmentList()
  loadLocationList()
  loadUserList()
})
</script>

<style scoped lang="scss">
.inventory-count-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 24px 32px;
    margin: 0;

    .el-dialog__title {
      font-size: 20px;
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      .el-dialog__close {
        color: white;
        font-size: 20px;

        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
    margin: 0;
  }

  .dialog-content {
    .dialog-form {
      padding: 32px;

      .form-section {
        margin-bottom: 32px;
        background: white;
        border-radius: 12px;
        border: 2px solid #f8f9fa;
        overflow: hidden;
        transition: all 0.3s ease;

        &:hover {
          border-color: #e9ecef;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        &.wip-section {
          border-color: #ffc107;
          background: linear-gradient(135deg, #fff9e6 0%, #fffbf0 100%);

          .section-header {
            background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
            color: white;
          }
        }

        .section-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-bottom: 1px solid #e9ecef;

          .section-title {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 600;
            color: #495057;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .section-subtitle {
            margin: 0;
            font-size: 14px;
            color: #6c757d;
            font-weight: 400;
          }

          &:has(.section-subtitle) {
            .section-title {
              margin-bottom: 8px;
            }
          }
        }

        .section-content {
          padding: 24px;

          .form-item {
            margin-bottom: 0;

            :deep(.el-form-item__label) {
              font-weight: 600;
              color: #495057;
              margin-bottom: 8px;
              font-size: 14px;
            }

            .select-input,
            .date-picker {
              :deep(.el-input__wrapper) {
                border-radius: 12px;
                border: 2px solid #e9ecef;
                transition: all 0.3s ease;

                &:hover {
                  border-color: #adb5bd;
                }

                &.is-focus {
                  border-color: #667eea;
                  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
              }

              :deep(.el-input__inner) {
                font-size: 14px;
                padding: 12px 16px;
                height: 44px;
              }
            }

            .textarea-input {
              :deep(.el-textarea__inner) {
                border-radius: 12px;
                border: 2px solid #e9ecef;
                font-size: 14px;
                padding: 12px 16px;
                resize: vertical;
                min-height: 100px;

                &:hover {
                  border-color: #adb5bd;
                }

                &:focus {
                  border-color: #667eea;
                  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
              }
            }
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-top: 1px solid #e9ecef;

    .footer-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #495057;
      font-weight: 500;
      font-size: 14px;
    }

    .footer-actions {
      display: flex;
      gap: 12px;

      .cancel-btn {
        border-radius: 12px;
        padding: 12px 24px;
        font-weight: 600;
        border: 2px solid #e9ecef;
        font-size: 16px;

        &:hover {
          border-color: #adb5bd;
          background: #f8f9fa;
        }
      }

      .submit-btn {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        border: none;
        border-radius: 12px;
        padding: 12px 32px;
        font-weight: 600;
        font-size: 16px;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }

        &:disabled {
          background: #e9ecef;
          color: #6c757d;
          cursor: not-allowed;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .inventory-count-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 0 auto;
    }

    .dialog-content {
      .dialog-form {
        padding: 24px 16px;

        .form-section {
          .section-content {
            padding: 16px;

            .el-row {
              .el-col {
                margin-bottom: 16px;
              }
            }
          }
        }
      }
    }

    .dialog-footer {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;

      .footer-actions {
        justify-content: center;
        width: 100%;

        .cancel-btn,
        .submit-btn {
          flex: 1;
        }
      }
    }
  }
}
</style>
