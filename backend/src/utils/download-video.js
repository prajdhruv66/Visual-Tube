import axios from "axios";
import fs from "fs";
import path from "path";

const downloadVideo = async (
    videoUrl,
    outputPath
) => {
    try {
        // Ensure parent directories exist.
        await fs.promises.mkdir(
            path.dirname(outputPath),
            {
                recursive: true,
            }
        );

        // Request video as a stream.
        const response = await axios({
            method: "GET",
            url: videoUrl,
            responseType: "stream",
        });

        const writer =
            fs.createWriteStream(outputPath);

        // Pipe the response stream into the file.
        response.data.pipe(writer);

        // Wait until writing completes.
        return new Promise((resolve, reject) => {
            writer.on("finish", () => {
                console.log(
                    `Downloaded video to ${outputPath}`
                );

                resolve(outputPath);
            });

            writer.on("error", (error) => {
                reject(error);
            });
        });
    } catch (error) {
        throw new Error(
            `Failed to download video: ${error.message}`
        );
    }
};

export {downloadVideo}