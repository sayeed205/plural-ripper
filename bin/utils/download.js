var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
import { Presets, SingleBar } from 'cli-progress';
import fs from 'fs';
import path from 'path';
function sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]/g, '');
}
function calculateDownloadSpeed(downloadedBytes, startTime) {
    const elapsedTime = Date.now() - startTime;
    const speed = downloadedBytes / (elapsedTime / 1000); // Bytes per second
    const formattedSpeed = (speed / 1024).toFixed(2); // Kilobytes per second, rounded to 2 decimal places
    return `${formattedSpeed} KB/s`;
}
function downloadFile(url, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios.get(url, { responseType: 'stream' });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    });
}
export default function downloadCourseVideos(course, dir) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const progressBar = new SingleBar({
            format: 'Downloading {module}/{fileName} | {bar} | {percentage}% | {speed} | ETA: {eta}s',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
        }, Presets.shades_classic);
        progressBar.start(course.modules.length, 0, {
            speed: '0.00 KB/s',
            module: '',
            fileName: '',
        });
        let hasExpiredLinks = false;
        for (let i = 0; i < course.modules.length; i++) {
            const module = course.modules[i];
            const moduleDirectory = path.join(dir, sanitizeFilename(`${course.courseTitle} by ${course.courseAuthors} - Updated ${course.lastUpdated}`), sanitizeFilename(`${i + 1} - ${module.title}`));
            try {
                fs.mkdirSync(moduleDirectory, { recursive: true });
            }
            catch (error) {
                console.error(`Failed to create directory: ${moduleDirectory}`, error);
            }
            for (let j = 0; j < module.clips.length; j++) {
                const clip = module.clips[j];
                const fileName = `${j + 1} - ${sanitizeFilename(clip.title)}.mp4`;
                const filePath = path.join(moduleDirectory, fileName);
                progressBar.update(i, {
                    module: module.title,
                    fileName,
                    speed: '0.00 KB/s',
                });
                try {
                    const startTime = Date.now();
                    yield downloadFile(clip.url, filePath);
                    const downloadedBytes = fs.statSync(filePath).size;
                    progressBar.increment({
                        speed: calculateDownloadSpeed(downloadedBytes, startTime),
                    });
                }
                catch (error) {
                    if (axios.isAxiosError(error) &&
                        ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 403) {
                        hasExpiredLinks = true;
                        console.error('Links are expired. Please obtain a new JSON file with valid URLs.');
                        break;
                    }
                    console.error(`Failed to download file: ${filePath}`, error);
                }
            }
            if (hasExpiredLinks) {
                break;
            }
        }
        progressBar.stop();
    });
}
//# sourceMappingURL=download.js.map