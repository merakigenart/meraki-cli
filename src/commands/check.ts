import { readFileSync } from 'fs';
import axios from 'axios';
import chalk from 'chalk';
import { basename } from 'path';

export const runScriptChecks = async filename => {
    const code = readFileSync(filename, { encoding: 'utf8' })
        .replaceAll('export class', 'class')
        .replaceAll('import ', '//import ')
        .replaceAll('module.exports', '// module.exports')
        .replaceAll('export default', '// export default');

    const { data } = await axios.post('https://meraki-code-validation-service.netlify.app/api/artists/script-checks', {
        filename: basename(filename),
        code: JSON.stringify(code),
    });

    for (const check of data.checks) {
        if (check.skipped) {
            process.stdout.write(`${chalk.gray('-')} ${check.label} ${check.message ?? ''} ${chalk.gray('(skipped)')}\n`);
        }

        if (check.passed) {
            process.stdout.write(`${chalk.greenBright('✓')} ${check.label} ${check.message ?? ''}\n`);
        }

        if (!check.passed && !check.skipped) {
            process.stdout.write(`${chalk.redBright('✗')} ${check.label} ${check.message ?? ''}\n`);
        }
    }
};
