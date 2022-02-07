import { readFileSync } from 'fs';
import axios from 'axios';
import chalk from 'chalk';
import { basename } from 'path';
import { MERAKI_API_SERVICE_URL } from '@/lib/constants';

async function runGeneralChecks(filename, code) {
    const { data } = await axios.post(`${MERAKI_API_SERVICE_URL}/checks/general`, {
        filename: basename(filename),
        code: JSON.stringify(code),
    });

    for (const check of data.checks) {
        if (check.skipped) {
            process.stdout.write(`${chalk.gray('🚫')} ${check.label} ${check.message ?? ''} ${chalk.gray('(skipped)')}\n`);
        }

        if (check.passed) {
            process.stdout.write(`${chalk.greenBright('✓')} ${check.label} ${check.message ?? ''}\n`);
        }

        if (!check.passed && !check.skipped) {
            process.stdout.write(`${chalk.redBright('✗')} ${check.label} ${check.message ?? ''}\n`);
        }
    }
}

async function runP5Checks(filename, code) {
    const { data } = await axios.post(`${MERAKI_API_SERVICE_URL}/checks/p5`, {
        filename: basename(filename),
        code: JSON.stringify(code),
    });

    for (const check of data.errors) {
        process.stdout.write(`${chalk.redBright('‼️')} ${check.name} ${check.message ?? ''}\n`);
    }

    for (const check of data.warnings) {
        process.stdout.write(`${chalk.hex('#f59e0b')('⚠️')} ${check.name}: ${check.message ?? ''}\n`);
    }
}

export const runScriptChecks = async filename => {
    const code = readFileSync(filename, { encoding: 'utf8' })
        .replaceAll('export class', 'class')
        .replaceAll('import ', '//import ')
        .replaceAll('module.exports', '// module.exports')
        .replaceAll('export default', '// export default');

    await runGeneralChecks(filename, code);
    await runP5Checks(filename, code);
};
