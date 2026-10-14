# 工具前端

Vue 3／Vite 前端，提供首页、加解密、随机密码与 todoist 页面。使用 Node.js 24 LTS（至少 24.12.0）和锁定依赖，通过 `npm ci` 安装、`npm test` 测试、`npm run serve` 开发、`npm run build` 构建至 `dist-refactor/`。`npm run preview` 可在本地预览生产构建。

开发时 `/api/todoist/` 代理到 `127.0.0.1:8091`，其余 `/api/` 代理到 `127.0.0.1:8081`，均去掉 `/api` 前缀。生产环境需要配置相同的同源代理，并为 `/About`、`/ToolsCryption`、`/GetRandomPWD`、`/Todoist` 配置 history 回退。原用户管理页面已经退役，不参与构建。

## todoist

`/Todoist` 使用四个单选操作：添加任务、完成任务、修改任务、删除任务。普通多行文本框内容与选中操作组合为「命令：内容」提交；独立的「输出全部待办」按钮只发送这句命令，不带文本框内容。输入不支持富文本，输出按普通文本显示，长内容在框内滚动。

提交接口为 `POST /api/todoist/commands`，JSON 为 `{input, requestId}`，其中 `requestId` 为 UUID；通过 `GET /api/todoist/commands?requestId=…` 查询处理状态及最终回复。后端独立转发服务位于 [snailMai/txcBlog](https://github.com/snailMai/txcBlog) 的 `todoist/`，将文本直接交给已有 AI Todoist 会话，不追加 prompt。结果未知时只查询原请求，不自动重发；服务重启或结果过期后需在原会话核对。

当前未实现网站登录或每日次数限制，页面操作选择不代表后端权限控制。输入、输出及密钥不得进入运行日志。

## 持续集成

仓库根目录的 `Jenkinsfile` 仅手工触发，读取 `master` 分支，依次执行依赖安装、单元测试和生产构建，并归档 `dist-refactor/`；无定时轮询，不执行线上部署。
