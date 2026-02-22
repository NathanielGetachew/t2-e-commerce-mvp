import { z } from 'zod';
const ambassadorApplicationSchema = z.object({
    socialLinks: z.object({
        instagram: z.string().url().optional(),
        facebook: z.string().url().optional(),
        tiktok: z.string().url().optional(),
        twitter: z.string().url().optional(),
        youtube: z.string().url().optional(),
        blog: z.string().url().optional(),
    }).optional(),
    whyJoin: z.string().min(50, 'Please provide at least 50 characters explaining why you want to join'),
    marketingStrategy: z.string().min(50, 'Please provide at least 50 characters about your marketing strategy'),
});
try {
  ambassadorApplicationSchema.parse({
    "userId":"cmlvxlm9b000212i8mjplgnry",
    "socialLinks": {
      "instagram": "https://www.instagram.com/codde_rr/"
    },
    "whyJoin": "I really love the products here and believe I can help expand the brand to a massive audience over the next few months through targeted video campaigns.",
    "marketingStrategy": "I plan on making 3 dedicated tiktok videos and 1 instagram reel per week to showcase your newest items in action. I have a lot of audience trust and excellent engagement metrics."
  });
  console.log("Validation passed");
} catch(e) {
  console.log("Validation failed:", e);
}
