import { Command } from 'commander';
import { existsSync } from 'fs';
import updateNotifier from 'update-notifier';
import { runScriptChecks } from './commands/check';
import pkg from '../package.json';

updateNotifier({ pkg }).notify();

const program = new Command();

program.version('1.1.0').name('meraki-cli');

program
    .command('update-check')
    .description('check for updates to meraki-cli')
    .action(() => {
        const notifier = updateNotifier({ pkg });

        if (notifier.update) {
            process.stdout.write(`Update available: ${notifier.update.latest}`);
        } else {
            process.stdout.write('No update available.');
        }
    });

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
