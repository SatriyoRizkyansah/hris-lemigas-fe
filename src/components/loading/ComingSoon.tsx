import { Box, Card, Typography } from "@mui/material";
import "./css/ComingSoon.css";

interface ComingSoonProps {
  title?: string;
  description?: string;
  sectionTitle?: string;
}

export function ComingSoon({ title = "Coming Soon", description = "Fitur ini sedang dalam pengembangan dan akan segera hadir.", sectionTitle }: ComingSoonProps) {
  return (
    <Box
      sx={{
        minHeight: "40vw",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--background)",
      }}
    >
      {/* Header */}
      {sectionTitle && (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ color: "var(--foreground)" }}>
            {sectionTitle}
          </Typography>
        </Box>
      )}

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Card
          sx={{
            maxWidth: 600,
            width: "100%",
            p: 4,
            borderRadius: "16px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Clouds Background */}
          <div className="clouds">
            <div className="cloud cloud1"></div>
            <div className="cloud cloud2"></div>
            <div className="cloud cloud3"></div>
            <div className="cloud cloud4"></div>
            <div className="cloud cloud5"></div>
          </div>

          {/* Rocket Loader */}
          <Box
            sx={{
              position: "relative",
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <div className="loader">
              <span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </span>
              <div className="base">
                <span></span>
                <div className="face"></div>
              </div>
            </div>

            <div className="longfazers">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </Box>

          {/* Text Content */}
          <Box sx={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                color: "var(--foreground)",
                mb: 2,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "var(--muted-foreground)",
                lineHeight: 1.6,
              }}
            >
              {description}
            </Typography>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
