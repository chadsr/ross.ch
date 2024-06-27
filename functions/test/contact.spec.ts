import {
    createPagesEventContext,
    waitOnExecutionContext,
} from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import * as contactFunction from '../api/contact';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Contact form worker', () => {
    it('responds with 400 when no content-type set', async () => {
        const request = new IncomingRequest('http://example.com/api/contact', {
            method: 'POST',
            headers: {},
        });
        const ctx = createPagesEventContext<
            typeof contactFunction.onRequestPost
        >({
            request: request,
            params: { path: '/api/contact' },
        });
        const response = await contactFunction.onRequestPost(ctx);
        await waitOnExecutionContext(ctx);
        expect(await response.status).toEqual(400);
    });

    it('responds with 415 when wrong content-type set', async () => {
        const request = new IncomingRequest('http://example.com/api/contact', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
        });
        const ctx = createPagesEventContext<
            typeof contactFunction.onRequestPost
        >({
            request: request,
            params: { path: '/api/contact' },
        });
        const response = await contactFunction.onRequestPost(ctx);
        await waitOnExecutionContext(ctx);
        expect(await response.status).toEqual(415);
    });
});
