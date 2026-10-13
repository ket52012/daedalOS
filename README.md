# 志远云电脑 🌌

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ket52012/daedalOS)

在浏览器里运行的桌面环境，打开即用，不用安装。

> 📖 部署教程：[docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md) ｜ 搭建说明：[docs/SETUP.md](docs/SETUP.md)

## 功能

- 🖥️ 完整桌面体验：窗口管理、开始菜单、任务栏、文件管理器
- 🌐 内置浏览器，桌面一键直达常用网站
- ⌨️ 终端、代码编辑器、画图、PDF 阅读器、视频播放器
- 🎮 DOS 模拟器、红白机模拟器、扫雷、2048 等小游戏
- 📁 文件拖拽上传下载，右键菜单

## 本地运行

```bash
yarn install
yarn build:prebuild
yarn dev
```

## 构建部署

```bash
yarn build
```

构建产物在 `out/` 目录，可部署到 Vercel（推荐）或任何静态托管。

## 说明

基于 [DustinBrett/daedalOS](https://github.com/DustinBrett/daedalOS) 开源项目定制：精简应用、中文汉化、添加网站快捷方式。
