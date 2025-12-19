import { createRouter, createWebHistory } from 'vue-router'

import DashboardPage from '../views/DashboardPage.vue'
import RolesPage from '../views/RolesPage.vue'
import FieldDefsPage from '../views/FieldDefsPage.vue'
import TemplatesPage from '../views/TemplatesPage.vue'
import TemplateConfigPage from '../views/TemplateConfigPage.vue'
import CaseNewPage from '../views/CaseNewPage.vue'
import CaseSearchPage from '../views/CaseSearchPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardPage, meta: { title: '概览' } },
    { path: '/roles', name: 'roles', component: RolesPage, meta: { title: '角色管理' } },
    { path: '/field-defs', name: 'fieldDefs', component: FieldDefsPage, meta: { title: '模板字段' } },
    { path: '/templates', name: 'templates', component: TemplatesPage, meta: { title: '案例模板' } },
    {
      path: '/templates/:id/config',
      name: 'templateConfig',
      component: TemplateConfigPage,
      meta: { title: '模板配置' },
    },
    { path: '/cases/new', name: 'caseNew', component: CaseNewPage, meta: { title: '新建案例' } },
    { path: '/cases/search', name: 'caseSearch', component: CaseSearchPage, meta: { title: '案例查询' } },
  ],
})

export default router
