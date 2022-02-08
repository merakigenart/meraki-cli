import { Command } from 'commander';
import { existsSync, readFileSync } from 'fs';
import updateNotifier from 'update-notifier';
import pkg from '../package.json';
import { runScriptChecks } from './commands/check';
import { getUserInputForSubmission, submitScriptViaApi } from './commands/submit';
import { createConf } from './lib/config';

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

program
    .command('submit')
    .description('submit your scripts to meraki')
    .action(async () => {
        const filenames = [`${process.cwd()}/src/Script.js`, `${process.cwd()}/src/ScriptTraits.js`];

        if (!existsSync(filenames[0])) {
            process.stdout.write(`File ${filenames[0]} does not exist.\n`);
            process.exit(1);
        }

        try {
            const config = createConf('meraki-cli');

            const { token, projectId } = await getUserInputForSubmission(config);

            if (!`${token}`.length || !`${projectId}`.length) {
                process.stdout.write(`Please enter both a valid API Token and a valid Project ID.\n`);
                process.exit(1);
            }

            config.set('lastProjectId', projectId);
            config.set('lastToken', token);

            const result = await submitScriptViaApi(projectId, readFileSync(filenames[0]), readFileSync(filenames[1]), token);

            if (result.success) {
                process.stdout.write(`Successfully submitted script to Meraki.\n`);
            } else {
                process.stdout.write(`Error submitting script to Meraki.\n`);
            }
        } catch (error: any) {
            process.stdout.write(`Error: ${error.message}\n`);
            process.exit(1);
        }
    });

program.parse(process.argv);
