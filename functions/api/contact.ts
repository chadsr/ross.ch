/**
 * POST /api/contact
 */
export async function onRequestPost({ request }) {
    try {
        const input = await request.formData()

        // Convert FormData to JSON
        // NOTE: Allows mutliple values per key
        let tmp
        const output = {}
        for (const [key, value] of input) {
            tmp = output[key]
            if (tmp === undefined) {
                output[key] = value
            } else {
                output[key] = [].concat(tmp, value)
            }
        }

        const pretty = JSON.stringify(output, null, 2)
        return new Response(pretty, {
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
            },
        })
    } catch (err) {
        return new Response('Error parsing JSON content', { status: 400 })
    }
}
