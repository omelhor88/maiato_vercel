-- Create titles table
CREATE TABLE IF NOT EXISTS public.titles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

-- Create professions table
CREATE TABLE IF NOT EXISTS public.professions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read titles and professions
CREATE POLICY "Authenticated users can view titles"
  ON public.titles FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can view professions"
  ON public.professions FOR SELECT
  USING (true);

-- Insert default titles
INSERT INTO public.titles (id, name) VALUES
  (1, 'Sr.ª'),
  (2, 'Dra.'),
  (3, 'Dr.'),
  (4, 'Eng.'),
  (5, 'Arq.'),
  (6, 'Sr.'),
  (7, 'Prof.'),
  (8, 'Enf.'),
  (9, 'Méd.'),
  (10, 'Adv.'),
  (11, 'Outro')
ON CONFLICT (id) DO NOTHING;

-- Insert common professions (you can add more later)
INSERT INTO public.professions (id, name) VALUES
  (1, 'Advogado(a)'),
  (2, 'Enfermeiro(a)'),
  (3, 'Professor(a)'),
  (4, 'Engenheiro(a)'),
  (5, 'Médico(a)'),
  (6, 'Arquiteto(a)'),
  (7, 'Empresário(a)'),
  (8, 'Funcionário(a) Público'),
  (9, 'Comerciante'),
  (10, 'Outro')
ON CONFLICT (id) DO NOTHING;