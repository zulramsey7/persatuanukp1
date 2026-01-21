-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('pengerusi', 'bendahari', 'ajk', 'ahli');

-- Create enum for member status
CREATE TYPE public.status_ahli AS ENUM ('pending', 'active', 'inactive');

-- Create enum for expense categories
CREATE TYPE public.kategori_belanja AS ENUM ('penyelenggaraan', 'aktiviti', 'kebajikan', 'lain-lain');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nama_penuh TEXT NOT NULL,
  no_rumah TEXT NOT NULL,
  no_telefon TEXT,
  status_ahli status_ahli DEFAULT 'pending'::status_ahli NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'ahli'::app_role,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Yuran Masuk (One-time registration fee)
CREATE TABLE public.yuran_masuk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  jumlah DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  tarikh_bayar TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  rujukan_bayaran TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Yuran Bulanan (Monthly dues tracking)
CREATE TABLE public.yuran_bulanan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tahun INTEGER NOT NULL,
  bulan INTEGER NOT NULL CHECK (bulan >= 1 AND bulan <= 12),
  jumlah DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  tarikh_bayar TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'belum_bayar' NOT NULL,
  rujukan_bayaran TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, tahun, bulan)
);

-- Yuran Keluar / Expenses
CREATE TABLE public.yuran_keluar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tajuk_belanja TEXT NOT NULL,
  jumlah DECIMAL(10,2) NOT NULL,
  kategori kategori_belanja NOT NULL,
  deskripsi TEXT,
  tarikh DATE NOT NULL DEFAULT CURRENT_DATE,
  bukti_resit_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Galeri Aktiviti
CREATE TABLE public.galeri_aktiviti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tajuk TEXT NOT NULL,
  deskripsi TEXT,
  image_url TEXT NOT NULL,
  tarikh_event DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Polls / E-Undian
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tajuk TEXT NOT NULL,
  deskripsi TEXT,
  pilihan JSONB NOT NULL DEFAULT '[]'::jsonb,
  tarikh_mula TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  tarikh_tamat TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'aktif' NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Poll Votes
CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pilihan_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (poll_id, user_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tajuk TEXT NOT NULL,
  mesej TEXT NOT NULL,
  jenis TEXT DEFAULT 'info' NOT NULL,
  dibaca BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yuran_masuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yuran_bulanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yuran_keluar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeri_aktiviti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin (pengerusi, bendahari, or ajk)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('pengerusi', 'bendahari', 'ajk')
  )
$$;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- User Roles RLS Policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Pengerusi can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'pengerusi'));

-- Yuran Masuk RLS Policies
CREATE POLICY "Users can view their own yuran masuk"
  ON public.yuran_masuk FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all yuran masuk"
  ON public.yuran_masuk FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own yuran masuk"
  ON public.yuran_masuk FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Bendahari can manage yuran masuk"
  ON public.yuran_masuk FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'bendahari'));

-- Yuran Bulanan RLS Policies
CREATE POLICY "Users can view their own yuran bulanan"
  ON public.yuran_bulanan FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all yuran bulanan"
  ON public.yuran_bulanan FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own yuran bulanan"
  ON public.yuran_bulanan FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Bendahari can manage yuran bulanan"
  ON public.yuran_bulanan FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'bendahari'));

-- Yuran Keluar RLS Policies (Public read for transparency)
CREATE POLICY "Everyone can view yuran keluar"
  ON public.yuran_keluar FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Bendahari can manage yuran keluar"
  ON public.yuran_keluar FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'bendahari'));

-- Galeri Aktiviti RLS Policies (Public read)
CREATE POLICY "Everyone can view galeri"
  ON public.galeri_aktiviti FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage galeri"
  ON public.galeri_aktiviti FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Polls RLS Policies
CREATE POLICY "Active members can view polls"
  ON public.polls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage polls"
  ON public.polls FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Poll Votes RLS Policies
CREATE POLICY "Users can view their own votes"
  ON public.poll_votes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own vote"
  ON public.poll_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all votes"
  ON public.poll_votes FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Notifications RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nama_penuh, no_rumah, no_telefon)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nama_penuh', 'Pengguna Baru'),
    COALESCE(NEW.raw_user_meta_data ->> 'no_rumah', ''),
    NEW.raw_user_meta_data ->> 'no_telefon'
  );
  
  -- Assign default 'ahli' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'ahli');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();