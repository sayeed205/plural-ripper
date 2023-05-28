import axios from 'axios';
import { Presets, SingleBar } from 'cli-progress';
import fs from 'fs';
import path from 'path';
import { Course } from '../types/Course.js';
function sanitizeFilename(filename: string): string {
    return filename.replace(/[<>:"/\\|?*]/g, '');
}

function calculateDownloadSpeed(
    downloadedBytes: number,
    startTime: number,
    currentTime: number
): string {
    const elapsedTime = currentTime - startTime;
    const speed = (downloadedBytes / elapsedTime) * 1000; // Bytes per second

    if (speed < 1024) {
        return `${speed.toFixed(2)} B/s`;
    } else if (speed < 1024 * 1024) {
        const speedKB = (speed / 1024).toFixed(2); // Kilobytes per second, rounded to 2 decimal places
        return `${speedKB} KB/s`;
    } else {
        const speedMB = (speed / (1024 * 1024)).toFixed(2); // Megabytes per second, rounded to 2 decimal places
        return `${speedMB} MB/s`;
    }
}

async function downloadFile(
    url: string,
    filePath: string,
    progressBar: SingleBar
): Promise<void> {
    const response = await axios.get(url, { responseType: 'stream' });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    let downloadedBytes = 0;
    const startTime = Date.now();

    return new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
        response.data.on('data', (chunk: Buffer) => {
            downloadedBytes += chunk.length;
            progressBar.update(downloadedBytes, {
                speed: calculateDownloadSpeed(
                    downloadedBytes,
                    startTime,
                    Date.now()
                ),
            });
        });
    });
}

async function getFileSize(url: string): Promise<number> {
    const response = await axios.head(url);
    return Number(response.headers['content-length']);
}

export default async function downloadCourseVideos(
    json: string,
    dir: string
): Promise<void> {
    console.log('Checking JSON file...');
    if (!fs.existsSync(json)) {
        console.log('JSON file does not exist');
        return process.exit(1);
    }
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const course: Course = JSON.parse(fs.readFileSync(json, 'utf-8'));

    if (course.modules.length === 0) {
        console.log('No modules found in the JSON file');
        return process.exit(1);
    }

    const module = course.modules[0];
    const clip = module.clips[0];

    try {
        const response = await axios.head(clip.url);
        if (response.status === 403) {
            console.error(
                '\nLinks are expired. Please obtain a new JSON file with a valid URL.'
            );
            return process.exit(1);
        }
    } catch (error) {
        console.error(
            'Links are probably expired. Please obtain a new JSON file.'
        );
        return process.exit(1);
    }

    let totalFileSize = 0;
    console.log('Calculating total course size...');
    for (const module of course.modules) {
        for (const clip of module.clips) {
            totalFileSize += await getFileSize(clip.url);
        }
    }
    console.log(
        `Total course size: ${
            totalFileSize < 1024
                ? `${totalFileSize} bytes`
                : totalFileSize < 1024 * 1024
                ? `${(totalFileSize / 1024).toFixed(2)} KB`
                : totalFileSize < 1024 * 1024 * 1024
                ? `${(totalFileSize / (1024 * 1024)).toFixed(2)} MB`
                : `${(totalFileSize / (1024 * 1024 * 1024)).toFixed(2)} GB`
        }\n`
    );

    const progressBar = new SingleBar(
        {
            format: '{module}/{fileName} | {bar} | {percentage}% | {speed} | ETA: {eta}s',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
            etaBuffer: 50, // Adjust the etaBuffer for a smoother ETA calculation
        },
        Presets.shades_classic
    );

    progressBar.start(0, 0, {
        speed: '0.00 B/s',
        module: '',
        fileName: '',
    });

    progressBar.setTotal(totalFileSize);

    for (let i = 0; i < course.modules.length; i++) {
        const module = course.modules[i];

        const moduleDirectory = path.join(
            dir,
            sanitizeFilename(
                `${course.courseTitle} by ${course.courseAuthors} - Updated ${course.lastUpdated}`
            ),
            `${i + 1} - ${sanitizeFilename(module.title)}`
        );

        try {
            fs.mkdirSync(moduleDirectory, { recursive: true });
        } catch (error) {
            console.error(
                `Failed to create directory: ${moduleDirectory}`,
                error
            );
        }

        for (let j = 0; j < module.clips.length; j++) {
            const clip = module.clips[j];
            const fileName = `${j + 1} - ${sanitizeFilename(clip.title)}.mp4`;
            const filePath = path.join(moduleDirectory, fileName);

            progressBar.update(0, {
                module: module.title,
                fileName,
            });

            try {
                const fileSize = await getFileSize(clip.url);
                progressBar.setTotal(fileSize);
                await downloadFile(clip.url, filePath, progressBar);
                progressBar.update(0, { speed: '0.00 B/s' }); // Reset speed for the next URL
            } catch (error) {
                console.error(`Failed to download file: ${filePath}`, error);
            }
        }
    }

    progressBar.stop();
}
