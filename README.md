# 工具前端

Vue 3／Vite 前端，提供首页、加解密、随机密码与 todoist 页面。使用 Node.js 24 LTS（至少 24.12.0）和锁定依赖，通过 `npm ci` 安装、`npm test` 测试、`npm run serve` 开发、`npm run build` 构建至 `dist-refactor/`。`npm run preview` 可在本地预览生产构建。

开发时 `/api/todoist/` 代理到 `127.0.0.1:8091`，其余 `/api/` 代理到 `127.0.0.1:8081`，均去掉 `/api` 前缀。生产环境需要配置相同的同源代理，并为 `/About`、`/ToolsCryption`、`/GetRandomPWD`、`/Todoist` 配置 history 回退。原用户管理页面已经退役，不参与构建。

## todoist

`/Todoist` 保持紧凑任务列表：顶部 P0–P3 分段计数和刷新，中部勾选任务、展示备注及期限，底部添加输入与批量完成／删除、单选内联修改、提交记录。新增只需填名称，可独立单选 P0／P1／P2／P3，初始 P2，提交后保留选择，随名称发送 `fields.priority`；顶部查询分组不改变新增级别，名称中的 P1 等文字不作为级别解析，疑似重复确认沿用原请求级别。目标／完成标准仍由后端处理，不增加必填项；修改可改名称、优先级和备注。完成先归档为「已完成」，删除先确认再归档为「已移除」。输入不是富文本，长列表框内滚动。

打开页面或刷新调用 `GET /api/todoist/tasks`；任务含 `key`、`version`、`note`，编号只展示。提交接口仍是 `POST /api/todoist/commands`，改为 `{requestId, operation, fields?, targets?, confirmation?}`；operation 为 `add`、`edit`、`complete`、`remove`，非新增使用 `targets: [{key, version}]`。后端 [snailMai/txcBlog](https://github.com/snailMai/txcBlog) 的 `todoist/` 直接操作两份 Markdown，不再连接 AI Todoist 会话。旧 `{input, requestId}` 页面会收到 `CLIENT_UPDATE_REQUIRED`，须前后端一起发布并刷新。

提交即返回并乐观更新，可连续提交，后端 FIFO 串行执行；明确失败回滚，结果未知不回滚、不自动重发，只按 requestId 查询。成功后读文件对账。重复名称直接失败并展示候选；疑似重复进入「待确认」，「不是重复，继续」以新 requestId 携带令牌提交，取消不写入。文件变化导致令牌过期时须重新确认。后端持久回执支持重启后查询及幂等。

当前未实现网站登录或每日次数限制，页面操作选择不代表后端权限控制。输入、输出及密钥不得进入运行日志。

v0.5.0 前端于 2026-10-26 发布，支持新增级别单选，刷新页面即可使用；后端仍沿用 2026-10-20 的 v0.4.0 本地执行版。此次仅更新静态资源，不重启服务，也未修改真实任务或周期脚本。任务及结果使用 Vue 文本节点，不执行 HTML，不进入运行日志。

## 持续集成

仓库根目录的 `Jenkinsfile` 仅手工触发，读取 `master` 分支，依次执行依赖安装、单元测试和生产构建，并归档 `dist-refactor/`；无定时轮询，不执行线上部署。
