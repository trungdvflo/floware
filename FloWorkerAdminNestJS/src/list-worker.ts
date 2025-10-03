import fs from 'fs';
// directory path
const dir = __dirname + '/workers/';
// list all files in the directory
const files = fs.readdirSync(dir);

// get file name from folder name
const listWorker = files.filter(item => item.endsWith('.worker') || item.endsWith('.cron'));

fs.writeFile("route-list.json", JSON.stringify(listWorker), (err) => {
  if (err) throw err;
});