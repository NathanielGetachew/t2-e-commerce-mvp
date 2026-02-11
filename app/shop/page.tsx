import { Suspense } from 'react'
import { ShopPageClient } from '@/components/shop/shop-page-client'
import { getUser } from '@/app/auth/actions'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { promises as fs } from 'fs'
import path from 'path'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getProducts(searchParams: { q?: string; category?: string }) {
    if (!isDatabaseAvailable) {
        try {
            const mockDbPath = path.join(process.cwd(), 'app/lib/mock-db/products.json')
            const data = await fs.readFile(mockDbPath, 'utf-8')
            let products = JSON.parse(data)

            const { q, category } = searchParams
            if (q) {
                const search = q.toLowerCase()
                products = products.filter((p: any) =>
                    p.name.toLowerCase().includes(search) ||
                    p.description.toLowerCase().includes(search)
                )
            }

            if (category && category !== 'all') {
                products = products.filter((p: any) =>
                    p.category.toLowerCase() === category.toLowerCase()
                )
            }

            return products.map((p: any) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                images: [p.image],
                category: p.category
            }))
        } catch (e) {
            console.error("Failed to load mock products", e)
            return []
        }
    }

    const { q, category } = searchParams
    const where: any = { isActive: true }

    if (q) {
        where.OR = [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
        ]
    }

    if (category && category !== 'all') {
        where.category = {
            slug: category
        }
    }

    const products = await prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { category: true }
    })

    return products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.singlePriceCents,
        images: p.images as string[],
        category: p.category?.name || 'Uncategorized'
    }))
}

async function getCategories() {
    if (!isDatabaseAvailable) {
        return [
            { id: '1', name: 'Machinery', slug: 'machinery' },
            { id: '2', name: 'Electronics', slug: 'electronics' },
            { id: '3', name: 'Energy', slug: 'energy' },
            { id: '4', name: 'Kitchen Equipment', slug: 'kitchen-equipment' }
        ]
    }
    return prisma.category.findMany()
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
    const params = await searchParams
    const user = await getUser()

    // Require authentication before accessing the shop (preserve search/category in next)
    if (!user) {
        const qs = new URLSearchParams()
        if (params.q) qs.set('q', params.q)
        if (params.category) qs.set('category', params.category)
        const next = qs.toString() ? `/shop?${qs.toString()}` : '/shop'
        redirect(`/auth/login?next=${encodeURIComponent(next)}`)
    }

    // Admins are back-office only; redirect them to the admin dashboard
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
    if (isAdmin) {
        redirect('/admin')
    }

    const products = await getProducts(params)
    const categories = await getCategories()

    return (
        <ShopPageClient
            user={user}
            isAdmin={isAdmin}
            products={products as any}
            categories={categories as any}
            params={params}
        />
    )
}

