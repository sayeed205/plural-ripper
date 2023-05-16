const { readFileSync, existsSync, mkdirSync } = require("fs");
const { parse, resolve } = require("path");
const AdmZip = require("adm-zip");

try {
    const { base } = parse(__dirname);
    const { version } = JSON.parse(
        readFileSync(resolve(__dirname, "build", "manifest.json"), "utf8")
    );

    const outDir = "release";
    const filename = `${base}-v${version}.zip`;
    const zip = new AdmZip();
    zip.addLocalFolder("build");
    if (!existsSync(outDir)) {
        mkdirSync(outDir);
    }
    zip.writeZip(`${outDir}/${filename}`);

    console.log(
        `Success! Created a ${filename} file under ${outDir} directory. You can upload this file to web store.`
    );
} catch (e) {
    console.error("Error! Failed to generate a zip file.");
}
