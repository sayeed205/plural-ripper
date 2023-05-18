import axios from 'axios';
import { Presets, SingleBar } from 'cli-progress';
import fs from 'fs';
import path from 'path';
import { Clip, Course, Module } from '../types/Course.js';

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

async function downloadFile(url: string, filePath: string): Promise<void> {
    const response = await axios.get(url, { responseType: 'stream' });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
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

    const module: Module = course.modules[0];
    const clip: Clip = module.clips[0];

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

    const progressBar = new SingleBar(
        {
            format: 'Downloading {module} - {fileName} | {bar} | {percentage}% | {speed} | ETA: {eta}s',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
        },
        Presets.shades_classic
    );

    progressBar.start(course.modules.length, 0, {
        speed: '0.00 KB/s',
        module: '',
        fileName: '',
    });

    for (let i = 0; i < course.modules.length; i++) {
        const module: Module = course.modules[i];
        const moduleDirectory = path.join(
            dir,
            sanitizeFilename(
                `${course.courseTitle} by ${course.courseAuthors} - Updated ${course.lastUpdated}`
            ),
            sanitizeFilename(`${i + 1} - ${module.title}`)
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
            const clip: Clip = module.clips[j];
            const fileName = `${j + 1} - ${sanitizeFilename(clip.title)}.mp4`;
            const filePath = path.join(moduleDirectory, fileName);

            progressBar.update(i, {
                module: module.title,
                fileName,
            });

            try {
                const startTime = Date.now();
                await downloadFile(clip.url, filePath);
                const downloadedBytes = fs.statSync(filePath).size;
                progressBar.increment({
                    speed: calculateDownloadSpeed(
                        downloadedBytes,
                        startTime,
                        Date.now()
                    ),
                });
            } catch (error) {
                if (
                    axios.isAxiosError(error) &&
                    error.response?.status === 403
                ) {
                    // hasExpiredLinks = true;
                    console.error(
                        '\nLinks are expired. Please obtain a new JSON file with valid URLs.'
                    );
                    break;
                }
                console.error(`Failed to download file: ${filePath}`, error);
            }
        }

        // if (hasExpiredLinks) {
        //     break;
        // }
    }

    progressBar.stop();
}
