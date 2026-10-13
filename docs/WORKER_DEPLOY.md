# Worker 部署教程 (R2 + Worker 静态托管)

本项目使用 Cloudflare Worker + R2 部署,不走 Pages 的在线构建。
原理: 本地 `yarn build` 生成 `out/` 静态文件 → 上传到 R2 存储桶 → Worker 从 R2 读取并返回。

## 一、准备工作

- Cloudflare 账号(已有)
- R2 存储桶 `daedalos-assets`(已创建,名称固定,worker.js 里引用了它)
- 本地已构建: `yarn build` 生成 `out/` 目录

## 二、部署 Worker

### 方法 1: 用 wrangler (推荐)

```bash
# 1. 登录
wrangler login

# 2. 进入项目目录
cd daedalOS

# 3. 上传 out/ 到 R2 (首次或文件有更新时)
# 注意: 需要逐个上传,可用脚本批量传
for f in $(find out -type f); do
  key=${f#out/}
  wrangler r2 object put daedalos-assets/$key --file=$f
done

# 4. 部署 Worker (worker.js + wrangler.toml)
wrangler deploy
```

`wrangler.toml` 参考配置:

```toml
name = "daedalos"
main = "worker.js"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "daedalos-assets"
```

### 方法 2: Dashboard 手动部署

1. Cloudflare 后台 → Workers → 创建 Worker,命名 `daedalos`
2. 把本仓库 `worker.js` 的内容粘贴进去,点部署
3. Worker → 设置 → 绑定 → 添加 R2 存储桶绑定:
   - 变量名: `ASSETS`
   - 存储桶: `daedalos-assets`
4. 上传文件到 R2: 后台 → R2 → `daedalos-assets` → 上传(保持目录结构, `out/` 里的文件直接放桶根目录)

## 三、绑定自定义域名

1. Worker → 设置 → 域和路由 → 添加自定义域 → 输入 `pc.633668.xyz`
2. Cloudflare 会自动配置 DNS,等待证书生效即可

## 四、更新流程

代码有更新时:

```bash
cd daedalOS
yarn build                    # 本地重新构建
# 只上传有变化的文件到 R2 (可用 rclone sync 或上面的 for 循环)
wrangler deploy               # 如果 worker.js 没改,这步可跳过
```

## 五、排查

- 页面空白: 检查 R2 里是否有 `index.html` 在桶根目录
- 样式/脚本 404: 检查文件是否完整上传,注意 `out/` 的内容要放在桶根目录,不是 `out/` 子目录
- 看日志: Worker → 日志 → 实时日志,可看到每个请求的 key 和状态
