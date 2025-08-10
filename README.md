# HyAdmin - 忍者组织管理系统

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.0-yellow.svg)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.26.7-blue.svg)](https://ant.design/)

HyAdmin 是一个专为忍者组织设计的现代化前端管理系统，提供成员管理、活动组织、战绩记录和数据分析等核心功能。

## ✨ 功能特性

### 🧑‍🤝‍🧑 成员管理

- 成员信息维护（昵称、QQ、角色、状态）
- 角色分级系统（学员、成员、高层、首领）
- 加入/退出时间记录
- 成员状态管理（正常/已离开）

### 🎯 活动管理

- 活动类型配置（要塞战、天地战场等）
- 固定时间表设置
- 活动启用/禁用控制
- 自定义活动类型支持

### 📅 场次管理

- 活动场次创建和编辑
- 自动生成参与名单
- 参与状态记录（参与/请假/未知/未设置）
- 得分记录和备注

### 📊 数据统计

- 成员排行榜（总分、均分、出勤率）
- 时间维度筛选（月度、季度、年度）
- 活动类型筛选
- 出勤率统计

## 🚀 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **UI组件库**: Ant Design 5
- **状态管理**: Zustand
- **路由管理**: React Router 7
- **图标库**: Ant Design Icons
- **时间处理**: Day.js
- **代码规范**: ESLint + TypeScript ESLint

## 📦 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+ (推荐) 或 npm 8+

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 开发模式

```bash
pnpm dev
```

访问 <http://localhost:5173>

### 构建生产版本

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

## 🏗️ 项目结构

```
src/
├── api/           # API接口和HTTP客户端
├── assets/        # 静态资源
├── layouts/       # 布局组件
├── pages/         # 页面组件
│   ├── activities/    # 活动相关页面
│   ├── members/       # 成员管理页面
│   ├── reports/       # 统计报告页面
│   └── sessions/      # 场次管理页面
├── store/         # 状态管理
├── types.ts       # 类型定义
└── router.tsx     # 路由配置
```

## 🔐 权限系统

系统采用基于JWT的身份认证机制：

- 登录后获取访问令牌
- 路由级别的权限控制
- 自动重定向到登录页面

## 📱 响应式设计

- 支持桌面端和移动端
- 基于Ant Design的响应式布局
- 优化的移动端操作体验

## 🎨 界面预览

系统采用现代化的设计风格：

- 清晰的导航结构
- 直观的数据展示
- 一致的设计语言
- 优秀的用户体验

## 🔧 开发指南

### 代码规范

项目使用ESLint进行代码质量检查：

```bash
pnpm lint
```

### 类型检查

```bash
pnpm type-check
```

### 添加新页面

1. 在 `src/pages/` 下创建页面组件
2. 在 `src/router.tsx` 中添加路由配置
3. 更新导航菜单（如需要）

### API集成

- API接口定义在 `src/api/` 目录
- 使用 `src/api/http.ts` 中的HTTP客户端
- 支持请求拦截和响应处理

## 📚 API文档

详细的API文档请参考 [docs/api.md](./docs/api.md)

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](../../issues)
- 发送邮件至：[your-email@example.com]

---

**HyAdmin** - 让忍者组织管理更简单、更高效！ 🥷✨
