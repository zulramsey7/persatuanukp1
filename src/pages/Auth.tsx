import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Mail, Lock, User as UserIcon, Phone, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { sanitizeInput, sanitizeEmail, sanitizePhoneNumber, isValidMalaysianPhone, isValidHouseNumber } from "@/lib/sanitize";
import { VALIDATION_RULES } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().email("Email tidak sah"),
  password: z.string().min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Kata laluan minimum ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} aksara`),
});

const registerSchema = z.object({
  email: z.string().email("Email tidak sah"),
  password: z.string().min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Kata laluan minimum ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} aksara`),
  nama_penuh: z.string().min(VALIDATION_RULES.NAME_MIN_LENGTH, "Nama penuh diperlukan"),
  no_rumah: z.string().min(1, "No. rumah diperlukan"),
  no_telefon: z.string().refine(
    (val) => isValidMalaysianPhone(val),
    "No. telefon Malaysia tidak sah"
  ),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak sah"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Kata laluan minimum ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} aksara`),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const [view, setView] = useState<'login' | 'register' | 'forgot_password' | 'reset_password'>(
    mode === "register" ? "register" : mode === "reset" ? "reset_password" : "login"
  );
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nama_penuh: "",
    no_rumah: "",
    no_telefon: "",
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && session && view !== "reset_password") {
      navigate("/dashboard");
    }
  }, [user, session, navigate, view]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Sanitize based on field type
    let sanitizedValue = value;
    if (name === "email") {
      sanitizedValue = sanitizeEmail(value);
    } else if (name === "no_telefon") {
      sanitizedValue = sanitizePhoneNumber(value);
    } else if (name === "nama_penuh" || name === "no_rumah") {
      sanitizedValue = sanitizeInput(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validated = loginSchema.parse({
        email: formData.email,
        password: formData.password,
      });

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        handleError(error, {
          source: 'auth_login',
          userFacingMessage: error.message.includes("Invalid login credentials") 
            ? "Email atau kata laluan tidak tepat" 
            : error.message,
        });
      } else {
        toast({
          title: "Berjaya!",
          description: "Selamat datang kembali!",
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        handleError(err, {
          source: 'auth_login',
          userFacingMessage: 'Ralat tidak diketahui semasa log masuk',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validated = registerSchema.parse(formData);
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nama_penuh: validated.nama_penuh,
            no_rumah: validated.no_rumah,
            no_telefon: validated.no_telefon,
          },
        },
      });

      if (error) {
        handleError(error, {
          source: 'auth_register',
          userFacingMessage: error.message.includes("already registered")
            ? "Email ini sudah didaftarkan. Sila log masuk."
            : error.message,
        });
      } else {
        toast({
          title: "Pendaftaran Berjaya!",
          description: "Akaun anda sedang menunggu pengesahan oleh AJK. Anda akan dihubungi selepas disahkan.",
        });
        // Switch to login mode
        setView("login");
        setFormData({
          email: "",
          password: "",
          nama_penuh: "",
          no_rumah: "",
          no_telefon: "",
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        handleError(err, {
          source: 'auth_register',
          userFacingMessage: 'Ralat tidak diketahui semasa pendaftaran',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validated = forgotPasswordSchema.parse({ email: formData.email });
      const redirectUrl = `${window.location.origin}/auth?mode=reset`;

      const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        handleError(error, {
          source: 'auth_forgot_password',
          userFacingMessage: error.message,
        });
      } else {
        toast({
          title: "Email Dihantar",
          description: "Sila semak email anda untuk pautan set semula kata laluan.",
        });
        setView("login");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        handleError(err, {
          source: 'auth_forgot_password',
          userFacingMessage: 'Ralat tidak diketahui',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validated = resetPasswordSchema.parse({ password: formData.password });

      const { error } = await supabase.auth.updateUser({
        password: validated.password,
      });

      if (error) {
        handleError(error, {
          source: 'auth_reset_password',
          userFacingMessage: error.message,
        });
      } else {
        toast({
          title: "Kata Laluan Dikemaskini",
          description: "Kata laluan anda telah berjaya dikemaskini. Sila log masuk semula.",
        });
        setView("login");
        setFormData(prev => ({ ...prev, password: "" }));
        // Remove query params
        navigate("/auth", { replace: true });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        handleError(err, {
          source: 'auth_reset_password',
          userFacingMessage: 'Ralat tidak diketahui',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Laman Utama
        </Button>

        <FloatingCard className="p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 mb-4 border-2 border-blue-200 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <img 
                src="/favicon.ico" 
                alt="Persatuan Ukay Perdana" 
                className="w-12 h-12"
              />
            </motion.div>
            <h2 className="text-sm font-semibold text-blue-700 mb-2 tracking-wide">
              Selamat Datang
            </h2>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Persatuan Penduduk Ukay Perdana
            </h1>
            <p className="text-muted-foreground text-sm mt-3">
              {view === "login" 
                ? "Log masuk ke akaun anda untuk melanjutkan" 
                : view === "register"
                ? "Bergabunglah dengan komuniti kami hari ini"
                : view === "forgot_password"
                ? "Masukkan email untuk set semula kata laluan"
                : "Masukkan kata laluan baru anda"}
            </p>
          </div>

          {/* Tab Switcher - Only show when not in forgot/reset password mode */}
          {view !== "forgot_password" && view !== "reset_password" && (
            <div className="flex bg-muted rounded-2xl p-1 mb-6">
              <button
                onClick={() => setView("login")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  view === "login"
                    ? "bg-background text-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Log Masuk
              </button>
              <button
                onClick={() => setView("register")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  view === "register"
                    ? "bg-background text-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Daftar
              </button>
            </div>
          )}

          {/* Forms */}
          <AnimatePresence mode="wait">
            {view === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`pl-10 h-12 rounded-xl ${errors.email ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">Kata Laluan</Label>
                    <button
                      type="button"
                      onClick={() => setView("forgot_password")}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Lupa Kata Laluan?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`pl-10 h-12 rounded-xl ${errors.password ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Log Masuk"
                  )}
                </Button>
              </motion.form>
            ) : view === "forgot_password" ? (
              <motion.form
                key="forgot_password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleForgotPassword}
                className="space-y-4"
              >
                 <div className="space-y-2">
                  <Label htmlFor="fp_email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fp_email"
                      name="email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`pl-10 h-12 rounded-xl ${errors.email ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Hantar Pautan Reset"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setView("login")}
                  className="w-full"
                >
                  Kembali ke Log Masuk
                </Button>
              </motion.form>
            ) : view === "reset_password" ? (
              <motion.form
                key="reset_password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleResetPassword}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="reset_password" className="text-foreground">Kata Laluan Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="reset_password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`pl-10 h-12 rounded-xl ${errors.password ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Kemaskini Kata Laluan"
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="nama_penuh" className="text-foreground">Nama Penuh</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="nama_penuh"
                      name="nama_penuh"
                      type="text"
                      placeholder="Ahmad bin Abu"
                      value={formData.nama_penuh}
                      onChange={handleInputChange}
                      className={`pl-10 h-12 rounded-xl ${errors.nama_penuh ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.nama_penuh && <p className="text-sm text-destructive">{errors.nama_penuh}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="no_rumah" className="text-foreground">No. Rumah</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="no_rumah"
                      name="no_rumah"
                      type="text"
                      placeholder="12A"
                      value={formData.no_rumah}
                      onChange={handleInputChange}
                      className={`pl-10 h-12 rounded-xl ${errors.no_rumah ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.no_rumah && <p className="text-sm text-destructive">{errors.no_rumah}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="no_telefon" className="text-foreground">No. Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="no_telefon"
                      name="no_telefon"
                      type="tel"
                      placeholder="0123456789"
                      value={formData.no_telefon}
                      onChange={handleInputChange}
                      className={`pl-10 h-12 rounded-xl ${errors.no_telefon ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.no_telefon && <p className="text-sm text-destructive">{errors.no_telefon}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg_email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="reg_email"
                      name="email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`pl-10 h-12 rounded-xl ${errors.email ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg_password" className="text-foreground">Kata Laluan</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="reg_password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`pl-10 h-12 rounded-xl ${errors.password ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Daftar Sekarang"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Dengan mendaftar, anda bersetuju dengan terma dan syarat persatuan.
                  Akaun anda perlu disahkan oleh AJK sebelum dapat mengakses sistem.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </FloatingCard>
      </motion.div>
    </div>
  );
};

export default Auth;
