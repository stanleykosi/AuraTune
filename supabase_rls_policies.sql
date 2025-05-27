ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual user read access on users"
ON public.users
FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY "Allow individual user update access on users"
ON public.users
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual user read access to their settings"
ON public.user_settings
FOR SELECT
TO authenticated
USING ("userId" = (SELECT auth.uid()));

CREATE POLICY "Allow individual user to create their settings"
ON public.user_settings
FOR INSERT
TO authenticated
WITH CHECK ("userId" = (SELECT auth.uid()));

CREATE POLICY "Allow individual user to update their settings"
ON public.user_settings
FOR UPDATE
TO authenticated
USING ("userId" = (SELECT auth.uid()))
WITH CHECK ("userId" = (SELECT auth.uid()));

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual user read access to their playlists"
ON public.playlists
FOR SELECT
TO authenticated
USING ("userId" = (SELECT auth.uid()));

CREATE POLICY "Allow individual user to create playlists"
ON public.playlists
FOR INSERT
TO authenticated
WITH CHECK ("userId" = (SELECT auth.uid()));

CREATE POLICY "Allow individual user to update their playlists"
ON public.playlists
FOR UPDATE
TO authenticated
USING ("userId" = (SELECT auth.uid()))
WITH CHECK ("userId" = (SELECT auth.uid()));

ALTER TABLE public.curated_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read active templates"
ON public.curated_templates
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated' AND is_active = true);