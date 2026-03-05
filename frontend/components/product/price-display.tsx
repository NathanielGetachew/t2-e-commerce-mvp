import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PriceDisplayProps {
    price: number
    originalPrice?: number
    bulkPricing?: { minQty: number; price: number }[]
}

export function PriceDisplay({ price, originalPrice, bulkPricing }: PriceDisplayProps) {
    if (!bulkPricing || bulkPricing.length === 0) {
        return (
            <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">{price.toLocaleString()}</span>
                <span className="text-lg text-muted-foreground">ETB</span>
                {originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                        {originalPrice.toLocaleString()}
                    </span>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">{price.toLocaleString()}</span>
                <span className="text-lg text-muted-foreground">ETB / Unit</span>
                {originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                        {originalPrice.toLocaleString()}
                    </span>
                )}
            </div>

            <div className="bg-muted/30 rounded-lg p-4 border">
                <h4 className="font-semibold mb-3 text-sm text-foreground/80">Bulk Pricing Available</h4>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="h-8">Quantity</TableHead>
                            <TableHead className="h-8 text-right">Unit Price</TableHead>
                            <TableHead className="h-8 text-right">Savings</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className="hover:bg-transparent border-0">
                            <TableCell className="py-1">1 - {bulkPricing[0].minQty - 1}</TableCell>
                            <TableCell className="text-right py-1">{price.toLocaleString()} ETB</TableCell>
                            <TableCell className="text-right py-1">-</TableCell>
                        </TableRow>
                        {bulkPricing.map((tier, index) => {
                            const savings = Math.round(((price - tier.price) / price) * 100)
                            const nextTier = bulkPricing[index + 1]
                            const range = nextTier ? `${tier.minQty} - ${nextTier.minQty - 1}` : `${tier.minQty}+`

                            return (
                                <TableRow key={index} className="hover:bg-transparent border-0 font-medium text-primary">
                                    <TableCell className="py-1">{range}</TableCell>
                                    <TableCell className="text-right py-1">{tier.price.toLocaleString()} ETB</TableCell>
                                    <TableCell className="text-right py-1">
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                                            {savings}% OFF
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
