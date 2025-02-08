
# Image Utilities Tool

[![npm version](https://img.shields.io/npm/v/image-util)](https://www.npmjs.com/package/image-util)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

专业的图片处理命令行工具，提供图片压缩和未使用文件检测两大核心功能。

## 功能特性

### 🖼️ 图片压缩
- 支持格式：`webp`/`jpeg`/`png`/`gif`
- 质量调节（1-99）
- 格式转换
- 压缩率统计
- 安全模式（指定输出目录避免覆盖）

### 🧹 未使用文件检测
- 递归目录扫描
- 内容引用检测
- 交互式删除确认
- 排除目录支持
- 空间释放统计

## 安装
```bash
npm install -g image-util
```

## 使用说明

### 图片压缩
```bash
ci --target [目录路径] [选项]

# 示例
ci -t ./images -q 80 -f webp -d ./output
```

| 选项 | 简写 | 描述 | 默认值 |
|------|------|------|-------|
| --target | -t | 目标目录（必填） | - |
| --quality | -q | 压缩质量（1-99） | 99 |
| --format | -f | 输出格式（webp/jpeg/png） | 原格式 |
| --dir | -d | 输出目录 | 原地替换 |
| --list | -l | 显示文件列表 | false |

### 未使用文件检测
```bash
su --target [目录路径] [选项]

# 示例
su -t ./assets -e test_data temp_files
```

| 选项 | 简写 | 描述 | 默认值 |
|------|------|------|-------|
| --target | -t | 扫描目录（必填） | - |
| --exclude | -e | 排除目录/文件 | node_modules/.git |
| --list | -l | 显示文件列表 | false |

## 使用示例

### 压缩案例
```bash
$ ci -t ./src/images -q 75 -f webp -d ./dist

📝 使用 -q/--quality 指定质量参数（1-99），默认使用99
💾 输出目录：./dist

压缩质量分数: 75
压缩前大小: 24.8 MB
压缩后大小: 8.2 MB
压缩率: 66.94%
✅ 成功压缩 42 个文件
```

### 清理案例
```bash
$ su -t ./public -e temp_files

? 是否删除文件 /project/public/banner-old.jpg (Y/n) y
? 是否删除文件 /project/public/obsolete-logo.png (Y/n) n

已释放空间:  1.7 MB
```

## 开发指南

### 本地测试
```bash
npm link
ci --help  # 测试压缩命令
su --help  # 测试清理命令
```

### 构建发布
```bash
npm version patch -m "发布版本 %s"
npm publish --access=public
```

## 注意事项
1. 使用原地替换模式（不指定-d参数）前建议备份
2. 质量参数超过99会自动限制到最大值
3. 排除目录支持glob模式（如 `*.tmp`）
4. Windows系统安装时需确保已安装Visual C++运行库