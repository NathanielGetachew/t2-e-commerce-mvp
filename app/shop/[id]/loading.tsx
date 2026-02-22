import { Skeleton } from "@/components/ui/skeleton"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ProductLoading() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header user={null} isAdmin={false} />

            <main className="flex-1 pt-24 pb-16 px-4 animate-in fade-in duration-500">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid gap-10 lg:grid-cols-2">
                        {/* Image Skeleton */}
                        <div className="space-y-4">
                            <Skeleton className="aspect-square w-full rounded-xl" />
                            <div className="flex gap-3 overflow-x-auto pt-2">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="w-20 h-20 rounded-md shrink-0" />
                                ))}
                            </div>
                        </div>

                        {/* Details Skeleton */}
                        <div className="space-y-6">
                            <div>
                                <Skeleton className="h-6 w-24 mb-3 rounded-full" />
                                <Skeleton className="h-10 w-3/4 mb-4" />
                                <Skeleton className="h-8 w-1/3 mb-2" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>

                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-4/6" />
                            </div>

                            <div className="py-6 border-t border-b">
                                <Skeleton className="h-12 w-full rounded-md" />
                            </div>

                            <div className="space-y-3">
                                <Skeleton className="h-6 w-32" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
