"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function renderIndex(ctx) {
    await ctx.render('index', {
        title: 'Ross Chadwick',
        csrfToken: ctx.csrf // Add a CSRF token for the contact form request
    });
}
exports.renderIndex = renderIndex;
async function handleContactForm(ctx) {
    ctx.body = 'Hello World!';
}
exports.handleContactForm = handleContactForm;
//# sourceMappingURL=index.js.map