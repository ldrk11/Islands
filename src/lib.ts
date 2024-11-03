import fs from 'node:fs';

export function getIslandLocation(param1: any, param2: undefined|string = undefined): string {
    if (param2 == undefined){ 
        var islandName = param1.options.getString("island");
        return `./data/users/${param1.user.id}/${islandName}.json`;
    } else {
        return `./data/users/${param1}/${param2}.json`;
    };
};

export function checkIfIslandExists(param1: any, param2: undefined|string = undefined): boolean {
    var islandJsonLocation = getIslandLocation(param1, param2);
    if (fs.existsSync(islandJsonLocation)){
        return true;
    };
    return false;
};