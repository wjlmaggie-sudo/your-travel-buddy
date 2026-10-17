-- Apply through the existing Lovable Cloud / Supabase project as its owner.
-- Existing trip/activity/expense rows are retained. The app works before this
-- upgrade and switches preferences to the table once it is available.
CREATE TABLE IF NOT EXISTS public.trip_preferences (
  trip_id uuid PRIMARY KEY REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  travelers smallint NOT NULL DEFAULT 2 CHECK (travelers BETWEEN 1 AND 20),
  style text NOT NULL DEFAULT 'Balanced' CHECK (style IN ('Budget','Balanced','Luxury')),
  interest text NOT NULL DEFAULT 'Food & culture',
  packing text[] NOT NULL DEFAULT '{}'
);
ALTER TABLE public.trip_preferences ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_preferences TO authenticated;
GRANT ALL ON public.trip_preferences TO service_role;
DROP POLICY IF EXISTS "own trip preferences" ON public.trip_preferences;
CREATE POLICY "own trip preferences" ON public.trip_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS trip_preferences_user_id_idx ON public.trip_preferences(user_id);
CREATE INDEX IF NOT EXISTS trips_user_start_idx ON public.trips(user_id, start_date, id);
CREATE INDEX IF NOT EXISTS activities_trip_day_position_idx ON public.activities(trip_id, day, position, id);
CREATE INDEX IF NOT EXISTS activities_user_id_idx ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS expenses_trip_spent_idx ON public.expenses(trip_id, spent_on, id);
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON public.expenses(user_id);
