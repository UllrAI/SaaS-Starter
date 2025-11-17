const fs = require("fs");
const path = require("path");

module.exports = async () => {
  const coverageDir = path.join(__dirname, "coverage");
  try {
    fs.rmSync(coverageDir, { recursive: true, force: true });
  } catch {
    // Ignore errors – the directory might not exist yet.
  }
};
