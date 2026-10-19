# 数趣 MathStudy

在线访问：[数学学习平台](https://mathstudy.windssea526.workers.dev)。`main` 分支通过 Cloudflare Workers Builds 自动验证、同步 D1 并部署。

以《苏教版数学四年级上册（2026 年第 1 版）》为主线的数学学习平台。已实现教材首页、全册目录、第一单元 5 课、第二单元 7 课及“周长与面积的变化”活动，共 13 个学习课节，以及覆盖六个单元的 69 道原创分层题。

## 启动

环境：Node.js 24.19.0、pnpm 11.23.0。首次运行：

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

打开 [本地学习首页](http://127.0.0.1:5188/)。前端和 Hono API 都由 Cloudflare Vite 插件在本地启动；启动前会自动迁移并同步本地 D1，无需云端账号或模型密钥。服务绑定到当前电脑的回环地址。

## 当前功能

- 教材首页：当前教材、自制书名封面、继续学习、按最近学习单元展示的课程入口、学习足迹和试商小实验。
- 课程目录：按教材排列六单元、四活动和期末复习，35 个规划课节；支持搜索与只看已开放。第三至六单元课节仍在建设，其原创题库已开放。
- 第一单元：整十数分组、试商调商、两位数商的竖式、连除应用、单元整理。支持播放、暂停、前后步、进度拖动、改换例题、调速和静态步骤。
- 第二单元：区分周长与面积、逐边测量与等长展开、周长公式、单位方格、铺格推导面积、面积单位进率、估测与复习；附同周长/同面积枚举活动。支持逐边读尺、逐格/逐排铺摆、长宽调节、对照表、前后步回放和静态步骤。
- 分层题库：第一单元 15 题、第二单元 18 题、其他四个单元各 9 题，共 69 题；覆盖填空、应用和选择，支持单元、题型、难度与关键词筛选。
- 解题与分析：服务端核对、提示、思路分析、分步计算与易错点；14 道挑战题均有分步可视化，另为靠墙围栏题配图，共 15 题有图解，使用分组、线段、面积、运算流程、数轴和部分积模型。
- 账号与同步：邮箱密码登录，学习进度、每次答题和错题状态保存到 Cloudflare D1；同一账号跨设备同步，断网保留待上传记录。游客可以继续本机学习，登录后明确选择合并旧记录。
- 学习记录：显示已完成课节、最近 100 次作答及错题的待复习/已掌握状态；重新独立答对可订正，首次不看提示独立答对计入独立做对。原始本机记录保留，旧版无原始答案的记录标为“本机导入”。

## 验证命令

```powershell
pnpm lint                 # 格式与客户端/服务端包边界
pnpm typecheck            # TypeScript 严格检查
pnpm test                 # 数学、内容、API 与组件回归
pnpm test:integration     # Hono API 集成测试
pnpm content:validate     # 目录、来源哈希、题目引用和图解协议
pnpm build                # 构建 Worker 和客户端
```

`content:validate` 需要保留 `doc/苏教版数学四年级上册.pdf`。普通测试不依赖 PDF 解析器。数据库迁移位于 `packages/database/migrations`。部署后课程和题库从 Cloudflare D1 的发布内容表读取；本地开发使用 D1 模拟。CI 不持有教材 PDF，显式运行 `pnpm content:validate --skip-source`，仍校验全部课程和题目关系。

## 代码结构

| 位置                           | 职责                                           |
| ------------------------------ | ---------------------------------------------- |
| `apps/web/src`                 | React 页面、SVG 教具、学习记录                 |
| `apps/web/worker`              | Hono 目录、课节、题库、判题和解析 API          |
| `packages/contracts`           | 教材、题型、场景和提交契约                     |
| `packages/math-core`           | 整数除法、试商、竖式、几何量、枚举与答案规范化 |
| `packages/animation-engine`    | 可重放的分组/竖式/测量/铺格步骤                |
| `packages/content`             | 服务端原创题库、D1 发布内容来源                |
| `content/textbooks`            | 版次隔离的教材目录与第一、二单元课程           |
| `packages/database/migrations` | Cloudflare D1 表结构迁移                       |
| `tests`                        | 数学性质、内容覆盖、API 与组件测试             |
| `doc`                          | 架构、设计、教材映射及开发进展                 |

题库的 `expected` 和完整解析仅在 Worker 内容仓储中；列表与课节 API 返回去除答案的 DTO，学生提交或主动查看讲解时才返回解析。客户端导入服务端内容包会被边界检查拒绝。

## 新增内容

课程目录和课节分别位于 `content/textbooks/<editionId>/catalog.json` 与课节 JSON（`lessons.json` 为第一单元、`unit2-lessons.json` 为第二单元及活动）；题库源文件为 `packages/content/src/questions.ts` 与 `unit2-questions.ts`。新增题目指定单元、难度、题型、评分字段、分析和步骤。挑战题必须同时提供符合 `visualSchema` 的图解，运行内容校验和测试后再使用。

第二单元快捷入口：[周长测量](http://127.0.0.1:5188/books/sj-math-g4-upper-2026-v1/lessons/U02-L02)、[铺格推导面积](http://127.0.0.1:5188/books/sj-math-g4-upper-2026-v1/lessons/U02-L05)、[周长与面积变化](http://127.0.0.1:5188/books/sj-math-g4-upper-2026-v1/lessons/A01-L01)、[第二单元题库](http://127.0.0.1:5188/questions?unit=U02)。

本次内容为开发预览，正式教材审核与发布后台、AI 生成及跨教材运营仍按[开发文档](doc/03-开发实施文档.md)分阶段接入。原始教材 PDF 未作为公开静态资源提供。账号暂不发送邮箱验证和密码找回邮件，请保存好登录信息；当前不是考试或成绩认证系统。

账号、会话和同步规则见[账号与学习同步](doc/07-账号与学习同步.md)。本地启动会生成独立开发密钥；生产 `AUTH_SECRET` 只保存在 Cloudflare Worker Secret 中，不写入仓库。

GitHub 仓库：[windssea/mathStudy](https://github.com/windssea/mathStudy)。部署采用 Cloudflare Worker `mathstudy` 和 D1 `mathstudy-prod-db`，完整操作及自动构建配置见[Git 与 Cloudflare 部署](doc/06-Git与Cloudflare部署.md)。

详细状态见[开发进展](doc/05-开发进展.md)，完整设计见[文档导航](doc/README.md)。
