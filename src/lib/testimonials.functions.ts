import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
export type Testimonial = {
  id: string;
  author_name: string;
  author_role: "runner" | "investor" | "team" | "partner";
  author_location: string | null;
  author_title: string | null;
  quote: string;
  rating: number | null;
  featured: boolean;
};

/**
 * Public, honest testimonials. Only returns published rows.
 * Featured first, then by sort_order, then newest.
 */
export const listFeaturedTestimonials = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ testimonials: Testimonial[] }> => {
    const { data, error } = await supabaseAdmin
      .from("testimonials")
      .select(
        "id, author_name, author_role, author_location, author_title, quote, rating, featured, sort_order, created_at"
      )
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(9);

    if (error) {
      console.error("listFeaturedTestimonials error", error);
      return { testimonials: [] };
    }

    return {
      testimonials: (data ?? []).map((row: any) => ({
        id: row.id,
        author_name: row.author_name,
        author_role: row.author_role,
        author_location: row.author_location,
        author_title: row.author_title,
        quote: row.quote,
        rating: row.rating,
        featured: row.featured,
      })),
    };
  }
);