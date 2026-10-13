# Vercel 部署教程

本项目推荐部署到 [Vercel](https://vercel.com)（作者本人也是用 Vercel 部署的，对 Next.js 支持最好）。

## 一、导入项目

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 账号登录
2. 点击 **Add New** → **Project**
3. 在仓库列表中找到 `ket52012/daedalOS`，点击 **Import**
   - 如果看不到，先按提示给 Vercel 授权访问你的 GitHub 仓库

## 二、配置（保持默认即可）

Vercel 会自动识别为 Next.js 项目，默认配置如下，不用改：

| 配置项 | 值 |
|---|---|
| Framework Preset | Next.js |
| Build Command | `yarn build` |
| Output Directory | `out` |
| Install Command | `yarn install` |

不需要添加环境变量，直接点 **Deploy**。

## 三、等待构建

构建大约需要 3-5 分钟。成功后会得到一个 `xxx.vercel.app` 的临时域名，点开就能看到桌面了。

如果构建失败，把报错日志发给开发者看。

## 四、绑定自定义域名

1. 进入项目 → **Settings** → **Domains**
2. 输入 `pc.633668.xyz`，点 **Add**
3. Vercel 会显示需要添加的 DNS 记录（一般是一条 CNAME，指向 `cname.vercel-dns.com`）
4. 去 Cloudflare 后台 → 域名 `633668.xyz` → DNS → 添加这条 CNAME 记录
5. 等几分钟，`https://pc.633668.xyz` 就能访问了

## 五、以后更新

每次往 GitHub 仓库 `push` 新代码，Vercel 会自动重新构建部署，不用手动操作。

## 常见问题

- **构建慢**：正常，这个项目比较大（游戏模拟器、编辑器比较占体积），耐心等
- **页面空白**：检查浏览器控制台报错，可能是某次构建不完整，去 Vercel 后台点 Redeploy 重试一次
- **域名不生效**：检查 Cloudflare 的 CNAME 是否加对，DNS 生效最多需要几分钟
