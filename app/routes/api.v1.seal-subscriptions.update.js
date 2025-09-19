export const action = async ({ request }) => {
    try {

        const data = await request.json()
        console.log('data: ', data);

        return new Response(JSON.stringify({ success: true, message: "DONE" }), { status: 200 })

    } catch (error) {
        if (error instanceof Error) {
            console.log(`Error while registering the webhook: ${error.message}`);
        } else {
            console.log(`An unknown error occurred.`);
        }

        return new Response(JSON.stringify({ success: false, error: "Internal server error." }), { status: 500 })
    }
}