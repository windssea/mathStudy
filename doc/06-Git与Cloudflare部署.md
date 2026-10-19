# Git 与 Cloudflare 部署

本项目采用 GitHub 管理源码、Cloudflare Workers 托管前端静态资源与 Hono API、Cloudflare D1 保存教材目录、课程、题库，以及账号、会话、学习事件。当前不依赖其他云数据库。

## 资源与分支

| 项目 | 配置 |
| --- | --- |
| GitHub | https://github.com/windssea/mathStudy |
| 发布分支 | `main` |
| Worker | `mathstudy` |
| 在线地址 | https://mathstudy.windssea526.workers.dev |
| D1 | `mathstudy-prod-db` |
| D1 绑定变量 | `DB` |
| Wrangler 配置 | `apps/web/wrangler.jsonc` |
| 数据库迁移 | `packages/database/migrations` |
| 内容同步脚本 | `scripts/generate-seed.ts` |

原始教材 PDF、凭据、依赖、构建产物和开发缓存不加入公开 Git 仓库。原始 PDF 放回 `doc/苏教版数学四年级上册.pdf` 后可以在本地核验教材 SHA-256。

## 本地开发

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` 自动生成独立的开发登录密钥到被 Git 忽略的 `apps/web/.dev.vars`，迁移并同步本地 D1，然后启动开发服务。默认使用 Wrangler 的本地 D1 模拟，不读写生产数据库。新增课程或题库内容后，可执行 `pnpm db:prepare` 同步本地内容。

生产 Worker 已配置 `AUTH_SECRET`。在新建独立环境时，用密码生成器生成至少 32 字符的随机密钥，再通过 `pnpm --filter @mathstudy/web exec wrangler secret put AUTH_SECRET` 的交互输入保存。它用于会话签名，和 `CLOUDFLARE_API_TOKEN` 是不同凭据，不能复用。日常部署保留已有 Secret，无需重复设置。更换该密钥会使已有会话失效；不要将生产密钥复制到本机或仓库。

## 部署流程

从仓库根目录执行：

```powershell
pnpm lint
pnpm test
pnpm content:validate --skip-source
pnpm build
pnpm run deploy:cloudflare
```

部署命令按顺序执行远程 D1 迁移、同步当前发布内容、上传构建后的 Worker 和静态资源，最后执行线上冒烟检查。必须先构建成功；前面的命令失败时部署链会停止。生产读取的 D1 不完整时健康检查会失败，不会悄悄退回示例数据。也可单独执行 `pnpm smoke` 重查线上 D1、内容哈希、首页、第二单元课节与题库、判题和 SPA 深链接。

原始 PDF 未加入仓库，所以 CI 使用显式的 `--skip-source` 跳过 PDF 文件哈希，仍校验课节、题目、图解协议和教材目录。持有 PDF 的本机可执行不带参数的 `pnpm content:validate` 完成全部检查。

## Cloudflare Git 自动构建配置

连接仓库 `windssea/mathStudy`，生产分支选择 `main`。配置如下：

| 设置 | 值 |
| --- | --- |
| 根目录 | 仓库根目录 `/` |
| 构建命令 | `pnpm lint && pnpm test && pnpm content:validate --skip-source && pnpm build` |
| 部署命令 | `pnpm run deploy:cloudflare` |
| `NODE_VERSION` | `24.19.0` |
| `PNPM_VERSION` | `11.23.0` |
| 非生产分支自动构建 | 关闭，避免预览写入生产 D1 |

已连接仓库和 `main`，复用账号已有的构建令牌，不新增令牌，也未修改其权限。构建身份需要当前 Worker 部署权限及当前 D1 的读写权限。凭据仅保存在 Cloudflare 或平台凭据存储中，不写入 Git。

## 内容版本与回滚

课程和题目按 `releaseId` 隔离保存。重复同步当前内容使用 UPSERT，保留其他发布版本；不清空数据库。删除内容或需要保留旧版本时应先更新 `packages/contracts/src/index.ts` 的 `releaseId`，再发布对应内容。向后兼容的数据库迁移应先于新版 Worker 生效。

Worker 回滚与数据库结构回滚是不同操作；避免删除旧字段和旧内容，让旧 Worker 仍可读取其发布版本。0003/0004 迁移新增账号、会话及学习事件，不修改已有教材或学习记录。内容同步脚本只更新内容表，不清空账号或学习事件。学习记录按账号和教材版次隔离，不因同一教材的内容发布版本升级而重置。

## 上线检查

检查 `/api/v1/health` 返回 `status: ok`、`storage: d1`、`accountSync: true`、当前 `releaseId` 和 `sourceHash`；再检查首页、课程深链接、第二单元题库及一道题的服务端判题。健康接口同时返回 Cloudflare 版本元数据，可与部署记录对应。

新环境迁移完成后，设置 `MATHSTUDY_ACCOUNT_PASSWORD` 环境变量，再执行 `pnpm exec tsx scripts/provision-account.ts --local` 或 `--remote`，以配置 admin 内置账号；可用 `MATHSTUDY_ACCOUNT_USERNAME` 指定其他账号名。不要在源码或文档记录实际密码。此脚本只新增，不重置已有密码，不放进自动部署。

设置上述账号环境变量后，`pnpm exec tsx scripts/smoke-sync.ts --origin https://mathstudy.windssea526.workers.dev` 可验收真实 D1 内置账号登录、关闭注册、双会话同一快照及单会话退出，默认不写入学习事件。`--write` 会写入第三单元测试记录，仅在明确需要写入时使用。普通 `pnpm smoke` 验证教材、第三单元、判题、关闭注册及未登录隔离，不读取账号密码。


自动构建的配置规则参考 [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)，迁移机制参考 [Cloudflare D1 Migrations](https://developers.cloudflare.com/d1/reference/migrations/)。
