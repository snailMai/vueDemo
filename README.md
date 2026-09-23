# 工具前端

Vue 3／Vite 前端，提供首页、加解密与随机密码页面。使用 Node.js 24 LTS（至少 24.12.0）和锁定依赖，通过 `npm ci` 安装、`npm test` 测试、`npm run serve` 开发、`npm run build` 构建至 `dist-refactor/`。`npm run preview` 可在本地预览生产构建。

开发时 `/api/` 代理到 `127.0.0.1:8081`。生产环境需要把 `/api/` 同源代理到 Java 后端，并为前端路由配置 history 回退。原用户管理页面已经退役，不参与构建。

仓库根目录的 `Jenkinsfile` 每 5 分钟检查一次 `master` 分支。发现新提交后，Jenkins 依次执行依赖安装、26 项单元测试和生产构建，并归档 `dist-refactor/`；流水线不执行线上部署。
