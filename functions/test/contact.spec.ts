import { createPagesEventContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { onRequestPost as contactOnRequestPost } from '../api/contact';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Contact form worker', () => {
    it('responds with 405 when not a POST', async () => {
        const request = new IncomingRequest('http://example.com', {
            method: 'PUT',
        });
        const ctx = createPagesEventContext({
            request: request,
            params: { path: '/api/contact' },
        });
        const response = await contactOnRequestPost(ctx);
        expect(await response.status).toEqual(405);
    });

    it('responds with 400 when no content-type set', async () => {
        const request = new IncomingRequest('http://example.com', {
            method: 'POST',
            headers: {},
        });
        const ctx = createPagesEventContext({
            request: request,
            params: { path: '/api/contact' },
        });
        const response = await contactOnRequestPost(ctx);
        expect(await response.status).toEqual(400);
    });

    it('responds with 415 when wrong content-type set', async () => {
        const request = new IncomingRequest('http://example.com', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
        });
        const ctx = createPagesEventContext({
            request: request,
            params: { path: '/api/contact' },
        });
        const response = await contactOnRequestPost(ctx);
        expect(await response.status).toEqual(415);
    });
});
