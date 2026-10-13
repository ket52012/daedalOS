# daedalOS 志远定制版 — 搭建说明书

> 基于 [Dustin Brett 的 daedalOS](https://github.com/DustinBrett/daedalOS) 精简汉化。
> 在浏览器里跑的完整桌面系统：文件管理器、终端、浏览器、代码编辑器、画图、PDF、视频播放器、DOS 模拟器、红白机模拟器，另加 2048 / 扫雷 / 贪吃蛇 / 五子棋 4 个小游戏。

线上地址：https://pc.633668.xyz

---

## 1. 本地运行

环境要求：Node.js 18+，yarn 1.x。

```bash
# 克隆
git clone https://github.com/ket52012/daedalOS.git
cd daedalOS

# 安装依赖（第一次较慢，约 5～10 分钟）
yarn install

# 启动开发服务器
yarn dev
```

浏览器打开 http://localhost:3000 即可看到桌面。

常用命令：

| 命令 | 说明 |
|---|---|
| `yarn dev` | 开发模式（含热重载） |
| `yarn build` | 生产构建，输出到 `out/`（纯静态） |
| `yarn lint` | 代码检查 |
| `yarn test` | 跑单元测试 |

---

## 2. 构建

```bash
yarn build
```

构建产物在 `out/` 目录，是纯静态文件（`next.config.js` 已配 `output: "export"`），可直接部署到任何静态托管。

> 注意：`public/System/ffmpeg/ffmpeg-core.wasm`（31MB）超过 Cloudflare Pages 单文件 25MB 限制，部署时会被跳过，不影响视频播放器基本功能。

---

## 3. 部署到 Cloudflare Pages

### 3.1 创建 Pages 项目（只需做一次）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → **Upload assets**（直接上传，不连 Git）
2. 项目名填 `daedalos`，上传 `out/` 目录内容
3. 得到 `*.pages.dev` 地址

> 也可用 `wrangler pages deploy out --project-name=daedalos` 命令行部署。

### 3.2 绑定自定义域 pc.633668.xyz（只需做一次）

1. Pages 项目 → Custom domains → Set up a custom domain
2. 输入 `pc.633668.xyz`，按提示确认
3. `633668.xyz` 的 DNS zone 已在 Cloudflare，CNAME 会自动配好，等证书签发（约 1～2 分钟）即生效

### 3.3 更新部署

改完代码后：

```bash
yarn build
# 重新上传 out/ 目录到 Pages 项目（Dashboard 或 wrangler）
```

---

## 4. 加新应用 / 改桌面图标

### 4.1 应用注册表

所有应用都在 **`contexts/process/directory.ts`** 注册：

```ts
Browser: {
  Component: dynamic(() => import("components/apps/Browser")),
  icon: "/System/Icons/chromium.webp",
  title: "浏览器",          // ← 显示名称，改中文就改这里
},
```

- 新增应用：在 `directory.ts` 加一项，`Component` 指向 `components/apps/` 下的组件
- 改名：只改 `title` 字段
- 删除应用：删掉对应项即可（建议保留 `components/apps/` 目录，避免误删导致构建报错）

### 4.2 桌面图标（.url 快捷方式）

桌面图标在 **`public/Users/Public/Desktop/`**，每个 `.url` 文件格式：

```ini
[InternetShortcut]
BaseURL=Browser          ; 用哪个应用打开（Browser=浏览器）
Comment=电影网站          ; 备注
IconFile=/System/Icons/chromium.webp   ; 图标（/System/Icons/ 下现有图标）
URL=https://dyy.633668.xyz            ; 目标网址
```

- 改图标：换 `IconFile` 路径，`/System/Icons/` 目录下有现成图标
- 加网站快捷方式：复制一个 `.url` 文件，改 `Comment` / `URL` / `IconFile`
- 开始菜单的快捷方式在 `public/Users/Public/Start Menu/`，格式相同

### 4.3 小游戏

4 个小游戏是单文件 HTML（含内联 JS/CSS），放在 **`public/Games/`**：

```
public/Games/2048/index.html
public/Games/minesweeper/index.html   # 扫雷
public/Games/snake/index.html         # 贪吃蛇
public/Games/gomoku/index.html        # 五子棋
```

通过开始菜单的 `.url` 快捷方式用 Browser 打开，例如 `public/Users/Public/Start Menu/Games/2048.url`：

```ini
[InternetShortcut]
BaseURL=Browser
URL=/Games/2048/index.html
```

加新游戏：写个单文件 HTML 丢进 `public/Games/`，再在 Start Menu/Games 下加个 `.url` 即可。

---

## 5. 目录结构速览

```
components/apps/          # 应用组件（浏览器、终端、画图…）
contexts/process/directory.ts   # 应用注册表（改名/增删应用看这里）
public/Games/             # 4 个小游戏（单文件 HTML）
public/System/Icons/      # 系统图标
public/Users/Public/Desktop/    # 桌面快捷方式（.url 文件）
public/Users/Public/Start Menu/ # 开始菜单快捷方式
out/                      # 构建产物（yarn build 生成，不提交）
```

## 6. 常见问题

- **构建报错找不到某应用**：检查 `directory.ts` 是否还引用了已删除的组件，或其他文件（如 `components/system/Files/FileEntry/extensions.ts`）是否还有残留引用
- **yarn install 慢**：正常，依赖多，等 5～10 分钟
- **页面空白**：看浏览器控制台报错，多半是某应用组件 import 失败
