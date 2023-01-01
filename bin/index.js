#! /usr/bin/env node

const args = require("yargs").argv;
const Downloader = require("nodejs-file-downloader");
const fs = require("fs");
const extractZip = require("extract-zip");
const path = require("path");
const rimraf = require("rimraf");

const recentVersion = "0.10.4";

const validDevices = [
    "darwin_amd64",
    "darwin_arm64",
    "linux_amd64",
    "linux_arm64",
    "windows_amd64",
    "windows_arm64",
];

const validVersionDigits = [
    ".",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
]

if (args.h) {
    console.log(
`-v: Set the version of 'pocketbase.exe' to install (default: ${recentVersion})
-d: Set the device release to download (default: windows_amd64)`
    );
    process.exit(0);
}

let device = "windows_amd64"
if (args.d) {
    device = args.d;
}

if (!validDevices.includes(device)) {
    console.log("\x1b[31m%s\x1b[0m", `That is not a valid device: ${validDevices}`);
    process.exit(1);
}

let version = recentVersion;
if (args.v) {
    version = '' + args.v;
}

for (c of version) {
    if (!validVersionDigits.includes(c)) {
        console.log("\x1b[31m%s\x1b[0m", `That is not a valid version`);
        process.exit(1);
    }
}

const url = `http://github.com/pocketbase/pocketbase/releases/download/v${version}/pocketbase_${version}_${device}.zip`;
const file = `pocketbase_${version}_${device}.zip`

const downloader = new Downloader({
    url: url,
    directory: "./",
    onProgress: function (percentage, chunk, remainingSize) {
        console.clear()
        console.log("\x1b[34m%s\x1b[0m", `%${percentage}`);
    },
});

downloader.download()
    .then(() => {
        console.clear();
        console.log("\x1b[32m%s\x1b[0m", "% 100")
        console.log("\x1b[32m%s\x1b[0m", "Download finished... extracting PocketBase");
        
        extractZip(file, { dir: path.resolve("pocketbase") })
            .then(() => {
                fs.unlinkSync(file)

                console.log("\x1b[32m%s\x1b[0m", "Completed extraction... moving 'pocketbase.exe'");

                fs.rename("./pocketbase/pocketbase.exe", "./pocketbase.exe", () => {
                    console.log("\x1b[32m%s\x1b[0m", "Done! Cleaning Up");
                });

                rimraf("./pocketbase", () => {
                    console.log("\x1b[32m%s\x1b[0m", "Done");
                });
            })
    })
    .catch(() => {
        console.log("\x1b[31m%s\x1b[0m", `An error occured when attempting to download (maybe you passed an invalid version?)`);
    });