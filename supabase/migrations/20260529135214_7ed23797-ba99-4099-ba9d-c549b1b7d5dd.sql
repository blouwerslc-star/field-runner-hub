-- Rename rejected task status to revision_requested to match product spec
UPDATE public.tasks SET status = 'revision_requested' WHERE status = 'rejected';