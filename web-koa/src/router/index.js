import { createRouter, createWebHistory } from 'vue-router'

import DashboardPage from '../views/DashboardPage.vue'
import RolesPage from '../views/RolesPage.vue'
import TemplatesPage from '../views/TemplatesPage.vue'
import TemplateFields from '../views/TemplateFields.vue'
import TemplateConfigPage from '../views/TemplateConfigPage.vue'
import CaseNewPage from '../views/CaseNewPage.vue'
import CaseSearchPage from '../views/CaseSearchPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardPage, meta: { title: '概览' } },
    { path: '/roles', name: 'roles', component: RolesPage, meta: { title: '角色管理' } },
    { path: '/templates', name: 'templates', component: TemplatesPage, meta: { title: '模板管理' } },
    {
      path: '/templates/:id/fields',
      name: 'templateFields',
      component: TemplateFields,
      meta: { title: '字段管理' },
    },
    {
      path: '/templates/:id/designer',
      name: 'templateDesigner',
      component: TemplateConfigPage,
      meta: { title: '模板配置' },
    },
    { path: '/cases/new', name: 'caseNew', component: CaseNewPage, meta: { title: '新建案例' } },
    { path: '/cases/search', name: 'caseSearch', component: CaseSearchPage, meta: { title: '案例查询' } },
  ],
})

export default router
