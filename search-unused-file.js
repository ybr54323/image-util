#!/usr/bin/env node
import { program } from "commander";
import path from "path";
import fs from "fs";

import inquirer from "inquirer";
import chalk from "chalk";
import { formatBytes } from "./util.js";

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

  if (typeof options.target === "string") {
    const INPUT = options.target;

    const target = path.resolve(__dirname, INPUT);

    try {
      const fileList = getFileList(target);
      if (!fileList.length)
        return log(chalk.blueBright(`当前目录${target}下没有文件`));

      options.list && log(chalk.green(`文件列表:\n${fileList.join("\n")}`));

      dfs(fileList, target);
      const result = fileList.map((item) => {
        return path.resolve(target, item);
      });

      if (!result.length) {
        return log(chalk.greenBright(`当前目录${target}下没有可删除的文件`));
      }

      let count = 0;
      stepByStepDelete(result, 0, (path) => {
        const info = fs.statSync(path);
        count += info.size;
      }).finally(() => {
        log("已释放空间: ", chalk.greenBright(formatBytes(count)));
      });
    } catch (error) {
      log(
        chalk.redBright(`
请检查当前传入的--target: ${INPUT}, 是否合法目录路径
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
    .option(
      "-t, --target [target]",
      `目标目录, 例如 src/image ：目标目录 src/image 下有 a.png, 就会在当前项目目录下, 递归遍历所有文件。
若文件内容中存在 a.png 字眼, 则判定 a.png 当前是被引用的, 不应该被删除；否则 a.png 会被放入等候删除队列`
    )
    .option("-l [list]", "是否列出查出的文件")
    .option("-e --exclude [exclude...]", "排除在外的文件或目录名, 默认包括node_modules和.开头的文件夹")
    .version(JSON.parse(fs.readFileSync("./package.json", "utf8")).version);
  program.parse(process.argv);
  return program.opts();
}

function getFileList(path) {
  return fs.readdirSync(path);
}
function stepByStepDelete(list, i, cb) {
  if (i >= list.length) return;
  return inquirer
    .prompt({
      type: "confirm",
      name: "answer",
      message: `是否删除文件 ${list[i]}`,
    })
    .then(({ answer }) => {
      if (answer) {
        try {
          typeof cb === "function" && cb(list[i]);
          fs.unlinkSync(list[i]);
          if (i < list.length) {
            return stepByStepDelete(list, i + 1, cb);
          }
        } catch (error) {
          throw error;
        }
      } else {
        return stepByStepDelete(list, i + 1, cb);
      }
    });
}

function dfs(fileNameList, prefixPath) {
  if (!fileNameList.length) return;
  fileNameList = fileNameList.filter((item) => {
    return !item.match(/^\.\S+/) && !EXCLUDE.includes(item);
  });

  fileNameList.forEach((item) => {
    const newPath = path.resolve(prefixPath, item);

    const tmp = fs.statSync(newPath);
    if (tmp.isDirectory()) {
      const newPathList = fs.readdirSync(newPath);
      dfs(newPathList, newPath);
    } else if (tmp.isFile()) {
      const content = fs.readFileSync(newPath, "utf8");

      for (
        let i = 0;
        i > -1 && fileNameList.length && i < fileNameList.length;
        i++
      ) {
        if (new RegExp(fileNameList[i]).test(content)) {
          fileNameList.splice(i, 1);
          i -= 1;
        }
      }
    }
  });
}
