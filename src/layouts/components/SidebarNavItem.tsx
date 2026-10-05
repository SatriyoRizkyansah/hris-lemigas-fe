import { useState } from "react";
import { Box, ListItemButton, ListItemIcon, Typography } from "@mui/material";
import type { NavItem } from "./sidebarItems";
import { Loader } from "../../components/loading/Loader";

interface SidebarNavItemProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: (path: string) => void;
}

export function SidebarNavItem({ item, active, collapsed, onNavigate }: SidebarNavItemProps) {
  const [loading, setLoading] = useState(false);
  const showBadge = item.badge !== undefined && item.badge !== null;

  const handleClick = async () => {
    if (!item.href) {
      onNavigate(item.path);
      return;
    }

    setLoading(true);
    const start = Date.now();
    try {
      const url = await Promise.resolve(typeof item.href === "function" ? item.href() : item.href);
      if (url && url !== "#") {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, 1000 - elapsed);
        await new Promise((r) => setTimeout(r, remaining));
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader label="Membuka Beasiswa S3..." />}
      <ListItemButton
        key={item.title}
        onClick={handleClick}
        sx={{
          borderRadius: "10px",
          // mb: 0.5,
          // py: 1,
          // px: 1.25,
          transition: "background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
          backgroundColor: active ? "var(--card)" : "transparent",
          border: active ? "1px solid var(--border)" : "1px solid transparent",
          color: active ? "var(--foreground)" : "var(--muted-foreground)",
          justifyContent: "flex-start",
          boxShadow: active ? "0 2px 6px rgba(15, 23, 42, 0.06)" : "none",
          "&:hover": {
            backgroundColor: "var(--card)",
            borderColor: active ? "var(--border)" : "rgba(148, 163, 184, 0.35)",
            color: "var(--foreground)",
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 30,
            color: "inherit",
            justifyContent: "flex-start",
            flex: "0 0 auto",
            // mr: 1,
            transition: "margin-right 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {item.icon}
        </ListItemIcon>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: collapsed ? "0fr" : "1fr",
            flex: 1,
            transition: "grid-template-columns 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Box sx={{ overflow: "hidden", minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 1,
                opacity: collapsed ? 0 : 1,
                transform: collapsed ? "translateX(-8px)" : "translateX(0)",
                transition: "opacity 0.18s ease, transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: active ? 600 : 500,
                  fontSize: "0.86rem",
                  color: "inherit",
                  whiteSpace: "nowrap",
                  transition: "color 0.2s ease",
                }}
              >
                {item.title}
              </Typography>
              {showBadge && (
                <Box
                  component="span"
                  sx={{
                    minWidth: 24,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 9999,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    textAlign: "center",
                    backgroundColor: active ? "rgba(239, 68, 68, 0.12)" : "var(--muted)",
                    color: active ? "var(--primary)" : "var(--muted-foreground)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.badge}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </ListItemButton>
    </>
  );
}

export default SidebarNavItem;
