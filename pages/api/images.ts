import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const imageDirectory = path.join(process.cwd(), "public", "images");

  try {
    const fileNames = fs.readdirSync(imageDirectory);
    const images = fileNames
      .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map((file) => `/images/${file}`);

    res.status(200).json(images);
  } catch (error) {
    console.error("Error reading image directory:", error);
    res.status(500).json({ error: "Unable to read image directory" });
  }
}
