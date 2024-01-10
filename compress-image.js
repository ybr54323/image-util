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

      const promises = [];
      let start = 0;
      let end = 0;

      fileList.forEach((file) => {
        /**
         * 没传format 就按照原来的格式去压缩
         */
        const format = options.format || file.split(".").pop();
        if (acceptableExts.indexOf(format) === -1) return;

        let fileName;
        (fileName = file.split(".")) &&
          fileName.pop() &&
          (fileName = fileName.join("."));

        const filePath = path.resolve(target, file);
        const fileBuffer = fs.readFileSync(filePath);
        const targetFile = `${fileName}.${format}`;
        promises.push(
          new Promise((res) => {
            sharp(fileBuffer)
              .metadata()
              .then(({ size: prevSize }) => {
                start += prevSize;
                sharp(fileBuffer)
                  [format]({ quality })
                  .toFile(path.resolve(dir, targetFile), (err, info) => {
                    sharp(fs.readFileSync(path.resolve(dir, targetFile)))
                      .metadata()
                      .then(({ size: nextSize }) => {
                        end += nextSize;
                        res(end);
                      });
                  });
              });
          })
        );
      });
      Promise.all(promises).finally(() => {
        log(
          chalk.greenBright(
            `
压缩质量分数: ${quality}
压缩前大小: ${formatBytes(start)}
压缩后大小: ${formatBytes(end)}
压缩率: ${((start - end) / start) * 100 + "%"}
            `
          )
        );
      });
    } catch (error) {
      log(
        chalk.redBright(`
请检查当前传入的--target: ${target}，是否合法目录路径
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
