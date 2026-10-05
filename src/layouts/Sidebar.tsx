/* eslint-disable react-hooks/immutability */
import { useState } from "react";
import { Box, Drawer, List, Typography, Avatar, IconButton, useMediaQuery, ListItemButton, ListItemIcon, Menu, MenuItem, CircularProgress } from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  LogoutOutlined,
  SwapHorizRounded as SwapHorizRoundedIcon,
  KeyboardArrowDownRounded as KeyboardArrowDownRoundedIcon,
  CheckRounded as CheckRoundedIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "./DashboardLayout";
import { SidebarNavItem, get_sidebar_sections, resolve_menu_role_from_akses, is_path_available_for_role, type NavItem } from "./components";
import { useSignalValue } from "@Signal/hooks";
import { auth_signal, clear_auth, set_selected_token } from "@Signal/use-signal/auth-init-signal";
import network_cache from "@Hooks/api-cache";
import { Loader } from "../components/loading/Loader";
import HeaderImage from "../assets/images/vite.svg";
import userImage from "@/assets/images/user.png";

const drawerWidth = 250;
const drawerWidthCollapsed = 80;

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const isMobile = useMediaQuery("(max-width:767px)");
  const authState = useSignalValue(auth_signal);
  const [aksesMenuAnchor, setAksesMenuAnchor] = useState<null | HTMLElement>(null);
  const [switchingAksesIndex, setSwitchingAksesIndex] = useState<number | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userName = authState?.loginResponse?.nama || "Guest";
  const activeAkses = authState?.selectedAuthorization?.akses || authState?.loginResponse?.akses?.[0]?.akses || "Tidak ada akses";
  const activeAksesValue = authState?.data?.akses;
  const aksesList = authState?.loginResponse?.akses || [];
  const currentMenuRole = resolve_menu_role_from_akses(activeAksesValue ?? activeAkses);
  const sidebarSections = get_sidebar_sections(currentMenuRole);
  const canSwitchAkses = aksesList.length > 1;
  const isAksesMenuOpen = Boolean(aksesMenuAnchor);
  const isSwitchingAkses = switchingAksesIndex !== null;

  const sidebarWidth = isCollapsed ? drawerWidthCollapsed : drawerWidth;
  const drawerPaperWidth = isMobile ? drawerWidth : sidebarWidth;

  const isActive = (path: string) => location.pathname === path;

  const renderNavItem = (item: NavItem) => <SidebarNavItem key={item.title} item={item} active={isActive(item.path)} collapsed={isCollapsed} onNavigate={navigate} />;

  const photoUrl = auth_signal.value?.data?.foto ? `${window.location.origin}/api/uploaded/${auth_signal.value.data.foto}` : userImage;

  const [avatarSrc, setAvatarSrc] = useState(photoUrl);

  const renderSectionHeader = (title: string, abbreviation: string) => (
    <Box
      sx={{
        position: "relative",
        height: 26,
        overflow: "hidden",
        mb: 0.5,
      }}
    >
      <Typography
        variant="overline"
        sx={{
          px: 1.5,
          py: 0.5,
          display: "block",
          color: "var(--muted-foreground)",
          fontWeight: 700,
          fontSize: "0.67rem",
          letterSpacing: "0.12em",
          position: "absolute",
          left: 0,
          opacity: isCollapsed ? 0 : 1,
          transition: "opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: isCollapsed ? "none" : "auto",
          textTransform: "uppercase",
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="overline"
        sx={{
          px: 1.5,
          py: 0.5,
          display: "block",
          color: "var(--muted-foreground)",
          fontWeight: 700,
          fontSize: "0.67rem",
          letterSpacing: "0.12em",
          textAlign: "center",
          position: "absolute",
          left: 0,
          right: 0,
          opacity: isCollapsed ? 1 : 0,
          transition: "opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: isCollapsed ? "auto" : "none",
          textTransform: "uppercase",
        }}
      >
        {abbreviation}
      </Typography>
    </Box>
  );

  const handleLogout = () => {
    setIsLoggingOut(true);

    // Show loader for 1.5 seconds before logout
    setTimeout(() => {
      clear_auth();
      navigate("/login", { replace: true });
    }, 300);
  };

  const handleOpenAksesMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (!canSwitchAkses) {
      return;
    }
    setAksesMenuAnchor(event.currentTarget);
  };

  const handleCloseAksesMenu = () => {
    if (typeof document !== "undefined") {
      (document.activeElement as HTMLElement | null)?.blur();
    }
    setAksesMenuAnchor(null);
  };

  const handleSwitchAkses = async (aksesIndex: number) => {
    const nextAkses = aksesList[aksesIndex];
    if (!nextAkses || isSwitchingAkses) {
      return;
    }

    if (nextAkses.token === authState?.selectedToken) {
      setAksesMenuAnchor(null);
      return;
    }

    setSwitchingAksesIndex(aksesIndex);

    try {
      // Clear cache first to prevent stale data
      network_cache.clear();

      // Set new token
      set_selected_token(nextAkses.token);

      // Close menu
      if (typeof document !== "undefined") {
        (document.activeElement as HTMLElement | null)?.blur();
      }
      setAksesMenuAnchor(null);

      // Wait a bit for auth state to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const nextRole = resolve_menu_role_from_akses(auth_signal.value.data?.akses ?? nextAkses.akses);
      const currentPath = location.pathname;

      // Check if current path is available for the new role
      if (is_path_available_for_role(currentPath, nextRole)) {
        // Force reload the page to ensure fresh data with new token
        window.location.href = currentPath;
      } else {
        // Navigate to Data Diri if current path is not available for new role
        window.location.href = "/data-diri";
      }
    } catch (error) {
      console.error("Failed to switch akses:", error);
      setAksesMenuAnchor(null);
      setSwitchingAksesIndex(null);
    }
  };

  return (
    <>
      {isLoggingOut && <Loader label="Logging out..." />}

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? !isCollapsed : true}
        onClose={() => setIsCollapsed(true)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: 0,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerPaperWidth,
            boxSizing: "border-box",
            backgroundColor: "var(--muted)",
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            left: 0,
            top: 0,
            height: "100vh",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            borderRight: "1px solid var(--border)",
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "visible",
          },
        }}
      >
        {/* Logo Section */}
        <Box
          sx={{
            px: 1.5,
            minHeight: 56,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            backgroundColor: "var(--muted)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                p: 0.5,
                borderRadius: "12px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <img
                src={HeaderImage}
                alt="logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: isCollapsed ? "0fr" : "1fr",
                transition: "grid-template-columns 0.24s cubic-bezier(0.4, 0, 0.2, 1)",
                minWidth: 0,
              }}
            >
              <Box sx={{ overflow: "hidden" }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    // gap: "0",
                    whiteSpace: "nowrap",
                  }}
                >
                  {/* Title */}
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{
                      color: "var(--foreground)",
                      letterSpacing: "-0.01em",
                      opacity: isCollapsed ? 0 : 1,
                      transform: isCollapsed ? "translateX(-8px)" : "translateX(0)",
                      transition: "opacity 0.18s ease, transform 0.24s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    SRT
                  </Typography>

                  {/* Subtitle */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--muted-foreground)",
                      fontSize: "8px",
                      opacity: isCollapsed ? 0 : 0.7,
                      transform: isCollapsed ? "translateX(-8px)" : "translateX(0)",
                      transition: "opacity 0.2s ease, transform 0.24s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    My APP Satriyo Template
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {!isCollapsed && (
            <IconButton
              onClick={() => setIsCollapsed(!isCollapsed)}
              sx={{
                color: "var(--foreground)",
                width: 30,
                height: 30,
                borderRadius: "8px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                "&:hover": {
                  backgroundColor: "var(--accent)",
                  borderColor: "var(--primary)",
                },
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}

          {isCollapsed && !isMobile && (
            <IconButton
              onClick={() => setIsCollapsed(!isCollapsed)}
              sx={{
                position: "absolute",
                right: "-16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--foreground)",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                width: 30,
                height: 30,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.1)",
                transition: "all 0.3s ease",
                zIndex: 1300,
                borderRadius: "8px",
                "&:hover": {
                  borderColor: "var(--primary)",
                  backgroundColor: "var(--accent)",
                  transform: "translateY(-50%) scale(1.1)",
                  boxShadow: "0 6px 14px rgba(15, 23, 42, 0.14)",
                },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>
        {/* Navigation Content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 1.25,
            scrollbarWidth: "thin",
            scrollbarColor: "var(--border) transparent",
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "var(--border)",
              borderRadius: "3px",
              "&:hover": {
                backgroundColor: "var(--muted-foreground)",
              },
            },
          }}
        >
          {sidebarSections.map((section, index) => (
            <Box key={section.key} sx={{ mb: index === sidebarSections.length - 1 ? 0 : 1.5 }}>
              {renderSectionHeader(section.title, section.abbreviation)}
              <List sx={{ p: 0 }}>{section.items.map(renderNavItem)}</List>
            </Box>
          ))}
        </Box>
        {/* User Profile Section */}
        <Box
          sx={{
            p: 1.25,
            pt: 1,
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--muted)",
          }}
        >
          <Box
            onClick={handleOpenAksesMenu}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: isCollapsed ? 0 : 1.5,
              p: 1.25,
              borderRadius: "12px",
              border: canSwitchAkses ? "1px solid color-mix(in srgb, var(--primary) 34%, var(--border))" : "1px solid var(--border)",
              backgroundColor: "var(--card)",
              cursor: canSwitchAkses ? "pointer" : "default",
              transition: "all 0.2s ease",
              justifyContent: isCollapsed ? "center" : "flex-start",
              "&:hover": {
                borderColor: canSwitchAkses ? "var(--primary)" : "var(--border)",
                boxShadow: canSwitchAkses ? "0 8px 18px rgba(15, 23, 42, 0.08)" : "none",
              },
            }}
          >
            <Avatar
              src={avatarSrc}
              imgProps={{
                onError: () => {
                  setAvatarSrc(userImage);
                },
              }}
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
              }}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: isCollapsed ? "0fr" : "1fr",
                transition: "grid-template-columns 0.24s cubic-bezier(0.4, 0, 0.2, 1)",
                flex: 1,
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  overflow: "hidden",
                  minWidth: 0,
                  opacity: isCollapsed ? 0 : 1,
                  transform: isCollapsed ? "translateX(-8px)" : "translateX(0)",
                  transition: "opacity 0.18s ease, transform 0.24s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <Typography variant="body2" fontWeight={600} sx={{ color: "var(--foreground)", whiteSpace: "nowrap" }}>
                  {userName}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {activeAkses}
                  </Typography>
                  <SwapHorizRoundedIcon sx={{ fontSize: "0.95rem", color: canSwitchAkses ? "var(--primary)" : "var(--muted-foreground)" }} />
                </Box>
              </Box>
            </Box>

            {!isCollapsed && canSwitchAkses && <KeyboardArrowDownRoundedIcon sx={{ color: "var(--muted-foreground)", transform: isAksesMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }} />}
          </Box>
          <Menu
            anchorEl={aksesMenuAnchor}
            open={isAksesMenuOpen}
            onClose={handleCloseAksesMenu}
            disableAutoFocusItem
            disableRestoreFocus
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            PaperProps={{
              sx: {
                ml: 1,
                borderRadius: "12px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                minWidth: 240,
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
                overflow: "hidden",
              },
            }}
          >
            {aksesList.map((aksesItem, index) => {
              const isSelected = aksesItem.token === authState?.selectedToken;
              const isSwitchingCurrentItem = switchingAksesIndex === index;

              return (
                <MenuItem
                  key={`${aksesItem.akses}-${index}`}
                  onClick={() => handleSwitchAkses(index)}
                  selected={isSelected}
                  disabled={isSwitchingAkses}
                  sx={{
                    py: 1.25,
                    px: 1.5,
                    gap: 1,
                    fontSize: "0.89rem",
                    fontWeight: isSelected ? 600 : 500,
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    "&:hover": {
                      transform: "translateX(2px)",
                    },
                    "&.Mui-selected": {
                      backgroundColor: "color-mix(in srgb, var(--primary) 14%, transparent)",
                    },
                    "&.Mui-selected:hover": {
                      backgroundColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ color: "var(--foreground)", flex: 1 }}>
                    {aksesItem.akses}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 24, color: isSelected ? "var(--primary)" : "var(--muted-foreground)" }}>
                    {isSwitchingCurrentItem ? <CircularProgress size={16} color="inherit" /> : isSelected ? <CheckRoundedIcon fontSize="small" /> : <SwapHorizRoundedIcon fontSize="small" />}
                  </Box>
                </MenuItem>
              );
            })}
          </Menu>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              mt: 1,
              borderRadius: "10px",
              border: "1px solid var(--border)",
              color: "var(--muted-foreground)",
              px: 1.25,
              py: 1,
              gap: isCollapsed ? 0 : 1,
              justifyContent: isCollapsed ? "center" : "flex-start",
              "&:hover": {
                borderColor: "var(--destructive)",
                backgroundColor: "rgba(220, 38, 38, 0.08)",
                color: "var(--destructive)",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: isCollapsed ? "auto" : 32, color: "inherit", justifyContent: "center" }}>
              <LogoutOutlined fontSize="small" />
            </ListItemIcon>
            {!isCollapsed && (
              <Typography variant="body2" fontWeight={600}>
                Logout
              </Typography>
            )}
          </ListItemButton>
        </Box>
      </Drawer>
    </>
  );
}
