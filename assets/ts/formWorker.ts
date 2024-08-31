import { encryptMessage } from './contact';
import { FormWorkerData } from './interfaces';

export const FORM_WORKER_TARGET = 'formWorker';
const PUBKEY_PATH = '/files/2B7340DB13C85766.asc';

onmessage = async (message) => {
    if (message.data) {
        const formMessage: FormWorkerData = message.data;

        if (formMessage.target && formMessage.target === FORM_WORKER_TARGET) {
            fetch(PUBKEY_PATH, { mode: 'same-origin' }).then((response) => {
                response.text().then(async (pubkeyArmored) => {
                    const encMessage = await encryptMessage(
                        pubkeyArmored,
                        formMessage.data,
                    );

                    postMessage(encMessage);
                });
            });
        }
    }
};
