CREATE TABLE public.board_save_slots (user_id uuid NOT NULL, slot integer NOT NULL CHECK (slot BETWEEN 1 AND 10), saved_at timestamptz NOT NULL DEFAULT now(), snapshot jsonb NOT NULL, PRIMARY KEY (user_id, slot));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_save_slots TO authenticated;
GRANT ALL ON public.board_save_slots TO service_role;
ALTER TABLE public.board_save_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own saves" ON public.board_save_slots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Insert own saves" ON public.board_save_slots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Overwrite own saves" ON public.board_save_slots FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own saves" ON public.board_save_slots FOR DELETE TO authenticated USING (auth.uid() = user_id);