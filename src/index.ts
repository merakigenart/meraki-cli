//const { Command } = require('commander');
import { Command } from 'commander';
import { existsSync } from 'fs';
import { runScriptChecks } from './commands/check';

const program = new Command();

program.version('1.0.0').name('meraki-cli');

program
    .command('check <filename>')
    .description('run script checks for the specified file')
    .action(filename => {
        filename = filename || `${process.cwd()}/src/Script.js`;

        if (!existsSync(filename)) {
            process.stdout.write(`File ${filename} does not exist.\n`);
            process.exit(1);
        }

        runScriptChecks(filename);
    });

program.parse(process.argv);
