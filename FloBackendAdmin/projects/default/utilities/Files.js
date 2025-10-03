const fs = require('fs');
const FileType = require('file-type');
const { Duplex } = require('stream');

function BufferToStream(buffer) {  
    const stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

module.exports = {
    fileType: async (path) => {
        try {
            const result = await FileType.fromFile(path);
            return result;
        } catch (error) {
            return false;
        }
    },
    readFile: async (path) => {
        try {
            const originalData = await fs.readFileSync(path);
            return originalData.toString();
        } catch (error) {
            return false;
        }
    },
    writeFile: async (path, content) => {
        try {
            await fs.writeFileSync(path, content);
            return true;
        } catch (error) {
            return false;
        }
    },
    writeStreamBuffer: async (path, buffer) => {
        try {
            return new Promise((resolve, reject) => {
                const stream = BufferToStream(buffer);
                const out = fs.createWriteStream(path);
                stream.pipe(out);
                stream.on('end', async () => {                                            
                    resolve(true);
                });
            });
        } catch (error) {            
            return false;
        }
    },
    renameFile: async (oldPath, newPath) => {
        try {
            await fs.renameSync(oldPath, newPath);
            return true;
        } catch (error) {
            return error;
        }
    }
};
