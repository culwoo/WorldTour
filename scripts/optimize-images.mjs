import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const imagesDir = path.join(projectRoot, 'public', 'images');
const dataFilePath = path.join(projectRoot, 'src', 'data', 'images.ts');

const MAX_WIDTH = Number(process.env.IMG_MAX_WIDTH ?? 1920);
const WEBP_QUALITY = Number(process.env.IMG_WEBP_QUALITY ?? 72);
const WEBP_EFFORT = Number(process.env.IMG_WEBP_EFFORT ?? 5);

const formatKB = (bytes) => `${(bytes / 1024).toFixed(1)}KB`;
const formatMB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)}MB`;

const isJpeg = (fileName) => /\.(jpe?g)$/i.test(fileName);

const main = async () => {
    const entries = await fs.readdir(imagesDir, { withFileTypes: true });
    const jpegFiles = entries.filter((entry) => entry.isFile() && isJpeg(entry.name));

    if (jpegFiles.length === 0) {
        console.log('No JPG/JPEG files found in public/images. Nothing to optimize.');
        return;
    }

    let dataFile = await fs.readFile(dataFilePath, 'utf8');
    let totalBefore = 0;
    let totalAfter = 0;
    const touched = [];

    for (const entry of jpegFiles) {
        const originalName = entry.name;
        const inputPath = path.join(imagesDir, originalName);
        const outputName = originalName.replace(/\.(jpe?g)$/i, '.webp');
        const outputPath = path.join(imagesDir, outputName);

        const beforeStat = await fs.stat(inputPath);
        totalBefore += beforeStat.size;

        await sharp(inputPath)
            .rotate()
            .resize({ width: MAX_WIDTH, withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
            .toFile(outputPath);

        const afterStat = await fs.stat(outputPath);
        totalAfter += afterStat.size;

        await fs.unlink(inputPath);

        const oldUrl = `/images/${originalName}`;
        const newUrl = `/images/${outputName}`;
        dataFile = dataFile.split(oldUrl).join(newUrl);

        touched.push({
            name: originalName,
            before: beforeStat.size,
            after: afterStat.size
        });
    }

    await fs.writeFile(dataFilePath, dataFile, 'utf8');

    console.log(`Optimized ${touched.length} image(s) in public/images`);
    touched
        .sort((a, b) => b.before - a.before)
        .forEach((item) => {
            const reduction = item.before - item.after;
            const ratio = ((reduction / item.before) * 100).toFixed(1);
            console.log(
                `${item.name}: ${formatKB(item.before)} -> ${formatKB(item.after)} (-${ratio}%)`
            );
        });

    const totalReduction = totalBefore - totalAfter;
    const totalRatio = ((totalReduction / totalBefore) * 100).toFixed(1);

    console.log(
        `Total: ${formatMB(totalBefore)} -> ${formatMB(totalAfter)} (-${totalRatio}%)`
    );
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
