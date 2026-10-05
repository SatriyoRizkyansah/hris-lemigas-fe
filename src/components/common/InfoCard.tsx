import { Card, Typography } from "@mui/material";
import { ReactNode } from "react";

interface InfoCardProps {
  message: string;
  variant?: "error" | "warning" | "info" | "loading";
  icon?: ReactNode;
}

export function InfoCard({ message, variant = "info", icon }: InfoCardProps) {
  const variantStyles = {
    error: {
      border: "1px dashed var(--destructive)",
      backgroundColor: "color-mix(in srgb, var(--destructive) 8%, transparent)",
      color: "var(--destructive)",
    },
    warning: {
      border: "1px dashed var(--warning)",
      backgroundColor: "color-mix(in srgb, var(--warning) 8%, transparent)",
      color: "var(--warning)",
    },
    info: {
      border: "1px dashed var(--border)",
      backgroundColor: "color-mix(in srgb, var(--muted) 55%, transparent)",
      color: "var(--muted-foreground)",
    },
    loading: {
      border: "1px solid var(--border)",
      backgroundColor: "var(--card)",
      color: "var(--muted-foreground)",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card
      sx={{
        p: 2,
        borderRadius: "12px",
        border: styles.border,
        backgroundColor: styles.backgroundColor,
        mb: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      {icon}
      <Typography variant="body2" sx={{ color: styles.color, fontWeight: variant === "error" ? 600 : 400 }}>
        {message}
      </Typography>
    </Card>
  );
}

export default InfoCard;
