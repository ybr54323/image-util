
# 优化工具
- 基于sharp实现的图片格式转换、体积压缩功能.
- 查找当前没有被依赖的文件资源, 并提供命令行交互式逐个删除功能.

## 功能介绍
1. 基于sharp实现的图片格式转换、体积压缩功能
可以执行`ci -h`或者`compress-image -h`查看功能介绍

2. 根据给出的文件夹, 在整个项目工程中搜索并列出该文件夹下未被使用的文件资源, 并提供交互式删除,
   可以执行`suf -h`或者`search-unused-file -h`查看功能介绍

## 安装
```bash
npm install -f image-util -g
```

## 使用例子
1. 处理image目录下的图片, 格式全部转换为webp(默认), 质量分数`50`(1-100), 输出到`public`目录下
```bash
ci -t image -f webp -q 50 -d public
```

2. 列出image目录下, 文件名(文件名+后缀)没出现在当前目录下其他文件中的内容,  排除`node_modules`, `test`目录, 即列出image目录下没被依赖的文件.
```bash
suf -t image -e node_modules test
```


## 实现背景:

   
