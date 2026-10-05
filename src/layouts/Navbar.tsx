import { AppBar, Toolbar, Box, Typography, IconButton, useMediaQuery } from "@mui/material";
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon, CalendarTodayOutlined as CalendarIcon } from "@mui/icons-material";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { useSidebar } from "./DashboardLayout";
import { useTheme } from "../theme/useTheme";
import { CommandPalette, CommandPaletteTrigger } from "../components";
import { useState, useEffect } from "react";
import NotificationMenu from "./components/NotificationMenu";

const drawerWidth = 250;
const drawerWidthCollapsed = 80;

export function Navbar() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { mode, toggleColorMode } = useTheme();
  const isMobile = useMediaQuery("(max-width:767px)");
  const sidebarWidth = isCollapsed ? drawerWidthCollapsed : drawerWidth;
  const currentWidth = isMobile ? 0 : sidebarWidth;

  // Update date time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Format date and time
  const formatDate = (date: Date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];

    return `${dayName}, ${day} ${month}`;
  };

  return (
    <>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          width: isMobile ? "100%" : `calc(100% - ${currentWidth}px)`,
          ml: isMobile ? 0 : `${currentWidth}px`,
          backgroundColor: "var(--muted)",
          backgroundImage: "none",
          color: "var(--foreground)",
          top: 0,
          transition: "margin 0.3s ease, width 0.3s ease",
          // borderBottom: "1px solid var(--border)",
          height: 56,
        }}
      >
        <Toolbar
          sx={{
            minHeight: "56px !important",
            px: { xs: 2, sm: 3 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flex: 1, minWidth: 0 }}>
            {isMobile ? (
              <IconButton
                onClick={() => setIsCollapsed(!isCollapsed)}
                sx={{
                  color: "var(--foreground)",
                  backgroundColor: "var(--muted)",
                  border: "1px solid var(--border)",
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius)",
                  transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    backgroundColor: "var(--accent)",
                    borderColor: "var(--primary)",
                  },
                }}
              >
                <MenuOutlinedIcon fontSize="small" />
              </IconButton>
            ) : (
              /* Date Time Display */
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CalendarIcon sx={{ fontSize: 17, color: "var(--muted-foreground)" }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--muted-foreground)",
                    fontSize: "0.775rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDate(currentDateTime)}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CommandPaletteTrigger onClick={() => setCommandPaletteOpen(true)} />
            </Box>

            <NotificationMenu />

            <IconButton
              onClick={toggleColorMode}
              sx={{
                color: "var(--foreground)",
                backgroundColor: "var(--muted)",
                border: "1px solid var(--border)",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius)",
                transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  backgroundColor: "var(--accent)",
                  borderColor: "var(--primary)",
                },
              }}
            >
              {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <CommandPalette isOpen={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </>
  );
}
