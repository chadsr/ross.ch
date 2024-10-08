import { Resend } from 'resend';
import { readMessage } from 'openpgp/lightweight';

/**
 * POST /api/contact
 */
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
    const contentType = ctx.request.headers.get('content-type') as string;
    if (!contentType) {
        return new Response(null, {
            status: 400,
            statusText: 'Content-Type header missing',
        });
    }

    if (!contentType.includes('application/json')) {
        return new Response('Unsupported content-type', {
            status: 415,
        });
    }

    const contactData = (await ctx.request.json()) as RequestContact;
    if (!contactData.message) {
        return new Response(null, {
            status: 400,
            statusText: 'Message Required',
        });
    }

    const message = await readMessage({
        armoredMessage: contactData.message,
    }).catch(() => {
        console.log('Invalid OpenPGP Message', message);
        return new Response(null, {
            status: 400,
            statusText: 'Invalid OpenPGP Message',
        });
    });

    let resend: Resend | null = null;
    try {
        resend = new Resend(ctx.env.RESEND_API_KEY);
    } catch (error) {
        console.log('Resend error', error);
        throw new Error('Email provider error');
    }

    const { data, error } = await resend.emails.send({
        headers: {
            protocol: 'application/pgp-encrypted',
            contentType: 'multipart/encrypted',
            'Content-Disposition': 'inline; filename="msg.asc"',
        },
        from: ctx.env.EMAIL_SENDER_ADDRESS,
        to: ctx.env.EMAIL_RECIPIENT_ADDRESS,
        subject: 'Contact form - New Message!',
        text: contactData.message,
    });

    if (error) {
        console.log('Error sending email', error);
        throw new Error(`Error sending email`);
    }

    console.log('Email sent', data);

    const responseData: ResponseData = {
        status: 'ok',
        message: 'Your message has been sent!',
    };

    return new Response(JSON.stringify(responseData), { status: 200 });
};
