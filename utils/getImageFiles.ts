import fs from "fs";
import path from "path";

export function getImageFiles() {
  const imageDirectory = path.join(process.cwd(), "public", "images");
  const fileNames = fs.readdirSync(imageDirectory);
  return fileNames
    .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    .map((file) => `/images/${file}`);
}
