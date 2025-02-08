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
    // 新增参数检查
    if (!options.quality) {
      log(chalk.hex('#4FC3F7')(`📝 使用 ${chalk.bold('-q/--quality')} 指定质量参数（1-99），默认使用99`));
    }

    let quality = /^\d+$/.test(options.quality) ? options.quality : 99;
    quality = Math.min(Math.max(quality, 1), 99); // 确保数值在1-99之间

    if (options.format && !acceptableExts.includes(options.format)) {
      log(chalk.red(`无效格式参数：${options.format}，仅支持 ${acceptableExts.join('/')}`));
      process.exit(1);
    }

    const inputTarget = options.target;

    const target = path.resolve(__dirname, inputTarget);

    let dir;
    if (options.dir) {
      dir = options.dir;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      log(chalk.hex('#FFB74D')(`💾 输出目录：${chalk.underline(options.dir)}`));
    } else {
      dir = inputTarget;
      log(chalk.hex('#FFB74D')(`⚠️  ${chalk.bold('注意：')}未指定输出目录将进行${chalk.red('原地替换')}，这会覆盖原始文件！`));
    }

    // 新增变量声明
    let start = 0;
    let end = 0;

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

          await image[format]({ quality })
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

        // 修改统计方式，使用已累加的变量
        log(
          chalk.greenBright(
            `
压缩质量分数: ${quality}
压缩前大小: ${formatBytes(start)}
压缩后大小: ${formatBytes(end)}
压缩率: ${(((start - end) / start) * 100).toFixed(2) + "%"}
            `
          )
        );
        log(chalk.hex('#81C784')(`✅ 成功压缩 ${chalk.bold(validResults.length)} 个文件`));
      }).catch(error => {
        console.error(chalk.red(`处理文件失败: ${error.message}`));
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
