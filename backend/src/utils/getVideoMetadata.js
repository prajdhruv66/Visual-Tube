import { spawn } from "node:child_process";

export const getVideoMetadata = (
    inputPath
) => {
    return new Promise(
        (resolve, reject) => {
            const ffprobe = spawn(
                "ffprobe",
                [
                    "-v",
                    "quiet",

                    "-print_format",
                    "json",

                    "-show_format",

                    "-show_streams",

                    inputPath
                ]
            );

            let output = "";

            ffprobe.stdout.on(
                "data",
                (chunk) => {
                    output += chunk;
                }
            );

            ffprobe.on(
                "close",
                (code) => {
                    if (code !== 0) {
                        return reject(
                            new Error(
                                "FFprobe failed."
                            )
                        );
                    }

                    resolve(
                        JSON.parse(output)
                    );
                }
            );

            ffprobe.on(
                "error",
                reject
            );
        }
    );
};