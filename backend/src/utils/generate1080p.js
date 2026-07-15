import { spawn } from "node:child_process";

export const generate1080p = (
    inputPath,
    outputPath
) => {
    return new Promise(
        (resolve, reject) => {
            const ffmpeg = spawn(
                "ffmpeg",
                [
                    "-y",
                    "-i",
                    inputPath,
                    "-threads",
                    "1",

                    "-c:v",
                    "libx264",

                    "-crf",
                    "23",

                    "-preset",
                    "medium",

                    "-vf",
                    "scale=-2:1080",

                    outputPath
                ]
            );

            ffmpeg.stderr.on(
                "data",
                (chunk) => {
                    console.log(
                        chunk.toString()
                    );
                }
            );

            ffmpeg.on(
                "close",
                (code) => {
                    if (code !== 0) {
                        return reject(
                            new Error(
                                "1080p generation failed."
                            )
                        );
                    }

                    resolve();
                }
            );

            ffmpeg.on(
                "error",
                reject
            );
        }
    );
};
