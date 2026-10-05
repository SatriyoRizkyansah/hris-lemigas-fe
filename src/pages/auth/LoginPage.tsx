import React, { useState } from "react";
import { Box, Typography, TextField, Button, InputAdornment, IconButton, Divider, LinearProgress } from "@mui/material";
import { Visibility, VisibilityOff, LockOutlined, PersonOutline, CheckCircleOutline } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "../../components";
import { set_login_response } from "@Signal/use-signal/auth-init-signal";
import { Api } from "@Hooks/api-generated";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginForm {
  username: string;
  password: string;
}

interface LoginPageProps {
  /** Logo element di atas form (mobile) dan panel kiri (desktop) */
  logo?: React.ReactNode;
  /** Nama aplikasi */
  appName?: string;
  /** Tagline di panel kiri */
  tagline?: string;
  /** Handler submit — kalau tidak disediakan, pakai API login backend */
  onSubmit?: (form: LoginForm) => Promise<void> | void;
}

// ─── Loading steps ────────────────────────────────────────────────────────────

const LOADING_STEPS = ["Memverifikasi kredensial...", "Mengambil data akses...", "Menyiapkan sesi...", "Berhasil masuk!"];

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginPage({ logo, appName = "HRIS Lemigas", tagline = "Sistem Informasi Kepegawaian & Alokasi Gaji Tenaga Ahli LEMIGAS.", onSubmit }: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";
  const [form, setForm] = useState<LoginForm>({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  /** Login via API backend — animasi steps berjalan selama request berlangsung */
  const run_login = async (): Promise<void> => {
    const api = new Api({});

    const request = api.auth.loginUser({ email: form.username.trim(), password: form.password });

    // Animasi steps paralel dengan request
    let step = 0;
    const totalSteps = LOADING_STEPS.length;
    const animation = new Promise<void>((resolveAnimation) => {
      const tick = () => {
        step++;
        setLoadingStep(Math.min(step - 1, totalSteps - 1));
        setLoadingProgress(Math.min(100, Math.round((step / totalSteps) * 100)));
        if (step < totalSteps) setTimeout(tick, 450);
        else resolveAnimation();
      };
      setTimeout(tick, 200);
    });

    try {
      const res = await request;
      const loginData = res.data;
      if (!loginData?.akses?.length) {
        throw new Error("Login berhasil tetapi tidak ada akses yang diberikan.");
      }

      // Tunggu animasi minimal selesai supaya UI loading tidak kedip
      await animation;
      setLoadingStep(totalSteps - 1);
      setLoadingProgress(100);
      setIsDone(true);

      // Persist auth (token + akses list) ke cookie/localStorage via auth-signal
      set_login_response(loginData);

      await new Promise((r) => setTimeout(r, 500));
      navigate(from, { replace: true });
    } catch (err: any) {
      let message = "Login gagal. Periksa kembali email dan password kamu.";
      try {
        const body = typeof err?.json === "function" ? await err.clone().json() : (err?.data ?? err?.error ?? null);
        if (body?.message) message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
        else if (err?.status === 401) message = "Email atau password salah.";
      } catch {
        // biarkan pesan default
      }
      setError(message);
      throw new Error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username.trim() || !form.password.trim()) {
      setError("Username dan password tidak boleh kosong.");
      return;
    }

    try {
      setIsLoading(true);
      setLoadingStep(0);
      setLoadingProgress(0);
      setIsDone(false);
      setError(null);

      if (onSubmit) {
        await onSubmit(form);
      } else {
        await run_login();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal. Periksa kembali kredensial kamu.");
      setIsLoading(false);
      setIsDone(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "stretch",
        backgroundColor: "var(--background)",
        position: "relative",
      }}
    >
      {/* ── Theme Toggle ───────────────────────────────────────────────────── */}
      <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 10 }}>
        <ThemeToggle />
      </Box>

      {/* ── Left Panel — Branding ──────────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: 1,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, var(--primary) 0%, #d4722a 100%)",
          px: 6,
          py: 8,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <Box sx={{ position: "absolute", top: -80, left: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", top: "40%", left: "10%", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        {/* Content */}
        <Box sx={{ position: "relative", textAlign: "center", maxWidth: 360 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: "var(--radius-lg)",
              backgroundColor: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              mb: 3,
              border: "1px solid rgba(255,255,255,0.28)",
            }}
          >
            {logo ?? <LockOutlined sx={{ fontSize: 34, color: "#fff" }} />}
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: "#fff",
              mb: 1.5,
              letterSpacing: "-0.025em",
              fontSize: { md: "2rem", lg: "2.5rem" },
            }}
          >
            {appName}
          </Typography>

          <Typography sx={{ color: "rgba(255,255,255,0.82)", fontSize: "1rem", lineHeight: 1.65 }}>{tagline}</Typography>

          <Box sx={{ mt: 4, mx: "auto", width: 40, height: 3, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.38)" }} />
        </Box>
      </Box>

      {/* ── Right Panel — Form ─────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: { xs: 1, md: "0 0 460px" },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 6 },
          py: 6,
          backgroundColor: "var(--card)",
          borderLeft: { md: "1px solid var(--border)" },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 380 }}>
          {/* Mobile: logo + app name */}
          <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", alignItems: "center", mb: 4 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(145deg, var(--primary) 0%, #d4722a 100%)",
                mb: 2,
              }}
            >
              {logo ?? <LockOutlined sx={{ fontSize: 28, color: "#fff" }} />}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--foreground)" }}>
              {appName}
            </Typography>
          </Box>

          {/* ── Loading overlay ─────────────────────────────────────────────── */}
          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2.5,
                py: 4,
                animation: "fadeIn 0.3s ease",
                "@keyframes fadeIn": { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
              }}
            >
              {/* Success / spinner icon */}
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDone ? "color-mix(in srgb, #22c55e 14%, transparent)" : "color-mix(in srgb, var(--primary) 12%, transparent)",
                  border: `2px solid ${isDone ? "#22c55e" : "var(--primary)"}`,
                  transition: "all 0.4s ease",
                }}
              >
                {isDone ? (
                  <CheckCircleOutline sx={{ fontSize: 32, color: "#22c55e" }} />
                ) : (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "3px solid var(--border)",
                      borderTop: "3px solid var(--primary)",
                      animation: "spin 0.7s linear infinite",
                      "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                    }}
                  />
                )}
              </Box>

              {/* Progress bar */}
              <Box sx={{ width: "100%" }}>
                <LinearProgress
                  variant="determinate"
                  value={loadingProgress}
                  sx={{
                    height: 6,
                    borderRadius: 99,
                    backgroundColor: "var(--muted)",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 99,
                      background: "linear-gradient(90deg, var(--primary), #d4722a)",
                      transition: "transform 0.5s ease",
                    },
                  }}
                />
              </Box>

              {/* Step list */}
              <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
                {LOADING_STEPS.map((step, i) => {
                  const isPast = i < loadingStep;
                  const isCurrent = i === loadingStep && !isDone;
                  const isCompleted = isDone && i === LOADING_STEPS.length - 1;

                  return (
                    <Box
                      key={step}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 1.5,
                        py: 1,
                        borderRadius: "var(--radius)",
                        backgroundColor: isCurrent || isCompleted ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "transparent",
                        border: isCurrent || isCompleted ? "1px solid color-mix(in srgb, var(--primary) 20%, transparent)" : "1px solid transparent",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {/* dot */}
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          flexShrink: 0,
                          backgroundColor: isPast || isCompleted ? "#22c55e" : isCurrent ? "var(--primary)" : "var(--border)",
                          transition: "background-color 0.3s ease",
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: "0.825rem",
                          fontWeight: isCurrent || isCompleted ? 600 : 400,
                          color: isPast || isCompleted ? "#22c55e" : isCurrent ? "var(--foreground)" : "var(--muted-foreground)",
                          transition: "color 0.3s ease",
                        }}
                      >
                        {step}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ) : (
            <>
              {/* ── Normal Form ────────────────────────────────────────────── */}
              <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--foreground)", mb: 0.75, letterSpacing: "-0.01em" }}>
                Masuk ke akun kamu
              </Typography>
              <Typography sx={{ color: "var(--muted-foreground)", fontSize: "0.875rem", mb: 3.5 }}>Masukkan username dan password untuk melanjutkan.</Typography>

              <Divider sx={{ borderColor: "var(--border)", mb: 3.5 }} />

              <Box component="form" onSubmit={handleSubmit} noValidate>
                {/* Error banner */}
                {error && (
                  <Box
                    sx={{
                      mb: 2.5,
                      px: 2,
                      py: 1.5,
                      borderRadius: "var(--radius)",
                      backgroundColor: "rgba(220,38,38,0.08)",
                      border: "1px solid rgba(220,38,38,0.2)",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      animation: "fadeIn 0.25s ease",
                      "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--danger)", flexShrink: 0 }} />
                    <Typography sx={{ fontSize: "0.825rem", color: "var(--danger)", lineHeight: 1.4 }}>{error}</Typography>
                  </Box>
                )}

                {/* Username */}
                <Box sx={{ mb: 2 }}>
                  <Typography component="label" htmlFor="username" sx={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "var(--foreground)", mb: 0.75 }}>
                    Username
                  </Typography>
                  <TextField
                    id="username"
                    name="username"
                    placeholder="Masukkan username"
                    value={form.username}
                    onChange={handleChange}
                    autoComplete="username"
                    autoFocus
                    fullWidth
                    size="small"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutline sx={{ fontSize: 18, color: "var(--muted-foreground)" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "var(--radius)", backgroundColor: "var(--background)", fontSize: "0.9rem" } }}
                  />
                </Box>

                {/* Password */}
                <Box sx={{ mb: 3 }}>
                  <Typography component="label" htmlFor="password" sx={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "var(--foreground)", mb: 0.75 }}>
                    Password
                  </Typography>
                  <TextField
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    fullWidth
                    size="small"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined sx={{ fontSize: 18, color: "var(--muted-foreground)" }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
                              {showPassword ? <VisibilityOff sx={{ fontSize: 18, color: "var(--muted-foreground)" }} /> : <Visibility sx={{ fontSize: 18, color: "var(--muted-foreground)" }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "var(--radius)", backgroundColor: "var(--background)", fontSize: "0.9rem" } }}
                  />
                </Box>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    py: 1.25,
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    background: "linear-gradient(135deg, var(--primary) 0%, #d4722a 100%)",
                    boxShadow: "0 4px 14px rgba(242, 133, 65, 0.32)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #e07535 0%, #c05d1c 100%)",
                      boxShadow: "0 4px 18px rgba(242, 133, 65, 0.42)",
                    },
                    transition: "all var(--transition-base)",
                  }}
                >
                  Masuk
                </Button>
              </Box>
            </>
          )}

          {/* Footer */}
          <Typography sx={{ mt: 4, textAlign: "center", fontSize: "0.775rem", color: "var(--muted-foreground)" }}>
            © {new Date().getFullYear()} {appName}. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default LoginPage;
