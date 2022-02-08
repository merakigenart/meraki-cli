import chalk from 'chalk';
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
            process.stdout.write(`Error: '${filenames[0].replace(process.cwd(), '.')}' not found.\n`);
            process.exit(1);
        }

        if (!existsSync(filenames[1])) {
            process.stdout.write(`Error: '${filenames[1].replace(process.cwd(), '.')}' not found.\n`);
            process.exit(1);
        }

        try {
            const config = createConf('meraki-cli');

            const { token, projectId, confirmSubmit, confirmOverwrite } = await getUserInputForSubmission(config);

            if (!confirmSubmit || !confirmOverwrite) {
                process.stdout.write(`Cancelled submission, not uploading to Meraki.\n`);
                return;
            }

            if (!`${token}`.length || !`${projectId}`.length) {
                process.stdout.write(`Please enter both a valid API Token and a valid Project ID.\n`);
                process.exit(1);
            }

            config.set('lastProjectId', projectId);
            config.set('lastToken', token);

            process.stdout.write(`\n`);

            process.stdout.write(`Uploading to Meraki...`);

            const result = await submitScriptViaApi(projectId, readFileSync(filenames[0]), readFileSync(filenames[1]), token);

            if (result.success) {
                process.stdout.write(chalk.hex('#15803d')(`done.\n`));
                process.stdout.write(`Project Dashboard: ${chalk.hex('$3b82f6')(result.url || '--')}\n`);
            } else {
                process.stdout.write(chalk.hex('#b91c1c')(`failed.\n`));
                process.stdout.write(`Error: ${chalk.hex('#c2410c')(result.message || 'Unknown error')}\n`);
            }
        } catch (error: any) {
            process.stdout.write(`Error: ${error.message}\n`);
            process.exit(1);
        }
    });

program.parse(process.argv);
