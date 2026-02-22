import { Skeleton } from "@/components/ui/skeleton"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ShopLoading() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header user={null} isAdmin={false} />

            <main className="flex-1 py-24 px-4 animate-in fade-in duration-500">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-full max-w-md rounded-md" />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-9 w-24 rounded-md" />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex flex-col space-y-3">
                                <Skeleton className="h-[250px] w-full rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[200px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
