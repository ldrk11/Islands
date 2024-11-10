import fs from 'node:fs';
import path from 'node:path';

export const BOLD_RED_FOREGROUND = "\x1b[1;31m";
export const BOLD_BLUE_FOREGROUND = "\x1b[1;34m";
export const RESET_STYLE = "\x1b[0m";

/** Restrictions to be set for island names 
 * @param islandName
 * Island Name to check for restricions.
 */
export function canIslandNameBeUsed(islandName: string): boolean {
    if (islandName.length > 20 || islandName.includes("/") || islandName.includes("\\") || islandName.includes(".")){
        return false;
    }
    return true;
}

export function getIslandLocation(param1: any, param2: undefined|string = undefined): string {
    if (param2 == undefined){ 
        const islandName = param1.options.getString("island") || param1.options.getString("name");
        return `./data/users/${param1.user.id}/${islandName}.json`;
    } else {
        return `./data/users/${param1}/${param2}.json`;
    };
};

export function checkIfIslandExists(param1: any, param2: undefined|string = undefined): boolean {
    const islandName = (param2 || (param1.options.getString("island") || param1.options.getString("name")))
    if (!canIslandNameBeUsed(islandName)) { return false; };
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

export function writeFile(filename: string, data: any, parseJson: boolean=true): any {
    const lockFilename = `${filename}_lock`;
    const folderOnlyFilename = filename.substring(0, filename.lastIndexOf("/"));
    if (!fs.existsSync(folderOnlyFilename)){
        fs.mkdirSync(folderOnlyFilename, { recursive: true });
    };
    if (!fs.existsSync(lockFilename)){
        fs.writeFileSync(lockFilename, "");
        if (parseJson) {data = JSON.stringify(data);};
        fs.writeFileSync(filename, data);
        fs.unlinkSync(lockFilename);
        return true;
    };
    return false;
};
  
export function readFile(filename: string, parseJson: boolean=true): any {
    const lockFilename = `${filename}_lock`;
    if (!fs.existsSync(lockFilename)){
        fs.writeFileSync(lockFilename, "");
        let fileF = fs.readFileSync(filename).toString();
        if (parseJson){fileF = JSON.parse(fileF);};
        fs.unlinkSync(lockFilename);
        return fileF;
    };
    return null;
};

export class Island {
    data: any;
    fileLocation: any;
    constructor(){
        this.data = {};
        this.fileLocation = "";
    };
    getDataByLocation(fileLocation: string){
        const islandExists = fs.existsSync(fileLocation);
        if (islandExists){
            this.data = readFile(fileLocation, true);
            this.fileLocation = fileLocation
        }
        return islandExists;
    };
    getDataByInteraction(interaction: any){
        return this.getDataByLocation(getIslandLocation(interaction));
    };
    getDataByNameAndMemberId(name: any, memberId:any){
        return this.getDataByLocation(getIslandLocation(name, memberId));
    };
    getMemberIndex(memberName: string){
        return getMemberIndex(this.data, memberName);
    };
    save(){
        writeFile(this.fileLocation, this.data, true);
    };
    get name(): string{
        return path.basename(this.fileLocation, ".json");
    }
};

export class Log {
    log(...message:any) {
        console.log(`${BOLD_BLUE_FOREGROUND}[INFO]${RESET_STYLE}`, ...message);
    };
    error(...message:any){
        console.error(`${BOLD_RED_FOREGROUND}[ERROR]${RESET_STYLE}`, ...message);
    };
};