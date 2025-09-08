import fs from "fs";
import path from "path";

const repoDir = path.join(process.cwd(), "repo-deployments");

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, fileList); // recurse into subfolder
    } else if (file.endsWith(".xml") || file.endsWith(".zip")) {
      // return relative path so UI can show subfolder context
      fileList.push(fullPath.replace(repoDir + path.sep, ""));
    }
  });
  return fileList;
}

export const getDeploymentFiles = () => {
  return walkDir(repoDir);
};
