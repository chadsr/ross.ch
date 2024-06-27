// Respond to OPTIONS method
export const onRequestOptions: PagesFunction<Env> = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Max-Age': '86400',
        },
    });
};

const errorHandling: PagesFunction<Env> = async (ctx) => {
    const errorResponseData: ResponseData = {
        status: 'error',
        message: 'unknown error',
    };

    try {
        return await ctx.next();
    } catch (err: unknown) {
        if (err instanceof Error) {
            errorResponseData.message = err.message;
            return new Response(JSON.stringify(errorResponseData), {
                status: 500,
            });
        }
        return new Response(JSON.stringify(errorResponseData), {
            status: 500,
        });
    }
};

const setHeaders: PagesFunction<Env> = async (ctx) => {
    const response = await ctx.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Max-Age', '86400');
    return response;
};

// Set Error handling/CORS to all /api responses
export const onRequest = [errorHandling, setHeaders];
