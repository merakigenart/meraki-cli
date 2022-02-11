import { createConf } from '@/lib/config';
import axios from 'axios';
import chalk from 'chalk';
import { createWriteStream } from 'fs';
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
                name: 'confirmDownload',
                message: 'Are you sure you want to download your project code from Meraki?',
                initial: false,
            },
        ],
        { onCancel },
    );

    return response;
};

async function downloadArchive(projectId: string, token: string) {
    const url = `https://api.mraki.io/v1/scripts/download/${projectId}`;
    const path = `${process.cwd()}/${projectId}.zip`;
    const writer = createWriteStream(path);

    let response;

    try {
        response = await axios.get(url, { headers: { 'x-meraki-token': token }, responseType: 'stream' });
    } catch (error) {
        console.log(error);
    }

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

export const downloadActionHandler = async () => {
    try {
        const config = createConf('meraki-cli');

        const { token, projectId, confirmDownload } = await getUserInputForSubmission(config);

        if (!confirmDownload) {
            process.stdout.write(`Cancelled, not downloading from Meraki.\n`);
            return;
        }

        if (!`${token}`.length || !`${projectId}`.length) {
            process.stdout.write(`Please enter both a valid API Token and a valid Project ID.\n`);
            process.exit(1);
        }

        config.set('lastProjectId', projectId);
        config.set('lastToken', token);

        process.stdout.write(`\n`);

        process.stdout.write(`Downloading from Meraki...`);

        try {
            await downloadArchive(projectId, token);
            process.stdout.write(chalk.hex('#15803d')(`done.\n`));
            process.stdout.write(`Download success: ${chalk.hex('$3b82f6')(`${projectId}.zip` || '--')}\n`);
        } catch (err: any) {
            process.stdout.write(chalk.hex('#b91c1c')(`failed.\n`));
            process.stdout.write(`Error: ${chalk.hex('#c2410c')('Download failed')}\n`);
        }
    } catch (error: any) {
        process.stdout.write(`Error: ${error.message}\n`);
        process.exit(1);
    }
};
