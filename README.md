# 李畅 · AIGC作品集

清新自然风格的个人 AIGC 作品集。

- **访客**：只能浏览公开作品墙（图片 / 视频）
- **作者**：页脚「作者管理」登录后可上传 / 删除；发布写入 GitHub，全站可见

公开站点：https://178974747.github.io/lichang-aigc-portfolio/

## 作者如何发布

1. 打开站点，点页脚 **作者管理**
2. 输入管理密码（当前为 `lichang`，可在 `js/config.js` 的 `adminPassword` 修改）
3. 粘贴 **GitHub Token**（仅当前会话保存在浏览器，关标签即失效）
   - GitHub → Settings → Developer settings → Personal access tokens
   - 建议 Fine-grained：只选仓库 `lichang-aigc-portfolio`，权限 **Contents: Read and write**
4. 在「上传」区选择图片或视频并公开发布
5. 约 1 分钟后 Pages 更新，访客即可看到

图片建议 ≤ 8MB，视频建议 ≤ 80MB（MP4 / WebM）。

## 本地预览

```bash
npx --yes serve .
```

## 自定义

- 管理密码 / 仓库名：`js/config.js`
- 文案：`index.html`
- 公开作品数据：`data/works.json`
- 媒体文件：`media/`

## 说明

管理密码用于进入上传入口；没有有效 Token 仍无法写入仓库。请勿把 Token 写进代码或提交到 git。
