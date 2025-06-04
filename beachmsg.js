#!/usr/bin/env node

import { connect } from 'net';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const COMMANDS_DIR = 'commands';
const projectRoot = new URL('.', import.meta.url).pathname;

const showAvailableCommands = () => {
  let commandsDir = path.join(projectRoot, COMMANDS_DIR).replace(/^\\/, '');
  console.log(`Commands available in ${commandsDir}:`);
  for (let commandScript of fs.readdirSync(commandsDir)) {
    console.log(`  - ${commandScript.replace(/\.js$/, '')}`);
  }
};

// if there are no arguments, bail out
if (process.argv.includes('--help') || process.argv.includes('-h') || process.argv.length < 3) {
  console.log("Usage: beachmsg <command> [<arg>...]");
  console.log();
  console.log('Send commands to beachpatrol. The provided command must exist');
  console.log('in the commands directory of beachpatrol.');
  console.log();
  showAvailableCommands();
  process.exit(1);
}

const [,, commandName, ...args] = process.argv;

// Check if command script exists
const commandFilePath = path.join(projectRoot, COMMANDS_DIR, `${commandName}.js`).replace(/^\\/, '');
if (!fs.existsSync(commandFilePath)) {
  console.error(`Error: Command script ${commandName}.js does not exist.`);
  showAvailableCommands();
  process.exit(1);
}


// Send command and args
let endpoint;
if (process.platform !== "win32") {
  const DATA_DIR = process.env.XDG_DATA_HOME || path.join(process.env.HOME, ".local/share");
  endpoint = `${DATA_DIR}/beachpatrol/beachpatrol.sock`;
} else {
  endpoint = String.raw`\\.\pipe\beachpatrol`;
}
const client = connect(endpoint, () => {
  client.write([commandName, ...args].join(' ')); 
});

client.on('data', (data) => {
  process.stdout.write(data.toString());
  client.end(); // End connection after response is received
});

client.on('error', (err) => {
  console.error(`Error: Could not connect to the beachpatrol socket. ${err.message}`);
  console.log('Have you started beachpatrol?');
  process.exit(1);
});
