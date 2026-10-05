import { Box, Typography, Button } from "@mui/material";
import { ArrowBackOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background)",
        px: 3,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          right: "8%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "color-mix(in srgb, var(--primary) 6%, transparent)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "15%",
          left: "5%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "color-mix(in srgb, var(--primary) 4%, transparent)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <Box
        sx={{
          textAlign: "center",
          maxWidth: 480,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* 404 number */}
        <Typography
          sx={{
            fontSize: { xs: "7rem", sm: "10rem" },
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            background: "linear-gradient(135deg, var(--primary) 0%, #d4722a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            mb: 0,
            userSelect: "none",
          }}
        >
          404
        </Typography>

        {/* Divider line */}
        <Box
          sx={{
            mx: "auto",
            width: 48,
            height: 3,
            borderRadius: 99,
            background: "linear-gradient(90deg, var(--primary), #d4722a)",
            mb: 3,
          }}
        />

        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "var(--foreground)",
            mb: 1.5,
            letterSpacing: "-0.02em",
          }}
        >
          Halaman tidak ditemukan
        </Typography>

        <Typography
          sx={{
            fontSize: "0.95rem",
            color: "var(--muted-foreground)",
            lineHeight: 1.7,
            mb: 4,
          }}
        >
          Halaman yang kamu cari tidak ada, sudah dipindahkan, atau mungkin URL-nya salah ketik.
        </Typography>

        <Button
          onClick={() => navigate("/")}
          startIcon={<ArrowBackOutlined />}
          sx={{
            px: 3.5,
            py: 1.25,
            borderRadius: "var(--radius)",
            fontWeight: 600,
            fontSize: "0.9rem",
            textTransform: "none",
            background: "linear-gradient(135deg, var(--primary) 0%, #d4722a 100%)",
            color: "#fff",
            boxShadow: "0 4px 14px rgba(242, 133, 65, 0.32)",
            "&:hover": {
              background: "linear-gradient(135deg, #e07535 0%, #c05d1c 100%)",
              boxShadow: "0 4px 18px rgba(242, 133, 65, 0.42)",
            },
            transition: "all var(--transition-base)",
          }}
        >
          Kembali ke Beranda
        </Button>
      </Box>
    </Box>
  );
}

export default NotFoundPage;
