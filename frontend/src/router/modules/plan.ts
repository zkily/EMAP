// 生産計画路由
import { RouteRecordRaw } from 'vue-router'
import {
  Menu,CalendarClock,List,
} from 'lucide-vue-next'

const productionPlanRoutes: RouteRecordRaw = {
  path: '/plan',
  name: 'plan',
  meta: { title: '生産計画管理' },
  redirect: '/plan/home',
  children: [
    {
      path: 'home',
      name: 'PlanHome',
      component: () => import('@/views/Plan/PlanHome.vue'),
      meta: { title: '生産計画管理メニュー', group: 'メインメニュー', icon: Menu },
    },
    {
      path: 'batch-list',
      name: 'BatchList',
      component: () => import('@/views/Plan/batch/BatchList.vue'),
      meta: { title: '生産ロットNo.一覧', group: '生産ロットNo', icon: List },
    },
    {
      path: 'schedule',
      name: 'SchedulePlan',
      component: () => import('@/views/Plan/schedule/schedule.vue'),
      meta: { title: '生産スケジュール', group: '生産計画', icon: CalendarClock },
    },
    {
      path: 'schedulegantt',
      name: 'ScheduleGantt',
      component: () => import('@/views/Plan/schedule/ScheduleGanttTable.vue'),
      meta: { title: '生産ガントチャート', group: '生産計画', icon: List },
    },
    {
      path: 'machineschedule',
      name: 'MachineSchedule',
      component: () => import('@/views/Plan/schedule/machineSchedule.vue'),
      meta: { title: '稼働スケジュール', group: '生産計画', icon: CalendarClock },
    },

  ],
}

export default productionPlanRoutes
