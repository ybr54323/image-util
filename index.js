#!/usr/bin/env node
import { program } from "commander";
import path from "path";
import fs from "fs";

import inquirer from "inquirer";
import chalk from "chalk";
import sharp from "sharp";

const __dirname = process.cwd();
const log = console.log;

const EXCLUDE = ["node_modules", ".git"];

main();

function main() {
  const options = getUserInput();
  if (
    options.exclude &&
    Array.isArray(options.exclude) &&
    options.exclude.length
  ) {
    EXCLUDE.push(...options.exclude);
  }

  if (options.target) {
    const INPUT = options.target;

    const target = path.resolve(__dirname, INPUT);

    try {
      const fileList = getFileList(target);
      if (!fileList.length)
        return log(chalk.blueBright(`当前目录${target}下没有文件`));

      options.list && log(chalk.green(`文件列表:\n${fileList.join("\n")}`));

      const promises = [];
      let prev = 0;
      let next = 0;

      fileList.forEach((file) => {
        const filePath = path.resolve(target, file);
        const fileBuffer = fs.readFileSync(filePath);
        promises.push(
          new Promise((res) => {
            sharp(fileBuffer)
              .metadata()
              .then(({ size: prevSize }) => {
                prev += prevSize;
                sharp(fileBuffer)
                  .webp({ quality: 99 })

                  .toFile(path.resolve("tmp", file), (err, info) => {
                    sharp(fs.readFileSync(path.resolve("tmp", file)))
                      .metadata()
                      .then(({ size: nextSize }) => {
                        next += nextSize;
                        res(next);
                      });
                  });
              });
          })
        );
      });
      Promise.all(promises).finally(() => {
        console.log(formatBytes(prev), formatBytes(next));
      });

      // dfs(fileList, target);

      // const result = fileList.map((item) => {
      //   return path.resolve(target, item);
      // });

      // if (!result.length) {
      //   return log(chalk.greenBright(`当前目录${target}下没有可删除的文件`));
      // }

      // let count = 0;
      // stepByStepDelete(result, 0, (path) => {
      //   const info = fs.statSync(path);
      //   count += info.size;
      // }).finally(() => {
      //   log("已释放空间: ", chalk.greenBright(formatBytes(count)));
      // });
    } catch (error) {
      log(
        chalk.redBright(`
请检查当前传入的--target: ${INPUT}，是否合法目录路径
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
    .version(JSON.parse(fs.readFileSync("./package.json", "utf8")).version)
    .option(
      "-t, --target [target]",
      `目标目录，例如 src/image ：目标目录 src/image 下有 a.png，就会在当前项目目录下，递归遍历所有文件。
若文件内容中存在 a.png 字眼，则判定 a.png 当前是被引用的，不应该被删除；否则 a.png 会被放入等候删除队列`
    )
    .option("-l [list]", "是否列出查出的文件")
    .option("-e --exclude [exclude...]", "排除在外的文件或目录名");
  program.parse(process.argv);
  return program.opts();
}

function getFileList(path) {
  return fs.readdirSync(path);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
