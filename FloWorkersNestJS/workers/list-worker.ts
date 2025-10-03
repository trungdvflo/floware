import fs from 'fs';
// directory path
const dir = __dirname + '/';
// list all files in the directory
const files = fs.readdirSync(dir);
const listWorker = [];

// files object contains all files names
files.filter((item) => item.startsWith('worker-')).forEach((item) => listWorker.push(item));
fs.writeFile('route-list.json', JSON.stringify(listWorker), (err) => {
  if (err) throw err;
  // tslint:disable-next-line: no-console
  console.log(listWorker);
});
