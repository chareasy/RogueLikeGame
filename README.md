# 割草幸存者 MVP

短局清怪割草（幸存者-like）网页原型：俯视角移动、自动攻击、刷怪潮、升级三选一，8 分钟一局，Boss 于 6:00 登场。

## 在线试玩

https://chareasy.github.io/RogueLikeGame/

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

## 操作

- **WASD / 方向键**：移动
- 攻击全自动，瞄准最近敌人
- 升级时暂停，点击三选一强化

## 素材

`public/assets/` 下为 AI 生成的像素风资源（玩家、5 种敌人、弹道、经验宝石、地面砖、菜单背景），运行时由 `BootScene` 加载。

## 技术栈

- Vite + TypeScript
- Phaser 3

## 构建

```bash
npm run build
npm run preview
```
