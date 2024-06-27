import { createMessage, encrypt, readKey } from 'openpgp/lightweight';

export interface FormMessage {
    name: string;
    email: string;
    message: string;
}

export const encryptMessage = async (
    pubkeyArmored: string,
    formMessage: FormMessage
): Promise<string> => {
    const publicKey = await readKey({ armoredKey: pubkeyArmored });
    const emailText = `Name: ${formMessage.name}
    Email: ${formMessage.email}
    Message:
    ${formMessage.message}`;

    const encryptedMessage = (await encrypt({
        message: await createMessage({
            text: emailText,
        }),
        encryptionKeys: publicKey,
    })) as string;

    return encryptedMessage;
};
