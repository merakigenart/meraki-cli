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
                default: lastProjectId,
                validate: value => (value.length < 10 ? 'Please enter a valid project identifier' : true),
            },
            {
                type: 'text',
                name: 'token',
                message: 'What is your Meraki API Token?',
                default: lastToken,
                validate: value => (value.length < 10 ? 'Please enter a valid API Token' : true),
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
