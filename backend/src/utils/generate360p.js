import { spawn } from "node:child_process";

export const generate360p = (
    inputPath,
    outputPath
) => {
    return new Promise(
        (resolve, reject) => {
            const ffmpeg = spawn(
                "ffmpeg",
                [
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
                    "scale=-2:360",

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
                                "360p generation failed."
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
