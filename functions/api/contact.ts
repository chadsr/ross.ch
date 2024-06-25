import { Resend } from 'resend';
import { readMessage, readKey } from 'openpgp/lightweight';

/**
 * POST /api/contact
 */
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
    const contentType = ctx.request.headers.get('content-type');
    if (!contentType) {
        return new Response(null, {
            status: 400,
            statusText: 'Content-Type header missing',
        });
    }

    if (!contentType.includes('form')) {
        return new Response('Unsupported content-type', {
            status: 415,
        });
    }

    const formData = await ctx.request.formData();
    const messageString: string | null = formData.get('message');
    if (!messageString) {
        return new Response(null, {
            status: 400,
            statusText: 'Message Required',
        });
    }

    const message = await readMessage({ armoredMessage: messageString });

    // Verify the message signature
    const pubkeyString = await ctx.env.MAIN.get('PUBKEY');
    if (!pubkeyString) {
        throw new Error('Could not fetch public key');
    }
    const pubkey = await readKey({ armoredKey: pubkeyString });
    const result = await message.verify([pubkey]);
    if (!result[0].verified) {
        return new Response('Invalid message signature', {
            status: 400,
        });
    }

    const resend = new Resend(ctx.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
        from: ctx.env.EMAIL_SENDER_ADDRESS,
        to: ctx.env.EMAIL_RECIPIENT_ADDRESS,
        subject: 'Contact form - New Message!',
        text: messageString,
    });

    if (error) {
        console.log('Error sending email', error);
        throw new Error(`Error sending email`);
    }

    console.log('Email sent', data);

    return new Response('Success', { status: 200 });
};
