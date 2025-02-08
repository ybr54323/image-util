#!/usr/bin/env node
import { program } from "commander";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import sharp from "sharp";
import { formatBytes } from "./util.js";

const __dirname = process.cwd();
const log = console.log;

const acceptableExts = ["webp", "jpeg", "png", "gif"];

main();

function main() {
  const options = getUserInput();

  if (typeof options.target === "string") {
    let quality = /^\d+$/.test(options.quality) ? options.quality : 99;
    quality = +quality;

    const inputTarget = options.target;

    const target = path.resolve(__dirname, inputTarget);

    let dir;
    if (options.dir) {
      dir = options.dir;
      fs.mkdirSync(options.dir);
    } else dir = inputTarget;

    try {
      const fileList = getFileList(target).filter((file) => {
        /**
         * 只能是图片
         */
        const ext = file.split(".").pop();
        return acceptableExts.indexOf(ext) > -1;
      });
      if (!fileList.length)
        return log(chalk.blueBright(`当前目录${target}下没有图片`));

      options.list && log(chalk.green(`文件列表:\n${fileList.join("\n")}`));

      const promises = fileList.map(async (file) => {
        try {
          const format = options.format || file.split('.').pop();
          if (!acceptableExts.includes(format)) return;

          const fileName = file.replace(/\.[^/.]+$/, '');
          const filePath = path.resolve(target, file);
          const outputPath = path.resolve(dir, `${fileName}.${format}`);
          
          // 使用异步读取替代同步读取
          const fileBuffer = await fs.promises.readFile(filePath);
          
          // 单次sharp处理流程
          const image = sharp(fileBuffer);
          const { size: prevSize } = await image.metadata();
          start += prevSize;

          await image[format]({ quality: +options.quality })
            .toFile(outputPath);

          const { size: nextSize } = await sharp(await fs.promises.readFile(outputPath)).metadata();
          end += nextSize;
          
          return { prevSize, nextSize };
        } catch (error) {
          console.error(chalk.red(`处理文件 ${file} 失败: ${error.message}`));
          return null;
        }
      });

      Promise.all(promises).then(results => {
        const validResults = results.filter(Boolean);
        if (validResults.length === 0) return;
        
        const totalStart = validResults.reduce((sum, r) => sum + r.prevSize, 0);
        const totalEnd = validResults.reduce((sum, r) => sum + r.nextSize, 0);

        log(
          chalk.greenBright(
            `
压缩质量分数: ${quality}
压缩前大小: ${formatBytes(totalStart)}
压缩后大小: ${formatBytes(totalEnd)}
压缩率: ${(((totalStart - totalEnd) / totalStart) * 100).toFixed(2) + "%"}
            `
          )
        );
      });
    } catch (error) {
      log(
        chalk.redBright(`
请检查当前传入的--target: ${target}, 是否合法目录路径
      `)
      );
      throw error;
    }
  } else {
    log(chalk.blueBright("请传入目标目录地址 -t"));
  }
}

function getUserInput() {
  program
    .option("-t, --target [target]", `目标目录, 图片文件的所在目录`)
    .option("-q --quality [quality]", "压缩图片的质量, 1-100, 默认为99")
    .option(
      "-f --format [format]",
      "图片的转换格式, 可选: webp/jpeg/png, 默认用原来的格式, 格式只能是webp/jpeg/png"
    )
    .option("-l [list]", "是否列出查出的文件")
    .option("-d --dir [dir]", "输出的文件夹, 默认是所传的-t, 即原地替换")
    .version(JSON.parse(fs.readFileSync("./package.json", "utf8")).version);
  program.parse(process.argv);
  return program.opts();
}

function getFileList(path) {
  return fs.readdirSync(path);
}
