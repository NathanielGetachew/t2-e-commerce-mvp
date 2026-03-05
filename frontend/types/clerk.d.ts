export { }

declare global {
    interface CustomJwtSessionClaims {
        publicMetadata?: {
            role?: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER"
        }
    }
}
