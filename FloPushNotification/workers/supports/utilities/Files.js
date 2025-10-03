const fs = require('fs');

module.exports = {
    ReadFile: async (path) => {
        try {
            const originalData = await fs.readFileSync(path);
            return originalData.toString();
        } catch (error) {
            return false;
        }
    },
    WriteFile: async (path, content) => {
        try {
            await fs.writeFileSync(path, content);
            return true;
        } catch (error) {
            return false;
        }
    },
    WriteFileBase64: async (path, content) => {
        try {
            await fs.writeFileSync(path, content);
            return true;
        } catch (error) {
            return false;
        }
    },
    RenameFile: async (oldPath, newPath) => {
        try {
            await fs.renameSync(oldPath, newPath);
            return true;   
        } catch (error) {
            return error;
        }
    }
};
