// ✅ Lucide版 menuList
import {
  List,
  Calendar,
  CalendarDays,
  Truck,
  Package,
  Cpu,
  BarChart,
  Timer,
  PieChart,
  Share2,
  Coins,
  User,
  MoreHorizontal,
  Settings,
  History,
  Users,
  Archive,
  User2,
  Building2,
  FileText,
  Activity,
  Clock,
  Factory,
  LineChart,
  Lock,
  Clipboard,
  ClipboardCheck,
  LayoutDashboard,
  Gauge,
  BoxIcon,
  Boxes,
  Component,
  ExternalLink,
  DollarSign,
  UserCog,
  Database,
  Wrench,
  Cog,
  CalendarClock,
  ClipboardList,
  // 添加picking相关图标
  QrCode,
  ListChecks,
  BarChart3,
  // 添加棚卸管理相关图标
  Plus,
  Eye,
  TrendingUp,
  Wrench as Tools,
} from 'lucide-vue-next'
import type { Component as VueComponent } from 'vue'

export interface MenuItem {
  title: string
  path?: string
  icon: VueComponent
  roles: string[]
  children?: MenuItem[]
  i18nKey?: string
}

// 受注管理
export const orderMenu: MenuItem = {
  title: '受注管理',
  path: '/order',
  i18nKey: 'menu.order.root',
  icon: Clipboard,
  roles: ['admin', 'manager', 'staff'],
  children: [
    {
      title: '月別受注管理',
      path: '/order/monthly',
      icon: CalendarDays,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.order.monthly',
    },
    {
      title: '日別受注管理',
      path: '/order/daily',
      icon: Calendar,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.order.daily',
    },
    {
      title: '受注履歴管理',
      path: '/order/daily-history',
      icon: History,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.order.daily-history',
    },
    {
      title: '納入先別受注履歴',
      path: '/order/destination-history',
      icon: Truck,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.order.destination-history',
    },
    {
      title: '顧客別受注履歴',
      path: '/order/customer-history',
      icon: Users,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.order.customer-history',
    },
    {
      title: '内示履歴比較',
      path: '/order/history-comparison',
      icon: LineChart,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.order.history-comparison',
    },
    {
      title: '受注ダッシュボード',
      path: '/order/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.order.dashboard',
    },
    {
      title: '受注KPIダッシュボード',
      path: '/order/order-kpi',
      icon: Gauge,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.order.order-kpi',
    },
    // {
    //   title: 'ログ管理',
    //   path: '/logs',
    //   icon: FileText,
    //   roles: ['admin', 'manager', 'staff'],
    //   i18nKey: 'menu.order.logs',
    // },
  ],
}

// 生産計画管理
export const planMenu: MenuItem = {
  title: '生産計画',
  path: '/plan',
  i18nKey: 'menu.plan.root',
  icon: CalendarDays,
  roles: ['admin', 'manager', 'staff'],
  children: [
    {
      title: '生産No管理',
      path: '/plan/batch-list',
      icon: List,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.plan.batch-list',
    },
    {
      title: '生産スケジュール',
      path: '/plan/schedule',
      icon: Calendar,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.plan.schedule',
    },
    {
      title: '生産ガントチャート',
      path: '/plan/schedulegantt',
      icon: BarChart,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.plan.schedulegantt',
    },
    {
      title: '稼働スケジュール',
      path: '/plan/machineschedule',
      icon: Timer,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.plan.machineschedule',
    },
  ],
}

// 生産指示管理
export const productionInstructionMenu: MenuItem = {
  title: '生産指示',
  path: '/other',
  i18nKey: 'menu.other.root',
  icon: ClipboardCheck,
  roles: ['admin', 'manager', 'staff'],
  children: [
    {
      title: '管理',
      path: '/other/permission',
      icon: Cog,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.other.permission',
    },
  ],
}

// 生産スケジュール管理
export const productionScheduleMenu: MenuItem = {
  title: '生産スケジュール',
  path: '/other',
  i18nKey: 'menu.other.root',
  icon: Activity,
  roles: ['admin', 'manager', 'staff'],
  children: [
    {
      title: '管理',
      path: '/other/permission',
      icon: Cog,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.other.permission',
    },
  ],
}

// 生産指標
export const productionKpiMenu: MenuItem = {
  title: '生産指標',
  path: '/other',
  i18nKey: 'menu.other.root',
  icon: Gauge,
  roles: ['admin', 'manager', 'staff'],
  children: [
    {
      title: '管理',
      path: '/other/permission',
      icon: Cog,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.other.permission',
    },
  ],
}

// 外注管理
export const outsourcingMenu: MenuItem = {
  title: '外注管理',
  path: '/outsourcing',
  i18nKey: 'menu.outsourcing.root',
  icon: ExternalLink,
  roles: ['admin', 'manager', 'staff'],
  children: [
    {
      title: '権限管理',
      path: '/outsourcing/permission',
      icon: Lock,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.outsourcing.permission',
    },
  ],
}

// 在庫管理
export const stockMenu: MenuItem = {
  title: '在庫管理',
  path: '/stock',
  i18nKey: 'menu.stock.root',
  icon: Boxes,
  roles: ['admin', 'manager', 'staff'],
  children: [
    {
      title: '在庫登録',
      path: '/stock/transaction',
      icon: FileText,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.stock.stocktransaction',
    },
    {
      title: '製品在庫登録',
      path: '/stock/product',
      icon: Package,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.stock.product',
    },
    {
      title: '仕掛在庫登録',
      path: '/stock/wip',
      icon: Timer,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.stock.wip',
    },
    {
      title: '材料在庫登録',
      path: '/stock/material',
      icon: BoxIcon,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.stock.material',
    },
    {
      title: '部品在庫登録',
      path: '/stock/component',
      icon: Component,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.stock.component',
    },
    {
      title: '在庫取引記録',
      path: '/stock/logs',
      icon: History,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.stock.logs',
    },
    {
      title: '製品在庫明細',
      path: '/stock/product-recalc',
      icon: FileText,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.stock.product-recalc',
    },
    {
      title: '製品在庫推移',
      path: '/stock/trend',
      icon: LineChart,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.stock.trend',
    },
    {
      title: '製品在庫履歴分析',
      path: '/stock/snapshot',
      icon: PieChart,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.stock.snapshot',
    },
    {
      title: '仕掛在庫明細',
      path: '/stock/wip-recalc',
      icon: FileText,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.stock.wip-recalc',
    },
    {
      title: '材料在庫明細',
      path: '/stock/material-recalc',
      icon: FileText,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.stock.material-recalc',
    },
  ],
}

// 材料管理
export const materialMenu: MenuItem = {
  title: '材料管理',
  path: '/material',
  i18nKey: 'menu.material.root',
  icon: BoxIcon,
  roles: ['admin', 'manager', 'staff'],
  children: [
    {
      title: '材料マスタ',
      path: '/material/materiallist',
      icon: List,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.material.materiallist',
    },
    {
      title: '材料在庫',
      path: '/material/materialstock',
      icon: Boxes,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.material.materialstock',
    },
  ],
}

// 部品管理
export const partMenu: MenuItem = {
  title: '部品管理',
  path: '/part',
  i18nKey: 'menu.part.root',
  icon: Component,
  roles: ['admin', 'manager', 'staff'],
  children: [
    {
      title: '部品マスタ',
      path: '/part/materiallist',
      icon: List,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.part.materiallist',
    },
    {
      title: '部品在庫',
      path: '/part/materialstock',
      icon: Boxes,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.part.materialstock',
    },
  ],
}

// 棚卸管理
export const inventoryCountMenu: MenuItem = {
  title: '棚卸管理',
  path: '/inventorycount',
  i18nKey: 'menu.inventorycount.root',
  icon: BarChart3,
  roles: ['admin', 'manager', 'staff'],
  children: [
    // 棚卸単管理
    {
      title: '棚卸単管理',
      path: '/inventorycount/home',
      icon: BarChart3,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.home',
    },
    {
      title: '新規棚卸単作成',
      path: '/inventorycount/create',
      icon: Plus,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.create',
    },
    {
      title: '棚卸単一覧',
      path: '/inventorycount/list',
      icon: List,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.list',
    },
    // 製品棚卸
    {
      title: '製品棚卸',
      path: '/inventorycount/product',
      icon: Package,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.product',
      children: [
        {
          title: '製品棚卸',
          path: '/inventorycount/product',
          icon: Package,
          roles: ['admin', 'manager', 'staff'],
          i18nKey: 'menu.inventorycount.product.main',
        },
        {
          title: '製品棚卸作成',
          path: '/inventorycount/product/create',
          icon: Plus,
          roles: ['admin', 'manager', 'staff'],
          i18nKey: 'menu.inventorycount.product.create',
        },
        {
          title: '製品棚卸一覧',
          path: '/inventorycount/product/list',
          icon: List,
          roles: ['admin', 'manager', 'staff'],
          i18nKey: 'menu.inventorycount.product.list',
        },
      ],
    },
    // 仕掛品棚卸
    {
      title: '仕掛品棚卸',
      path: '/inventorycount/wip',
      icon: Activity,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.wip',
      children: [
        {
          title: '仕掛品棚卸',
          path: '/inventorycount/wip',
          icon: Activity,
          roles: ['admin', 'manager', 'staff'],
          i18nKey: 'menu.inventorycount.wip.main',
        },
        {
          title: '仕掛品棚卸作成',
          path: '/inventorycount/wip/create',
          icon: Plus,
          roles: ['admin', 'manager', 'staff'],
          i18nKey: 'menu.inventorycount.wip.create',
        },
        {
          title: '仕掛品棚卸一覧',
          path: '/inventorycount/wip/list',
          icon: List,
          roles: ['admin', 'manager', 'staff'],
          i18nKey: 'menu.inventorycount.wip.list',
        },
      ],
    },
    // 材料棚卸
    {
      title: '材料棚卸',
      path: '/inventorycount/material',
      icon: BoxIcon,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.material',
      children: [
        {
          title: '材料棚卸',
          path: '/inventorycount/material',
          icon: BoxIcon,
          roles: ['admin', 'manager', 'staff'],
          i18nKey: 'menu.inventorycount.material.main',
        },
        {
          title: '材料棚卸作成',
          path: '/inventorycount/material/create',
          icon: Plus,
          roles: ['admin', 'manager', 'staff'],
          i18nKey: 'menu.inventorycount.material.create',
        },
        {
          title: '材料棚卸一覧',
          path: '/inventorycount/material/list',
          icon: List,
          roles: ['admin', 'manager', 'staff'],
          i18nKey: 'menu.inventorycount.material.list',
        },
      ],
    },
    // 部品棚卸
    {
      title: '部品棚卸',
      path: '/inventorycount/component',
      icon: Component,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.component',
      children: [
        {
          title: '部品棚卸',
          path: '/inventorycount/component',
          icon: Component,
          roles: ['admin', 'manager', 'staff'],
          i18nKey: 'menu.inventorycount.component.main',
        },
        {
          title: '部品棚卸作成',
          path: '/inventorycount/component/create',
          icon: Plus,
          roles: ['admin', 'manager', 'staff'],
          i18nKey: 'menu.inventorycount.component.create',
        },
        {
          title: '部品棚卸一覧',
          path: '/inventorycount/component/list',
          icon: List,
          roles: ['admin', 'manager', 'staff'],
          i18nKey: 'menu.inventorycount.component.list',
        },
      ],
    },
    // 統計分析
    {
      title: '棚卸統計',
      path: '/inventorycount/statistics',
      icon: TrendingUp,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.statistics',
    },
    {
      title: '棚卸分析',
      path: '/inventorycount/analytics',
      icon: BarChart3,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.analytics',
    },
    {
      title: '棚卸レポート',
      path: '/inventorycount/report',
      icon: FileText,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.report',
    },
    // 履歴管理
    {
      title: '棚卸履歴',
      path: '/inventorycount/history',
      icon: History,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.history',
    },
    {
      title: '監査ログ',
      path: '/inventorycount/audit',
      icon: Eye,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.audit',
    },
    {
      title: '操作ログ',
      path: '/inventorycount/log',
      icon: FileText,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.log',
    },
    // 設定管理
    {
      title: '棚卸設定',
      path: '/inventorycount/settings',
      icon: Settings,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.settings',
    },
    {
      title: 'システム設定',
      path: '/inventorycount/config',
      icon: Tools,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.config',
    },
    {
      title: 'ユーザー管理',
      path: '/inventorycount/user-management',
      icon: User,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.inventorycount.user-management',
    },
  ],
}

// 出荷管理
export const shippingMenu: MenuItem = {
  title: '出荷管理',
  path: '/shipping',
  i18nKey: 'menu.shipping.root',
  icon: Truck,
  roles: ['admin', 'manager', 'staff'],
  children: [
    {
      title: '出荷構成一覧',
      path: '/shipping/list',
      icon: ClipboardList,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.shipping.list',
    },
    {
      title: '出荷予定表',
      path: '/shipping/overview',
      icon: FileText,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.shipping.overview',
    },
    {
      title: '出荷報告書',
      path: '/shipping/report',
      icon: History,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.shipping.report',
    },
    {
      title: '溶接出荷管理',
      path: '/shipping/welding',
      icon: Package,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.shipping.welding',
    },
    // ========== ピッキング管理 ==========
    {
      title: 'ピッキング管理',
      path: '/shipping/picking',
      icon: Package,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.shipping.picking.home',
    },
  ],
}

// 原価管理
export const costMenu: MenuItem = {
  title: '原価管理',
  path: '/cost',
  i18nKey: 'menu.cost.root',
  icon: DollarSign,
  roles: ['admin', 'manager', 'staff'],
  children: [
    {
      title: '管理',
      path: '/cost/permission',
      icon: Cog,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.cost.permission',
    },
  ],
}

// 人員管理
export const staffMenu: MenuItem = {
  title: '人員管理',
  path: '/staff',
  i18nKey: 'menu.staff.root',
  icon: UserCog,
  roles: ['admin', 'manager'],
  children: [
    {
      title: '管理',
      path: '/staff/permission',
      icon: Cog,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.staff.permission',
    },
  ],
}

// その他管理
export const otherMenu: MenuItem = {
  title: 'その他管理',
  path: '/other',
  i18nKey: 'menu.other.root',
  icon: MoreHorizontal,
  roles: ['admin', 'manager', 'staff'],
  children: [
    {
      title: '管理',
      path: '/other/permission',
      icon: Cog,
      roles: ['admin', 'manager', 'staff'],
      i18nKey: 'menu.other.permission',
    },
  ],
}

// マスタ管理
export const masterMenu: MenuItem = {
  title: 'マスタ管理',
  path: '/master',
  i18nKey: 'menu.master.root',
  icon: Database,
  roles: ['admin', 'manager'],
  children: [
    {
      title: 'ユーザーマスタ',
      path: '/master/user',
      icon: User,
      roles: ['admin'],
      i18nKey: 'menu.master.user',
    },
    {
      title: '部門マスタ',
      path: '/master/department',
      icon: Building2,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.department',
    },
    {
      title: '顧客マスタ',
      path: '/master/customer',
      icon: Users,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.customer',
    },
    {
      title: '納入先休日設定',
      path: '/master/holiday',
      icon: CalendarDays,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.holiday',
    },
    {
      title: '納入先マスタ',
      path: '/master/destination',
      icon: Truck,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.destination',
    },
    {
      title: '仕入先マスタ',
      path: '/master/suppliers',
      icon: Factory,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.suppliers',
    },
    {
      title: '運送便マスタ',
      path: '/master/carrier',
      icon: Truck,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.carrier',
    },
    {
      title: '製品マスタ',
      path: '/master/products',
      icon: Package,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.product',
    },
    {
      title: '材料マスタ',
      path: '/master/material',
      icon: BoxIcon,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.material',
    },
    {
      title: '部品マスタ',
      path: '/master/components',
      icon: Component,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.components',
    },
    {
      title: '設備マスタ',
      path: '/master/machine',
      icon: Cpu,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.machine',
    },
    {
      title: '工程マスタ',
      path: '/master/processes',
      icon: Share2,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.processes',
    },
    {
      title: '工程ルート',
      path: '/master/processes/routes',
      icon: Share2,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.routes',
    },
    {
      title: '製品工程設備時間',
      path: '/router/product-route-steps',
      icon: Clock,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.product-route-steps',
    },

    {
      title: '部品構成管理',
      path: '/master/bom',
      icon: Component,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.bom',
    },
    {
      title: '部品逆展開表示',
      path: '/master/bom-reverse',
      icon: Component,
      roles: ['admin', 'manager'],
      i18nKey: 'menu.master.bom-reverse',
    },
  ],
}

// システム管理
export const systemMenu: MenuItem = {
  title: 'システム管理',
  path: '/system',
  i18nKey: 'menu.system.root',
  icon: Wrench,
  roles: ['admin'],
  children: [
    {
      title: '権限管理',
      path: '/system/permission',
      icon: Lock,
      roles: ['admin'],
      i18nKey: 'menu.system.permission',
    },
  ],
}

// メインメニュー
export const menuList: MenuItem[] = [
  orderMenu,
  planMenu,
  productionInstructionMenu,
  productionScheduleMenu,
  productionKpiMenu,
  outsourcingMenu,
  stockMenu,
  materialMenu,
  partMenu,
  inventoryCountMenu,
  shippingMenu,
  costMenu,
  staffMenu,
  otherMenu,
  masterMenu,
  systemMenu,
]
