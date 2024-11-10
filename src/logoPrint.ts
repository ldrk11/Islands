import { readFile, RESET_STYLE } from "./lib";
import path from "node:path";

const linesText = [
    `\x1b[1mIslands${RESET_STYLE}`,
    `Version: ${readFile(path.join(__dirname, "../package.json"), true).version}`,
    "Github: https://github.com/ldrk11/Islands",
    `Running at: ${path.join(__dirname, "../")}`,
    "",
    "",
    "",
    "",
];

// yes i did this by hand
const linesLogo = [
    `\x1b[48;5;38m             \x1b[48;5;255m   \x1b[48;5;38m    ${RESET_STYLE}`,
    `\x1b[48;5;38m    \x1b[48;5;255m   \x1b[48;5;38m    \x1b[48;5;255m       \x1b[48;5;38m  ${RESET_STYLE}`,
    `\x1b[48;5;38m  \x1b[48;5;255m       \x1b[48;5;38m           ${RESET_STYLE}`,
    `\x1b[48;5;38m                   \x1b[48;5;178m ${RESET_STYLE}`,
    `\x1b[48;5;38m    \x1b[48;5;178m      \x1b[48;5;38m        \x1b[48;5;178m  ${RESET_STYLE}`,
    `\x1b[48;5;38m  \x1b[48;5;178m          \x1b[48;5;38m     \x1b[48;5;178m   ${RESET_STYLE}`,
    `\x1b[48;5;178m                    ${RESET_STYLE}`,
    `\x1b[48;5;178m                    ${RESET_STYLE}`,
];

export function logoPrint(){
    linesLogo.forEach((item, index) => {
        console.log(item, linesText[index]);
    });
};