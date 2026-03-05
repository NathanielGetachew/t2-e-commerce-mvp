import { Suspense } from 'react'
import { ShopPageClient } from '@/components/shop/shop-page-client'
import { getUser } from '@/app/auth/actions'
import { getProducts } from '@/app/actions/product-actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getCategories() {
    // TODO: Wire to backend /api/categories when endpoint exists
    return [
        { id: '1', name: 'Machinery', slug: 'machinery' },
        { id: '2', name: 'Electronics', slug: 'electronics' },
        { id: '3', name: 'Energy', slug: 'energy' },
        { id: '4', name: 'Kitchen Equipment', slug: 'kitchen-equipment' }
    ]
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
    const params = await searchParams
    const user = await getUser()

    // Require authentication before accessing the shop
    if (!user) {
        const qs = new URLSearchParams()
        if (params.q) qs.set('q', params.q)
        if (params.category) qs.set('category', params.category)
        const next = qs.toString() ? `/shop?${qs.toString()}` : '/shop'
        redirect(`/auth/login?next=${encodeURIComponent(next)}`)
    }

    // Admins go to admin dashboard
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
    if (isAdmin) {
        redirect('/admin')
    }

    // Get products from backend API
    let allProducts = await getProducts()

    // Client-side filtering for search and category
    if (params.q) {
        const search = params.q.toLowerCase()
        allProducts = allProducts.filter(p =>
            p.name.toLowerCase().includes(search) ||
            (p.description && p.description.toLowerCase().includes(search))
        )
    }

    if (params.category && params.category !== 'all') {
        allProducts = allProducts.filter(p =>
            p.category?.toLowerCase() === params.category!.toLowerCase()
        )
    }

    const categories = await getCategories()

    return (
        <ShopPageClient
            user={user}
            isAdmin={isAdmin}
            products={allProducts as any}
            categories={categories as any}
            params={params}
        />
    )
}
