<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Document, Files, List, Plus, Tickets, UserFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const active = computed(() => route.path)

function nav(path) {
  router.push(path)
}
</script>

<template>
  <el-container class="app-shell">
    <el-aside width="240px" class="sidebar">
      <div class="sidebar-title">案例管理</div>
      <el-menu
        :default-active="active"
        background-color="#111827"
        text-color="#d1d5db"
        active-text-color="#fff"
        @select="nav"
      >
        <el-menu-item index="/">
          <el-icon><Tickets /></el-icon>
          <span>概览</span>
        </el-menu-item>
        <el-menu-item index="/roles">
          <el-icon><UserFilled /></el-icon>
          <span>角色管理</span>
        </el-menu-item>
        <el-menu-item index="/templates">
          <el-icon><Document /></el-icon>
          <span>模板管理</span>
        </el-menu-item>
        <el-menu-item index="/fields">
          <el-icon><Files /></el-icon>
          <span>字段管理</span>
        </el-menu-item>
        <el-menu-item index="/cases/new">
          <el-icon><Plus /></el-icon>
          <span>新建案例</span>
        </el-menu-item>
        <el-menu-item index="/cases/search">
          <el-icon><List /></el-icon>
          <span>案例查询</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="page-header">
        <div class="page-title">{{ route.meta?.title || route.name }}</div>
      </el-header>
      <el-main style="padding: 16px">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

