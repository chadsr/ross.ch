import { Resend } from 'resend';
import { readMessage } from 'openpgp/lightweight';

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
    const messageArmored: string | null = formData.get('message');
    if (!messageArmored) {
        return new Response(null, {
            status: 400,
            statusText: 'Message Required',
        });
    }

    const message = await readMessage({ armoredMessage: messageArmored }).catch(
        () => {
            console.log('Invalid OpenPGP Message', message);
            return new Response(null, {
                status: 400,
                statusText: 'Invalid OpenPGP Message',
            });
        }
    );

    const resend = new Resend(ctx.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
        headers: {
            protocol: 'application/pgp-encrypted',
            contentType: 'multipart/encrypted',
            'Content-Disposition': 'inline; filename="msg.asc"',
        },
        from: ctx.env.EMAIL_SENDER_ADDRESS,
        to: ctx.env.EMAIL_RECIPIENT_ADDRESS,
        subject: 'Contact form - New Message!',
        text: '',
        attachments: [
            {
                filename: 'msg.asc',
                content: messageArmored,
            },
        ],
    });

    if (error) {
        console.log('Error sending email', error);
        throw new Error(`Error sending email`);
    }

    console.log('Email sent', data);

    return new Response('Success', { status: 200 });
};
