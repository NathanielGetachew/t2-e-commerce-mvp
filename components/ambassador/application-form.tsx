"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { submitApplication } from "@/app/actions/affiliate-actions"

interface AmbassadorApplicationFormProps {
    userId: string
    onSuccess: () => void
}

export function AmbassadorApplicationForm({ userId, onSuccess }: AmbassadorApplicationFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [socialLinks, setSocialLinks] = useState([{ platform: "Instagram", url: "" }])
    const [whyJoin, setWhyJoin] = useState("")
    const [marketingStrategy, setMarketingStrategy] = useState("")

    const handleAddLink = () => {
        setSocialLinks([...socialLinks, { platform: "Instagram", url: "" }])
    }

    const handleRemoveLink = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index))
    }

    const handleLinkChange = (index: number, field: "platform" | "url", value: string) => {
        const newLinks = [...socialLinks]
        newLinks[index][field] = value
        setSocialLinks(newLinks)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const formData = {
                userId,
                socialLinks: socialLinks.filter(l => l.url.trim() !== ""),
                whyJoin,
                marketingStrategy
            }

            const result = await submitApplication(formData)

            if (result.success) {
                onSuccess()
            } else {
                setError(result.error || "Failed to submit application")
            }
        } catch (err) {
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl border">
            <h2 className="text-2xl font-bold">Ambassador Application</h2>
            <p className="text-muted-foreground">Join our program to earn commissions and access exclusive perks.</p>

            <div className="space-y-4">
                <label className="block text-sm font-medium">Social Media Links</label>
                {socialLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                        <select
                            className="bg-background border rounded px-3 py-2 text-sm"
                            value={link.platform}
                            onChange={(e) => handleLinkChange(index, "platform", e.target.value)}
                        >
                            <option value="Instagram">Instagram</option>
                            <option value="TikTok">TikTok</option>
                            <option value="YouTube">YouTube</option>
                            <option value="Twitter">Twitter/X</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Blog">Blog/Website</option>
                        </select>
                        <Input
                            placeholder="Profile URL"
                            value={link.url}
                            onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                            required
                        />
                        {socialLinks.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLink(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddLink} className="mt-2">
                    <Plus className="h-4 w-4 mr-2" /> Add Link
                </Button>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium">Why do you want to join?</label>
                <Textarea
                    placeholder="Tell us why you'd be a great ambassador..."
                    value={whyJoin}
                    onChange={(e) => setWhyJoin(e.target.value)}
                    required
                    className="h-24"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium">Marketing Strategy</label>
                <Textarea
                    placeholder="How do you plan to promote our products?"
                    value={marketingStrategy}
                    onChange={(e) => setMarketingStrategy(e.target.value)}
                    required
                    className="h-24"
                />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Submit Application
            </Button>
        </form>
    )
}
