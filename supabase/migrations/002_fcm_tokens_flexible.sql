-- Allow flexible user_id (text) so guest users and claimed accounts can both register FCM tokens
ALTER TABLE IF EXISTS public.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_fkey;
ALTER TABLE IF EXISTS public.fcm_tokens ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE IF EXISTS public.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_token_key;
ALTER TABLE IF EXISTS public.fcm_tokens ADD CONSTRAINT fcm_tokens_token_unique UNIQUE (token);

-- Enable public upsert for push tokens
DROP POLICY IF EXISTS "Users can manage own fcm tokens" ON public.fcm_tokens;
CREATE POLICY "Allow token registration" ON public.fcm_tokens FOR ALL USING (true) WITH CHECK (true);
