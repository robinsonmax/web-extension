import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { FEATURES } from "../dist/features.js";

const activeFeatureIds = new Set(FEATURES.map((feature) => feature.id));

async function removeInactiveFeatureDirectories(outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });

  for (const entry of await readdir(outputDirectory, { withFileTypes: true })) {
    if (entry.isDirectory() && !activeFeatureIds.has(entry.name)) {
      await rm(join(outputDirectory, entry.name), {
        recursive: true,
        force: true,
      });
    }
  }
}

async function copyDirectory(sourceDirectory, outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });

  for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
    const sourcePath = join(sourceDirectory, entry.name);
    const outputPath = join(outputDirectory, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, outputPath);
    } else if (entry.isFile()) {
      await mkdir(dirname(outputPath), { recursive: true });
      await copyFile(sourcePath, outputPath);
    }
  }
}

await removeInactiveFeatureDirectories("dist/features");
await copyDirectory("src/features", "dist/features");
