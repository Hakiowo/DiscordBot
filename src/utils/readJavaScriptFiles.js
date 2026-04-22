const fs = require("fs/promises");
const path = require("path");

async function readJavaScriptFiles(directoryPath) {
  const directoryEntries = await fs.readdir(directoryPath, { withFileTypes: true });
  const filePaths = [];

  for (const entry of directoryEntries) {
    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await readJavaScriptFiles(fullPath);
      filePaths.push(...nestedFiles);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      filePaths.push(fullPath);
    }
  }

  return filePaths;
}

module.exports = { readJavaScriptFiles };
