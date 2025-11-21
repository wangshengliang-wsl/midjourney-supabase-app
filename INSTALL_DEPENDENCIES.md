# 图片预览功能依赖安装

由于 pnpm store 位置冲突，请手动安装以下依赖：

## 安装命令

```bash
# 方法 1：使用 pnpm（推荐先运行 pnpm install 解决 store 问题）
pnpm install
pnpm add @radix-ui/react-dialog embla-carousel-react

# 方法 2：使用 npm（如果 pnpm 仍有问题）
npm install @radix-ui/react-dialog embla-carousel-react
```

## 依赖说明

- `@radix-ui/react-dialog`: Dialog 组件的底层库
- `embla-carousel-react`: 轮播图组件的底层库

## 功能说明

安装完成后，图片预览功能将包括：

1. ✅ 点击图片打开预览弹框
2. ✅ 支持左右箭头键盘导航
3. ✅ 支持鼠标点击左右按钮切换图片
4. ✅ 图片轮播效果（循环播放）
5. ✅ 在预览中可以下载图片
6. ✅ 显示图片对应的提示词
7. ✅ 全屏黑色背景，突出展示图片

## 使用方法

生成图片后，直接点击任意图片即可打开预览模式。

