import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Shield, EyeOff, Clock } from "lucide-react";

export function TrackingConsentSheet({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share your location for this task</DialogTitle>
          <DialogDescription>
            REI Runner needs your live location to verify you're at the property and
            keep the investor updated.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 text-sm text-foreground">
          <li className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Tracked <strong>only while this task is active</strong> — never before or after.</span>
          </li>
          <li className="flex gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>One location update every ~20 seconds. Stops automatically when you mark the task complete.</span>
          </li>
          <li className="flex gap-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Visible to the assigned investor and REI Runner admins only.</span>
          </li>
          <li className="flex gap-3">
            <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>You can stop tracking from this screen at any time.</span>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Keep this screen open while you're on the way — mobile browsers pause
          location updates when the tab is fully closed.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Allow & start</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}