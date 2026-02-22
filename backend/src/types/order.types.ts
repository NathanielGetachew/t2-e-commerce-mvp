export interface CreateOrderPayload {
    cart: {
        productId: string;
        quantity: number;
    }[];
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address: string;
        city: string;
    };
    couponCode?: string;
}
