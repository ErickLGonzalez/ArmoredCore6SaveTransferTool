const fs = require('fs');
const path = require('path');
const { BND4 } = require('SoulsFormats'); // Assuming you have a SoulsFormats library for JavaScript

class SL2BND {
    constructor(sl2Location) {
        this._location = sl2Location;
        this._bnd = BND4.Read(sl2Location);
    }

    ChangeSteamId(steamId) {
        for (const file of this._bnd.Files) {
            const sl2 = new SL2Entry(file.Bytes);
            if (!sl2.ChangeSteamID(steamId)) {
                continue;
            }
            sl2.PatchChecksum();
            sl2.EncryptSL2File();
            file.Bytes = sl2.GetData();
        }
    }

    Write() {
        const backup = path.join(
            path.dirname(this._location),
            `${path.basename(this._location)}.SL2Backup`
        );
        if (!fs.existsSync(backup)) {
            fs.copyFileSync(this._location, backup);
        }
        this._bnd.Write(this._location);
    }

    static PatchSL2(filePath) {
        const sl2Bnd = new SL2BND(filePath);

        const parentDirName = path.basename(path.dirname(filePath));
        const id = Number(parentDirName);
        if (!isNaN(id)) {
            SL2ChangeSteamID(sl2Bnd, id);
            return;
        }

        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question("Please enter the new steam ID: ", (userInput) => {
            const steamId = Number(userInput);
            if (!isNaN(steamId)) {
                SL2ChangeSteamID(sl2Bnd, steamId);
            } else {
                console.log(`Invalid steam ID. Could not parse. Received "${userInput}"`);
            }
            rl.close();
        });
    }
}

function SL2ChangeSteamID(sl2Bnd, id) {
    console.log(`Changing steam ID to ${id}`);
    sl2Bnd.ChangeSteamId(id);
    sl2Bnd.Write();
}

// Example usage:
// SL2BND.PatchSL2('your_sl2_file_path');
