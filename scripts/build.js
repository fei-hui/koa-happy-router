const fs = require("fs");
const path = require("path");
const util = require("util");

// 基于项目根目录获取文件
const resolve = (opt) => path.resolve(__dirname, "..", opt);

/**
 * 复制指定的文件到打包文件夹
 *
 * @param {Array<string>} files 需要复制的文件名，文件路径基于项目根目录
 */
const copyFilesToDist = (files) => {
  const copyFile = util.promisify(fs.copyFile);
  return Promise.all(
    files.map((file) => copyFile(resolve(file), resolve(`dist/${file}`)))
  );
};

/**
 * 删除指定的文件
 *
 * @param {Array<string>} files 需要删除的文件，文件路径基于项目根目录
 */
const deleteFiles = (files) => {
  const unlinkFile = util.promisify(fs.unlink);
  return Promise.all(files.map((file) => unlinkFile(resolve(file))));
};

/**
 * 分离开发环境和生产环境的 package.json
 */
const createDistPackage = () => {
  const package = require("../package.json");
  // 修改 package.json 的内容
  {
    package.main = "lib/index.js";
    package.types = "lib/index.d.ts";
    // 删除无用的代码
    delete package.husky;
    delete package.scripts;

    // 移除开发配置中的其他非类型声明的依赖
    if (package.devDependencies) {
      Object.keys(package.devDependencies).forEach((key) => {
        if (!/@types\/(\w)/g.test(key)) {
          delete package.devDependencies[key];
        }
      });
    }
  }
  // 生成新的 package.json
  {
    const filePath = resolve("dist/package.json");
    const fileData = JSON.stringify(package, "", "\t");

    fs.writeFile(filePath, fileData, "utf-8", (err) => {
      if (err) {
        throw new Error(`[Error]`, err.message);
      }
    });
  }
};

createDistPackage();
deleteFiles(["dist/tsconfig.tsbuildinfo"]);
copyFilesToDist([".npmrc", "LICENSE", "README.md"]);
