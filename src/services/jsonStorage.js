const fs = require("fs/promises");
const path = require("path");

const writeQueues = new Map();

async function ensureJsonFile(filePath, defaultData) {
  try {
    await fs.access(filePath);
  } catch (error) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
  }
}

async function readJsonFile(filePath, defaultData) {
  await ensureJsonFile(filePath, defaultData);

  const content = await fs.readFile(filePath, "utf8");

  if (!content.trim()) {
    return defaultData;
  }

  return JSON.parse(content);
}

async function writeJsonFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

function updateJsonFile(filePath, defaultData, updater) {
  const previousQueue = writeQueues.get(filePath) || Promise.resolve();

  const nextQueue = previousQueue.then(async () => {
    const currentData = await readJsonFile(filePath, defaultData);
    const updatedData = await updater(currentData);

    await writeJsonFile(filePath, updatedData);

    return updatedData;
  });

  writeQueues.set(filePath, nextQueue.catch(() => {}));

  return nextQueue;
}

module.exports = {
  readJsonFile,
  updateJsonFile
};
