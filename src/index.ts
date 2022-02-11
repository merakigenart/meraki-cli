import { Command } from 'commander';
import { existsSync } from 'fs';
import updateNotifier from 'update-notifier';
import pkg from '../package.json';
import { runScriptChecks } from './commands/check';
import { submitActionHandler } from './commands/submit';
import { downloadActionHandler } from './commands/download';

updateNotifier({ pkg }).notify();

const program = new Command();

program.version(pkg.version).name('meraki-cli');

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

program.command('submit').description('Upload your scripts to Meraki').action(submitActionHandler);

program.command('download').description('Download your scripts from Meraki').action(downloadActionHandler);

program.parse(process.argv);
