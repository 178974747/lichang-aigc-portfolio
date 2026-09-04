# 李畅 · AIGC作品集

个人 AIGC 作品集网站（纯静态，无需构建）。

公开站点（GitHub Pages）：推送到本仓库 `main` 分支后，访问  
`https://<your-username>.github.io/lichang-aigc-portfolio/`

## 本地预览

用浏览器直接打开 `index.html`，或在项目目录启动本地服务：

```bash
npx --yes serve .
```

## 公开部署 · GitHub Pages

1. 将本仓库推送到 GitHub（仓库名 `lichang-aigc-portfolio`）
2. Settings → Pages → Source 选 `main` 分支、根目录 `/`
3. 稍等片刻即可获得公开链接：`https://<username>.github.io/lichang-aigc-portfolio/`

也可部署到 Cloudflare Pages / Netlify / Vercel：Import 本仓库，构建命令留空，发布目录为 `/`。

## 自定义内容

- 作品数据：编辑 `js/works.js`
- 文案、邮箱与社交链接：编辑 `index.html`
- 视觉样式：编辑 `css/styles.css`

替换作品封面时，可在 `works.js` 中为条目增加 `image` 字段，并在 `main.js` 渲染处改为使用背景图。
