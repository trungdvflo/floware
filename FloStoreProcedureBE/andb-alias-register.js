const fs = require('fs');
const path = require('path');

const scriptPath = path.resolve(__filename);

function registerAlias(alias) {
  console.log(process.env.SHELL);
  const shellConfigPath = process.env.SHELL.includes('zsh') ? '~/.zshrc' : '~/.bashrc';
  const aliasCommand = `alias ${alias}='${scriptPath}'`;

  fs.appendFileSync(shellConfigPath, `\n${aliasCommand}\n`);

  console.log(`Alias '${alias}' registered. Restart your shell or run 'source ${shellConfigPath}' to apply the changes.`);
}

registerAlias('andb');
