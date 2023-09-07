const { SL2BND, Util } = require('./ArmoredCore6SaveTransferTool'); // Replace './ArmoredCore6SaveTransferTool' with the actual path to your modules
const { BND4 } = require('SoulsFormats'); // SoulsFormats library
const args = process.argv.slice(2);

if (args.length < 1 || !BND4.Is(args[0])) {
    Util.PrintHelp();
} else {
    SL2BND.PatchSL2(args[0]);
}
