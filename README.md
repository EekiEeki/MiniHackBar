# MiniHackBar

临时要用 HackBar，把老版本拖进 Chrome 发现已经不兼容了，商店里能装的新版本也有点毛病。想找类似的工具，翻了一圈也没找到合适的，一怒之下干脆自己用AI跑了一个。

于是有了 MiniHackBar —— 一个适配 Manifest V3 的新版 Chrome/Edge 扩展，把 HackBar 最常用的那套「改包重放」体验重新做了一遍。

## 它能干什么

- **改包重放**：随手改 URL、方法、请求头、POST Body，一键 Execute，响应直接渲染在当前页面，不用切工具、不丢上下文。
- **自定义请求头**：每行一个 `Name: Value`，走 `declarativeNetRequest` 会话规则实时生效。测越权、SSRF、IP 伪造时最常用（比如 `X-Forwarded-For`、`X-Real-IP`）。

## 特点

- **原生 MV3**：适配新版 Chrome / Edge，不再受 Manifest V2 停用影响。
- **两个入口**：F12 里多一个 `MiniHackBar` 面板；点扩展图标也能在页面右上角挂个浮层工具条。
- **响应就地渲染**：GET 直接导航、POST 以表单提交，结果就出在当前页面，DevTools 面板不会消失。
- **Load 当前 URL**：一键把当前页面地址填进输入框。
- **编解码工具箱**：URL / Base64 / HTML / Unicode / Hex 编解码，选中哪段转哪段，不选就转整段。
- **浅色 + 暗色主题**，状态自动记住。
- **零依赖**：纯原生 JS，无构建步骤，改完直接加载。

## 安装（开发者模式加载）

1、打开 `chrome://extensions/`（Edge 为 `edge://extensions/`）

2、右上角打开「开发者模式」

3、点「加载已解压的扩展程序」，选择本目录

4、按 F12 进 DevTools，切到 `MiniHackBar` 面板；或点扩展图标用页面浮层

## 文件结构

```
manifest.json     扩展清单（MV3）
background.js     service worker：注入浮层 + DNR 挂请求头
devtools.html/js  注册 DevTools 面板
devpanel.html/js  DevTools 面板 UI 与逻辑
panel.js          注入页面的浮层工具条（Shadow DOM 隔离）
ops.js            共用编解码函数
```

## 免责声明

本工具仅供**授权范围内的安全测试、自身系统调试与学习交流**使用。请勿用于未授权的攻击行为。使用者需自行承担因使用本工具产生的一切法律责任。

## License

MIT
