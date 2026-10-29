# 工具前端

当前源码版本为 `v3.1.0`，属于 V3 电脑手机同步阶段，包含 V1 原工具及 V2 todoist。`package.json` 与锁文件使用 `3.1.0`；本次仅更新产品版本元数据，网页改密由独立传输组件提供，外层 Vue 页面未重新发布。

Vue 3／Vite 前端，提供首页、加解密、随机密码、todoist 与电脑手机同步页面。使用 Node.js 24 LTS（至少 24.12.0）和锁定依赖，通过 `npm ci` 安装、`npm test` 测试、`npm run serve` 开发、`npm run build` 构建至 `dist-refactor/`。`npm run preview` 可在本地预览生产构建。

开发时 `/api/todoist/` 代理到 `127.0.0.1:8091`，其余 `/api/` 代理到 `127.0.0.1:8081`，均去掉 `/api` 前缀。`/transfer/` 原样代理到 `127.0.0.1:8765` 的独立传输服务。生产环境需要配置相同的同源代理，并为 `/About`、`/ToolsCryption`、`/GetRandomPWD`、`/Todoist`、`/Transfer` 配置 history 回退。原用户管理页面已经退役，不参与构建。

## 电脑手机同步

左侧导航在 todoist 后增加 `/Transfer`，嵌入同源 `/transfer/?embedded=1` 的实际传输界面。`Transfer.vue` 检查独立服务是否可用，失败可重试，离开页面取消检查并卸载界面。原有登录、文字／图片／文件上传、历史和下载由相邻 `snail-transfer/` 项目实现，Vue 不复制存储逻辑。开发时按该项目 README 以 `--prefix /transfer --origin http://127.0.0.1:8080` 启动；预览时来源相应设置为 4173。生产需要单独发布代理和传输服务，不会随 Git 提交自动上线。

该入口已于 2026-10-28 随 v0.7.0 部署。正式 HTTP 本机端口 8789 打开的同步页会转向 `https://tools.20242233.xyz/Transfer`，其他开发／测试端口继续使用各自代理，不放宽后端来源限制。原有 todoist 与 Java 服务保持不变。

## todoist

`/Todoist` 保持紧凑任务列表：顶部 P0–P3 分段计数和刷新，中部勾选任务、展示备注及期限，底部添加输入与批量完成／删除、单选内联修改、提交记录。新增只需填名称，可独立单选 P0／P1／P2／P3，初始 P2，提交后保留选择，随名称发送 `fields.priority`；顶部查询分组不改变新增级别，名称中的 P1 等文字不作为级别解析，疑似重复确认沿用原请求级别。目标／完成标准仍由后端处理，不增加必填项；修改可改名称、优先级和备注。完成先归档为「已完成」，删除先确认再归档为「已移除」。输入不是富文本，长列表框内滚动。

打开页面或刷新调用 `GET /api/todoist/tasks`；任务含 `key`、`version`、`note`，编号只展示。提交接口仍是 `POST /api/todoist/commands`，改为 `{requestId, operation, fields?, targets?, confirmation?}`；operation 为 `add`、`edit`、`complete`、`remove`，非新增使用 `targets: [{key, version}]`。后端 [snailMai/txcBlog](https://github.com/snailMai/txcBlog) 的 `todoist/` 直接操作两份 Markdown，不再连接 AI Todoist 会话。旧 `{input, requestId}` 页面会收到 `CLIENT_UPDATE_REQUIRED`，须前后端一起发布并刷新。

提交即返回并乐观更新，可连续提交，后端 FIFO 串行执行；明确失败回滚，结果未知不回滚、不自动重发，只按 requestId 查询。成功后读文件对账。重复名称直接失败并展示候选；疑似重复进入「待确认」，「不是重复，继续」以新 requestId 携带令牌提交，取消不写入。文件变化导致令牌过期时须重新确认。后端持久回执支持重启后查询及幂等。

当前未实现网站登录或每日次数限制，页面操作选择不代表后端权限控制。输入、输出及密钥不得进入运行日志。

v0.6.0 前端于 2026-10-27 发布，todoist 页面新增「定时任务」按钮，点击弹窗可查看定时任务（周期规则、下次执行时间与倒计时）并新增、修改、删除；弹窗为内存演示数据并明确标注，不接后端、不写浏览器持久存储，刷新页面还原。沿用 2026-10-26 的新增级别单选，后端仍为 2026-10-20 的 v0.4.0 本地执行版。此次仅更新静态资源，未修改真实任务或周期脚本。任务及结果使用 Vue 文本节点，不执行 HTML，不进入运行日志。

## 持续集成

仓库根目录的 `Jenkinsfile` 仅手工触发，读取 `master` 分支，依次执行依赖安装、单元测试和生产构建，并归档 `dist-refactor/`；无定时轮询，不执行线上部署。
