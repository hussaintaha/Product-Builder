import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
    {
        subscriptionId: { type: Number, required: true, unique: true },
        internalId: { type: Number },
        orderId: { type: String },
        customerId: { type: String, required: true },

        email: { type: String, required: true },
        firstName: { type: String },
        lastName: { type: String },

        status: { type: String, enum: ["ACTIVE", "PAUSED", "CANCELLED", "EXPIRED"], required: true },
        subscriptionType: { type: Number },

        deliveryInterval: { type: String },
        billingInterval: { type: String },

        shippingAddress: {
            firstName: String,
            lastName: String,
            address1: String,
            city: String,
            province: String,
            provinceCode: String,
            zip: String,
            country: String,
            countryCode: String,
        },

        totalValue: { type: Number },
        currency: { type: String },

        items: [
            {
                productId: String,
                variantId: String,
                title: String,
                quantity: Number,
                price: Number,
                finalAmount: Number,
                sellingPlanId: String,
                sellingPlanName: String,
            },
        ],

        sealEditUrl: { type: String },
        cancellationReason: { type: String },
        cancelledOn: { type: Date },
        pausedOn: { type: Date },

        shopifyGraphqlSubscriptionContractId: { type: String },
        tags: [String],

        rawPayload: { type: Object },
    },
    { timestamps: true }
);

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema)

export default Subscription
