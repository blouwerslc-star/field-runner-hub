import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createReview } from "@/lib/reviews.functions";

export function ReviewComposer({
  taskId,
  revieweeId,
  direction,
  onDone,
}: {
  taskId: string;
  revieweeId: string;
  direction: "investor_to_runner" | "runner_to_investor";
  onDone?: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const fn = useServerFn(createReview);
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: () => fn({ data: { taskId, revieweeId, direction, rating, comment: comment || null } }),
    onSuccess: () => {
      toast.success("Review submitted");
      qc.invalidateQueries({ queryKey: ["reviewable-tasks"] });
      qc.invalidateQueries({ queryKey: ["publicProfile"] });
      qc.invalidateQueries({ queryKey: ["reviews", revieweeId] });
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div>
        <Label>Rating</Label>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${i} star${i === 1 ? "" : "s"}`}
              className="p-1"
            >
              <Star
                className={`size-6 transition-colors ${
                  i <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="review-comment">Comment (optional)</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share what worked, what didn't, and anything other users should know…"
        />
      </div>
      <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
        {submit.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
        Submit review
      </Button>
    </div>
  );
}