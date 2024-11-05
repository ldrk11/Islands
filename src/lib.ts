import fs from 'node:fs';

export const BOLD_RED_FOREGROUND = "\x1b[1;31m";
export const BOLD_BLUE_FOREGROUND = "\x1b[1;34m";
export const RESET_STYLE = "\x1b[0m";

export function getIslandLocation(param1: any, param2: undefined|string = undefined): string {
    if (param2 == undefined){ 
        const islandName = param1.options.getString("island") || param1.options.getString("name");
        return `./data/users/${param1.user.id}/${islandName}.json`;
    } else {
        return `./data/users/${param1}/${param2}.json`;
    };
};

export function checkIfIslandExists(param1: any, param2: undefined|string = undefined): boolean {
    const islandJsonLocation = getIslandLocation(param1, param2);
    if (fs.existsSync(islandJsonLocation)){
        return true;
    };
    return false;
};

export function getMemberIndex(islandData: any, memberName: string): undefined|number {
    let memberIndex: undefined|number = undefined;
    (islandData.members || []).forEach((member: any, index: number) => {
        if (member.name == memberName && memberIndex == undefined){
            memberIndex = index;
        };
    });
    return memberIndex
}

export class Log {
    log(...message:any) {
        console.log(`${BOLD_BLUE_FOREGROUND}[INFO]${RESET_STYLE}`, ...message);
    };
    error(...message:any){
        console.error(`${BOLD_RED_FOREGROUND}[ERROR]${RESET_STYLE}`, ...message);
    };
};