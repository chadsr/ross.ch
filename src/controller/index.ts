import { BaseContext, Context } from 'koa';
import { IRouterContext } from 'koa-router';

export async function renderIndex (ctx: BaseContext) {
    await ctx.render('index', {
        title: 'Ross Chadwick',
        csrfToken: ctx.csrf // Add a CSRF token for the contact form request
    });
}

export async function handleContactForm (ctx: BaseContext) {
    ctx.body = 'Hello World!';
}