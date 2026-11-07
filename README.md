# 换你上场 · Six on Court

六人羽毛球混双轮换工具，纯 HTML / CSS / JavaScript，不需要安装依赖。

## 使用

- 点「一键安排首发」，或拖动四位球员到球场。手机上点选球员，再点空位或球员即可安排/替换。
- 每队必须一男一女。支持跨情侣搭档。
- 「下一轮」让休息区两位球员上场，分别替换最早上场的同性别球员。下场的人依次进入休息区。
- 上场顺序按每次进入球场记录；场内交换位置不重置顺序。
- 可手动移到休息区、修改性别、撤销操作、重新开始。
- 当前阵容、队列和轮次自动保存于当前浏览器 localStorage。不同设备各自记录，不提供多人同步。撤销历史仅在当前页面会话中保留。

预设：Steve / Alyx / Ray 为男生，Kathay / Stella / Frances 为女生。

## Scoring and positions

Use + / − to adjust either team’s score, or Reset score to clear both. Next round resets the scores. Scores are saved locally and included in Undo.

Swap A positions / Swap B positions exchanges teammates. Switch ends exchanges whole teams, including their scores. Entry order is preserved. Players can also be dragged or selected and moved manually.

## 本地预览

在项目目录运行 `python3 -m http.server 8080 --directory public`，打开 http://localhost:8080 。也可以直接打开 public/index.html。

## 部署到 Render

1. 把此目录的文件上传到你的 GitHub 仓库。
2. Render Dashboard → New → Static Site，连接该仓库。
3. Build Command：`echo "Static site ready"`。
4. Publish Directory：`public`。
5. 点击 Deploy Static Site，完成后即可使用 Render 提供的网址。

也可以选择 New → Blueprint 并连接仓库，Render 会读取根目录的 render.yaml。

官方文档：https://render.com/docs/static-sites

## 检查轮换逻辑

`node --test tests/rotation.test.cjs`
