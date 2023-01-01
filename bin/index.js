#! /usr/bin/env node

const args = require("yargs").argv;
const Downloader = require("nodejs-file-downloader");
const fs = require("fs");
const extractZip = require("extract-zip");
const path = require("path");
const rimraf = require("rimraf");
const https = require('follow-redirects').https;

const request = https.request({
    host: "github.com",
    path: "/pocketbase/pocketbase/releases/latest",
}, (res) => {
    const recentVersion = res.responseUrl.split("/").slice(-1)[0].slice(1);
    const downloadFolder = "temp/";

    const blue = "\x1b[34m%s\x1b[0m";
    const green = "\x1b[32m%s\x1b[0m";
    const red = "\x1b[31m%s\x1b[0m";

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
    } else {
        let device = "windows_amd64"
        if (args.d) {
            device = args.d;
        }

        if (!validDevices.includes(device)) {
            console.log(red, `That is not a valid device: ${validDevices}`);
            process.exit(1);
        }

        let version = recentVersion;
        if (args.v) {
            version = '' + args.v;
        }

        for (c of version) {
            if (!validVersionDigits.includes(c)) {
                console.log(red, `That is not a valid version`);
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
                console.log(blue, `%${percentage}`);
            },
        });

        downloader.download()
            .then(() => {
                console.clear();
                console.log(green, "%100")
                console.log(green, "Download finished... extracting PocketBase");
                
                extractZip(file, { dir: path.resolve(downloadFolder) })
                    .then(() => {
                        try {
                            fs.unlinkSync(file);
                            console.log(green, "Completed extraction... moving 'pocketbase' into your working directory");
                        } catch (error) {
                            console.log(red, "An error occured when deleting the ZIP file, continuing...");
                            console.log(green, "Moving 'pocketbase' into your working directory");
                        }

                        try {
                            if (fs.existsSync(`./${downloadFolder}/pocketbase.exe`)) {
                                fs.renameSync(`./${downloadFolder}/pocketbase.exe`, "./pocketbase.exe");
                            } else if (fs.existsSync(`./${downloadFolder}/pocketbase`)) {
                                fs.renameSync(`./${downloadFolder}/pocketbase`, "./pocketbase");
                            }

                            console.log(green, "Done! Cleaning Up");

                            rimraf("./temp", () => {
                                console.log(green, "Done");
                            });
                        } catch (error) {
                            console.log(red, "Failed to move 'pocketbase' into your working directory");
                        }
                    })
            })
            .catch(() => {
                console.log(red, `An error occured when attempting to download (maybe you passed an invalid version?)`);
            });
    }
});
request.end();