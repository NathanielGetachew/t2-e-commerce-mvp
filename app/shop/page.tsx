import { Suspense } from 'react'
import { Header } from '@/components/header'
import { ProductGrid } from '@/components/product-grid'
import { getUser } from '@/app/auth/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { promises as fs } from 'fs'
import path from 'path'

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
                singlePriceCents: p.price,
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
        singlePriceCents: p.singlePriceCents,
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
    const user = await getUser()
    const params = await searchParams
    const products = await getProducts(params)
    const categories = await getCategories()

    // Admin check
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header user={user} isAdmin={isAdmin} />

            <main className="flex-1 py-24 px-4">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h1 className="text-3xl font-bold">Shop</h1>

                        <form className="relative w-full max-w-md flex gap-2">
                            <Input
                                name="q"
                                placeholder="Search products..."
                                defaultValue={params.q}
                                className="flex-1"
                            />
                            <Button type="submit" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        <Link href="/shop">
                            <Button variant={!params.category ? 'default' : 'outline'} size="sm">All</Button>
                        </Link>
                        {categories.map(cat => (
                            <Link key={cat.id} href={`/shop?category=${cat.slug}&q=${params.q || ''}`}>
                                <Button variant={params.category === cat.slug ? 'default' : 'outline'} size="sm">
                                    {cat.name}
                                </Button>
                            </Link>
                        ))}
                    </div>

                    <ProductGrid products={products} />
                </div>
            </main>
        </div>
    )
}
