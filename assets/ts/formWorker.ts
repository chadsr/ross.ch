import { encryptMessage, FormMessage } from './contact';

const PUBKEY_PATH = '/files/2B7340DB13C85766.asc';

addEventListener(
    'message',
    async (message) => {
        if (message.data) {
            fetch(PUBKEY_PATH, { mode: 'same-origin' }).then((response) => {
                response.text().then(async (pubkeyArmored) => {
                    const formMessage: FormMessage = message.data;
                    const encMessage = await encryptMessage(
                        pubkeyArmored,
                        formMessage
                    );

                    postMessage(encMessage);
                });
            });
        }
    },
    false
);
