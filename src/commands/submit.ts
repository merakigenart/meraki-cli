import { createConf } from '@/lib/config';
import axios from 'axios';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { encode } from 'js-base64';
const prompts = require('prompts');

export const getUserInputForSubmission = async config => {
    let lastProjectId = '';
    let lastToken = '';

    if (config.has('lastProjectId')) {
        lastProjectId = <string>config.get('lastProjectId');
    }

    if (config.has('lastToken')) {
        lastToken = <string>config.get('lastToken');
    }

    const onCancel = () => {
        process.stdout.write(`Cancelled submission.\n`);
        return false;
    };

    const response = await prompts(
        [
            {
                type: 'text',
                name: 'projectId',
                message: 'What is your Meraki Project ID?',
                initial: lastProjectId,
                validate: value => (value.length < 10 ? 'Please enter a valid project identifier' : true),
            },
            {
                type: 'password',
                name: 'token',
                message: 'What is your Meraki API Token?',
                initial: lastToken,
                validate: value => (value.length < 10 ? 'Please enter a valid API Token' : true),
            },
            {
                type: 'confirm',
                name: 'confirmOverwrite',
                message: 'This will overwrite the script stored on Meraki servers. Continue?',
                initial: false,
            },
            {
                type: 'confirm',
                name: 'confirmSubmit',
                message: 'Are you sure you want to upload your code to Meraki?',
                initial: false,
            },
        ],
        { onCancel },
    );

    return response;
};

export const submitScriptViaApi = async (projectId, mainScript, traitsScript, apiToken) => {
    const payload = {
        projectId,
        mainScript: encode(mainScript),
        traitsScript: encode(traitsScript),
    };

    const headers = { 'x-meraki-token': apiToken };

    const { data } = await axios.post('https://api.mraki.io/v1/scripts/submit', payload, { headers });

    return data;
};

export const submitActionHandler = async () => {
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
};
