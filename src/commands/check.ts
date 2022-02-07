import { MERAKI_API_SERVICE_URL } from '@/lib/constants';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync } from 'fs';
import { encode as base64_encode } from 'js-base64';
import { basename } from 'path';
import UpdateManager from 'stdout-update';

let apiToken = '';

async function getApiKey() {
    const { data } = await axios.get(`${MERAKI_API_SERVICE_URL}/auth/token`);

    return data.token;
}

async function getGeneralCheckNames() {
    const token = apiToken;
    const { data } = await axios.get(`${MERAKI_API_SERVICE_URL}/checks/names`, { headers: { 'x-meraki-token': token } });

    return data.checks.map(check => check.label);
}

async function execGeneralChecks(filename, code) {
    const token = apiToken;
    const { data } = await axios.post(
        `${MERAKI_API_SERVICE_URL}/checks/general`,
        {
            filename: basename(filename),
            code: base64_encode(code),
        },
        { headers: { 'x-meraki-token': token } },
    );

    const results: any[] = [];

    for (const check of data.checks) {
        if (check.skipped) {
            results.push({
                check,
                sym: '🚫',
                line: `${chalk.gray('🚫')} ${check.label} ${check.message ?? ''} ${chalk.gray('(skipped)')}`,
            });
        }

        if (check.passed) {
            results.push({ check, sym: '✓', line: `${chalk.greenBright('✓')} ${check.label} ${check.message ?? ''}` });
        }

        if (!check.passed && !check.skipped) {
            results.push({ check, sym: '✗', line: `${chalk.redBright('✗')} ${check.label} ${check.message ?? ''}` });
        }
    }

    return results;
}

function formatMessage(str: string): string {
    const re = new RegExp('`([^`]+)`', 'g');

    return str.replaceAll(re, chalk.hex('#c2410c')('$1'));
}

async function execP5Checks(filename, code) {
    const token = apiToken;
    const { data } = await axios.post(
        `${MERAKI_API_SERVICE_URL}/checks/p5`,
        {
            filename: basename(filename),
            code: base64_encode(code),
        },
        { headers: { 'x-meraki-token': token } },
    );

    const results: any[] = [];

    Object.values(data.errors).forEach((item: any) => {
        results.push({ kind: 'p5error', line: `${chalk.redBright('‼️')} ${formatMessage(item.message ?? 'Unspecified error')}` });
    });

    Object.values(data.warnings).forEach((item: any) => {
        results.push({ kind: 'p5warn', line: `${chalk.hex('#f59e0b')('⚠️')} ${formatMessage(item.message ?? 'Unspecified warning')}` });
    });

    return results;
}

export const runScriptChecks = async filename => {
    const spinner = ora('Running checks...').start();

    const code = readFileSync(filename, { encoding: 'utf8' })
        .replaceAll('export class', 'class')
        .replaceAll('import ', '//import ')
        .replaceAll('module.exports', '// module.exports')
        .replaceAll('export default', '// export default');

    const manager = UpdateManager.getInstance();
    let ticks = 1000;
    let i = 0;
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

    manager.hook();

    apiToken = await getApiKey();

    let names = (await getGeneralCheckNames()).map(name => ({
        kind: 'general',
        name,
        check: null,
        skipped: false,
        passed: false,
        line: ' {frame} ',
    }));

    let lines: any[] = [];
    let execGeneralChecksResolved = false,
        execP5ChecksResolved = false,
        allResolved = false;

    names.push({ kind: 'p5warn', name: 'P5 Function Warning Scan', check: null, skipped: false, passed: false, line: ' {frame} ' });
    names.push({ kind: 'p5error', name: 'P5 Function Restricted Scan', check: null, skipped: false, passed: false, line: ' {frame} ' });

    const id = setInterval(() => {
        spinner.stop();
        spinner.clear();

        allResolved = execP5ChecksResolved && execGeneralChecksResolved;

        if (--ticks < 0 || allResolved) {
            clearInterval(id);
            manager.update(lines.filter(line => line.replaceAll('{frame}', '').trim() !== ''));
            manager.unhook(false);
        } else {
            const frame = frames[(i = ++i % frames.length)];

            manager.update(names.map(item => item.line.replaceAll('{frame}', frame) + `${item.name}`));
        }
    }, 110);

    execGeneralChecks(filename, code).then(results => {
        setTimeout(() => {
            for (let i = 0; i < results.length; i++) {
                const idx = names.findIndex(item => item.name === results[i].check.label);
                if (idx > -1) {
                    names[idx].line = results[i].line;
                }
            }

            execGeneralChecksResolved = true;
            lines = names.map(item => ` ${item.line}`);
        }, 600);
    });

    execP5Checks(filename, code).then(results => {
        setTimeout(() => {
            for (let i = 0; i < results.length; i++) {
                const kind = results[i].kind;
                const resultItems = results.filter(item => item.kind === kind);
                const idx = names.findIndex(item => item.kind === kind);

                names[idx] = resultItems;
                names = names.flatMap(item => item);
            }

            lines = names.flatMap(item => ` ${item.line}`);
            execP5ChecksResolved = true;
        }, 600);
    });
};
