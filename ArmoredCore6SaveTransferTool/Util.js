class Util {
    static PrintHelp() {
        console.log("Please drag a valid SL2BND file from Armored Core 6 onto this tool."
            + "If the SL2 file is in the folder with the new Steam ID, it will patch automatically"
            + "Otherwise you will be prompted for the new Steam Id.");
    }

    static PrintHexBytes(bytes) {
        for (const b of bytes) {
            console.log(`${b.toString(16).toUpperCase().padStart(2, '0')} `);
        }
        console.log();
    }
}

module.exports = Util; // Export the Util class for use in other modules
