# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
pnpm install       # 安装依赖
pnpm dev           # 启动开发服务器（监听所有网卡）
pnpm build         # 类型检查 + 构建生产包
pnpm preview       # 预览生产构建
```

未配置测试框架。类型检查通过 `pnpm build` 中的 `vue-tsc` 完成。

## 项目概述

**每日打卡** — 基于 Vue 3 的 SPA，用于跨可配置类目追踪每日习惯。所有数据持久化至远程 API：`https://mhhong.com/api/taskApi/checkin`。

### 技术栈

- Vue 3 + TypeScript + Vite，路径别名 `@` → `src/`
- Naive UI 组件库
- Vue Router（history 模式，4 个路由）
- dayjs（含 isoWeek 插件）用于日期处理
- axios 用于 API 调用

### 数据流

数据存储在服务端。存储层（`src/utils/storage.ts`）封装 `src/utils/api.ts`，后者调用两个接口：

- `GET /getConfig` — 获取 `{ CATEGORIES, RECORDS }`
- `POST /saveConfig` — 保存 `{ config: { CATEGORIES, RECORDS } }`

存储层内置 1 秒 TTL 的内存缓存以减少重复请求。Composable（`useCategories`、`useRecords`）是存储层的主要消费方，持有跨组件实例共享的模块级响应式状态。

### 关键文件

| 文件 | 用途 |
|------|------|
| `src/types/index.ts` | 所有 TypeScript 接口（`Category`、`Record`、`DateCell` 等） |
| `src/utils/api.ts` | axios 实例 + `getConfig` / `saveConfig` |
| `src/utils/storage.ts` | 带内存缓存的存储抽象，提供 `get/set/remove/clear/exportAll/importFrom/clearCache` |
| `src/utils/score.ts` | `recordScore()` — 将打卡详情转换为归一化分数 |
| `src/utils/date.ts` | `todayStr()`、`weekStart()` — dayjs 日期工具函数 |
| `src/composables/useCategories.ts` | 类目 CRUD + 模块级响应式状态 |
| `src/composables/useRecords.ts` | 记录 CRUD + 模块级响应式状态 |
| `src/composables/useBreakpoint.ts` | 响应式断点：`sm`（<768px）、`md`（768–1000px）、`lg`（≥1000px） |
| `src/data/defaults.ts` | 默认类目（跑步/LeetCode/读书）+ ID 生成器 |
| `src/router/index.ts` | 路由：`/` 首页、`/checkin` 打卡、`/stats` 统计、`/settings` 设置 |

### 积分系统

`Category.unitsPerScore` 定义换算规则：数值类目的分数 = `detail / unitsPerScore`；文本类目固定得 1 分。分数用于热力图着色（0 / 1–3 / 3–6 / 6–10 / 10+）。

### Composable 状态模式

`useCategories` 和 `useRecords` 均使用**模块级** `ref()`（定义在 composable 函数外部），使状态以单例形式在所有调用方共享。每个写操作会先调用 `loadCategories()`/`loadRecords()` 确保数据最新，再更新 ref 并持久化。
