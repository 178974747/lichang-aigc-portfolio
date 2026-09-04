# 李畅 · AIGC作品集

清新自然风格的个人 AIGC 作品集（纯静态）。支持在页面内直接上传作品，作品保存在当前浏览器的 IndexedDB 中。

公开站点：https://178974747.github.io/lichang-aigc-portfolio/

## 本地预览

```bash
npx --yes serve .
```

或直接用浏览器打开 `index.html`。

## 上传作品

1. 打开站点，进入「上传」
2. 拖拽或选择封面图（建议不超过 4.5MB）
3. 填写标题、分类、年份等信息并发布
4. 作品会出现在「作品墙」；详情页可删除

说明：因 GitHub Pages 无后端，上传内容仅保存在**本机当前浏览器**，换设备或清缓存后需重新上传。

## 自定义

- 文案与邮箱：编辑 `index.html`
- 视觉样式：编辑 `css/styles.css`
- 存储逻辑：编辑 `js/storage.js` / `js/main.js`

## GitHub Pages

推送到 `main` 后自动更新：`https://<username>.github.io/lichang-aigc-portfolio/`
