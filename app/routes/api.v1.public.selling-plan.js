import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    try {
        // Check if method is GET
        if (request.method !== "GET") {
            return new Response(
                JSON.stringify({ success: false, error: "Method not allowed." }), 
                { status: 405, headers: { "Content-Type": "application/json" } }
            );
        }

        // Authenticate the request
        const { admin } = await authenticate.public.appProxy(request);

        if (!admin) {
            return new Response(
                JSON.stringify({ success: false, error: "Forbidden error" }), 
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }

        // Get product_id from URL params (since it's a GET request)
        const url = new URL(request.url);
        const product_id = url.searchParams.get("product_id");

        if (!product_id) {
            return new Response(
                JSON.stringify({ success: false, error: "Product ID is required" }), 
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // GraphQL query to get selling plans
        const query = `
            query getProductSellingPlans($productId: ID!) {
                product(id: $productId) {
                    id
                    title
                    handle
                    sellingPlanGroups(first: 5) {
                        edges {
                            node {
                                id
                                name
                                merchantCode
                                sellingPlans(first: 10) {
                                    edges {
                                        node {
                                            id
                                            name
                                            description
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        // Execute the GraphQL query
        const response = await admin.graphql(query, {
            variables: {
                productId: `gid://shopify/Product/${product_id}`
            }
        });

        const data = await response.json();

        // Check for GraphQL errors
        if (data.errors) {
            console.error("GraphQL errors:", data.errors);
            return new Response(
                JSON.stringify({ success: false, error: "Failed to fetch selling plans" }), 
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Extract selling plans from the response
        const product = data.data.product;
        
        if (!product) {
            return new Response(
                JSON.stringify({ success: false, error: "Product not found" }), 
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Format the selling plans data
        const sellingPlans = [];
        
        product.sellingPlanGroups.edges.forEach(groupEdge => {
            const group = groupEdge.node;
            group.sellingPlans.edges.forEach(planEdge => {
                const plan = planEdge.node;
                sellingPlans.push({
                    id: plan.id.replace('gid://shopify/SellingPlan/', ''), // Extract numeric ID
                    name: plan.name,
                    description: plan.description,
                    groupId: group.id.replace('gid://shopify/SellingPlanGroup/', ''),
                    groupName: group.name,
                    merchantCode: group.merchantCode
                });
            });
        });

        // Return successful response
        return new Response(
            JSON.stringify({ 
                success: true, 
                data: {
                    product: {
                        id: product.id,
                        title: product.title,
                        handle: product.handle
                    },
                    sellingPlans: sellingPlans
                }
            }), 
            { 
                status: 200, 
                headers: { "Content-Type": "application/json" } 
            }
        );

    } catch (error) {
        console.error("Error in selling plans loader:", error);
        
        return new Response(
            JSON.stringify({ success: false, error: "Internal server error." }), 
            { 
                status: 500, 
                headers: { "Content-Type": "application/json" } 
            }
        );
    }
};
