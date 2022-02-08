import axios from 'axios';
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
