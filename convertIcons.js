const sharp = require("sharp");
const path = require("path");

const sizes = [16, 32, 48, 128];

const input = path.join(__dirname, "icons", "icon.svg");

async function generate() {
    for (const size of sizes) {
        const output = path.join(
            __dirname,
            "icons",
            `icon${size}.png`
        );

        await sharp(input)
            .resize(size, size)
            .png()
            .toFile(output);

        console.log(`Generated ${output}`);
    }

    console.log("Done!");
}

generate().catch(console.error);