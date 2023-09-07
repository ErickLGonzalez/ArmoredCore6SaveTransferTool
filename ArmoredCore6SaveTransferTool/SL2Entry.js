const crypto = require('crypto');

class SL2Entry {
    constructor(data) {
        this._sl2Key = [
            0xB1, 0x56, 0x87, 0x9F, 0x13, 0x48, 0x97, 0x98,
            0x70, 0x05, 0xC4, 0x87, 0x00, 0xAE, 0xF8, 0x79
        ];
        this._ivSize = 0x10;
        this._paddingSize = 0xC;
        this._sectionStringSize = 0x10;
        this._sectionHeaderSize = 0x20;
        this._startOfChecksumData = 4;
        this._endOfChecksumData = this._paddingSize + crypto.createHash('md5').digest().length;
        this._data = data;
        this._iv = new Uint8Array(this._ivSize);
        this._decryptedData = null;

        this.decryptSL2File();
    }

    decryptSL2File() {
        const aes = crypto.createDecipheriv('aes-128-cbc', Buffer.from(this._sl2Key), this._iv);
        aes.setAutoPadding(false);

        const ivBuffer = Buffer.alloc(this._ivSize);
        this._data.copy(ivBuffer, 0, 0, this._ivSize);
        aes.setIV(ivBuffer);

        const encryptedData = this._data.slice(this._ivSize);
        this._decryptedData = aes.update(encryptedData);
        this._decryptedData = Buffer.concat([this._decryptedData, aes.final()]);
    }

    encryptSL2File() {
        const aes = crypto.createCipheriv('aes-128-cbc', Buffer.from(this._sl2Key), this._iv);
        aes.setAutoPadding(false);

        const ivBuffer = Buffer.from(this._iv);
        const encryptedData = aes.update(this._decryptedData);
        const checksum = this.getChecksum();

        const encryptedDataWithChecksum = Buffer.concat([ivBuffer, encryptedData, checksum]);
        this._data = encryptedDataWithChecksum;
    }

    patchData(newData, offset) {
        for (let i = 0; i < newData.length; i++) {
            this._decryptedData[offset + i] = newData[i];
        }
    }

    getData() {
        return this._data;
    }

    getDecryptedData() {
        return this._decryptedData;
    }

    patchChecksum() {
        const checksum = this.getChecksum();
        const checksumEnd = this._decryptedData.length - this._endOfChecksumData;
        checksum.copy(this._decryptedData, checksumEnd);
    }

    getChecksum() {
        const checksumStart = this._startOfChecksumData;
        const checksumEnd = this._decryptedData.length - this._endOfChecksumData;
        const checksumData = this._decryptedData.slice(checksumStart, checksumEnd);
        const md5 = crypto.createHash('md5');
        md5.update(checksumData);
        return md5.digest();
    }

    changeSteamID(steamId) {
        const steamIdBuffer = Buffer.from(steamId);

        const sections = this.scanForSection("Steam");
        if (sections.length < 1) {
            return false;
        }

        sections.forEach(section => {
            this.patchData(steamIdBuffer, section.Offset + this._sectionHeaderSize);
        });

        return true;
    }

    scanForSection(str) {
        const sections = [];

        for (let i = 0; i < this._decryptedData.length; i++) {
            const sectionEnd = i + this._sectionStringSize;
            if (sectionEnd >= this._decryptedData.length) {
                break;
            }
            const section = this._decryptedData.slice(i, sectionEnd);
            if (!Buffer.isBuffer(section) || section[0] < 32) {
                continue;
            }

            const sectionStr = this.getSectionString(section);
            if (!sectionStr.includes(str)) {
                continue;
            }

            const sizeOffset = i + 16;
            const sizeEnd = sizeOffset + 4;
            const dataSize = this._decryptedData.readInt32LE(sizeOffset);

            if (dataSize !== 8) {
                continue;
            }

            sections.push(new SL2Section(sectionStr, i, dataSize));
            i += this._sectionHeaderSize + dataSize;
        }

        return sections;
    }

    getSectionString(section) {
        const nullTerminator = section.indexOf(0);
        if (nullTerminator === -1) {
            return section.toString('utf8');
        }
        return section.slice(0, nullTerminator).toString('utf8');
    }
}

class SL2Section {
    constructor(name, offset, dataSize) {
        this.Name = name;
        this.Offset = offset;
        this.DataSize = dataSize;
    }
}

module.exports = {
    SL2Entry,
};
