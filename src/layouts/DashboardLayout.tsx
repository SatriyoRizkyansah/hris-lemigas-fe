import React, { createContext, useContext, useState } from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

const drawerWidth = 250;
const drawerWidthCollapsed = 80;

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  sectionTitle?: string;
  totalCount?: number;

  headerTitle?: string;
  headerDescription?: string;
  headerAction?: React.ReactNode;
}

export function DashboardLayout({ children, title, sectionTitle, totalCount, headerTitle, headerDescription, headerAction }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const updateCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
    }
  };

  // Desktop: collapsed = 80px, Desktop: expanded = 250px
  // Mobile: collapsed = 0px, Mobile: expanded = 250px
  const isMobile = useMediaQuery("(max-width:767px)");
  const sidebarWidth = isCollapsed ? drawerWidthCollapsed : drawerWidth;
  const currentWidth = isMobile ? 0 : sidebarWidth;

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed: updateCollapsed }}>
      <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "var(--muted)" }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: isMobile ? "100%" : `calc(100% - ${currentWidth}px)`,
            ml: isMobile ? 0 : `${currentWidth}px`,
            height: "100vh",
            overflow: "hidden",
            transition: "margin 0.3s ease, width 0.3s ease",
            backgroundColor: "var(--muted)",
          }}
        >
          <Navbar />
          <Box
            sx={{
              mt: "40px",
              height: "calc(100vh - 56px)",
              overflow: "hidden",
              p: { xs: 2, sm: 2 },
            }}
          >
            <Box
              sx={{
                height: "100%",
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: { xs: 1, sm: "14px" },
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {(title || sectionTitle) && (
                <Box
                  sx={{
                    px: { xs: 2, sm: 2.5 },
                    py: 1.25,
                    borderBottom: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--muted-foreground)",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      letterSpacing: "0.02em",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      flexWrap: "wrap",
                    }}
                  >
                    {sectionTitle && <Box component="span">{sectionTitle}</Box>}
                    {sectionTitle && title && (
                      <Box component="span" sx={{ color: "var(--border)" }}>
                        /
                      </Box>
                    )}
                    {title && (
                      <Box component="span" sx={{ color: "var(--foreground)" }}>
                        {title}
                        {totalCount !== undefined && (
                          <Box
                            component="span"
                            sx={{
                              ml: 0.75,
                              color: "var(--muted-foreground)",
                              fontWeight: 500,
                            }}
                          >
                            ({totalCount})
                          </Box>
                        )}
                      </Box>
                    )}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  flex: 1,
                  overflow: "auto",
                  overscrollBehavior: "contain",
                  scrollbarWidth: "thin",
                  scrollbarColor: "var(--border) transparent",
                  scrollbarGutter: "stable",
                  "&::-webkit-scrollbar": {
                    width: "10px",
                    height: "10px",
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "var(--border)",
                    borderRadius: "999px",
                    border: "3px solid transparent",
                    backgroundClip: "content-box",
                    minHeight: "48px",
                    transition: "background-color 0.2s ease",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: "var(--muted-foreground)",
                  },
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    overflow: "auto",
                    overscrollBehavior: "contain",
                    scrollbarWidth: "thin",
                    scrollbarColor: "var(--border) transparent",
                    scrollbarGutter: "stable",
                    "&::-webkit-scrollbar": {
                      width: "10px",
                      height: "10px",
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "var(--border)",
                      borderRadius: "999px",
                      border: "3px solid transparent",
                      backgroundClip: "content-box",
                      minHeight: "48px",
                    },
                  }}
                >
                  {(headerTitle || headerDescription || headerAction) && (
                    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2.5 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          alignItems: { xs: "flex-start", sm: "center" },
                          justifyContent: "space-between",
                          gap: { xs: 1.25, sm: 1.5 },
                        }}
                      >
                        {/* Title + description */}
                        <Box sx={{ minWidth: 0 }}>
                          {headerTitle && (
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                color: "var(--foreground)",
                                fontSize: { xs: "0.95rem", sm: "1rem" },
                                lineHeight: 1.3,
                              }}
                            >
                              {headerTitle}
                            </Typography>
                          )}
                          {headerDescription && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: "var(--muted-foreground)",
                                fontSize: { xs: "0.72rem", sm: "0.875rem" },
                                mt: 0.25,
                              }}
                            >
                              {headerDescription}
                            </Typography>
                          )}
                        </Box>

                        {/* Action buttons — wrap, left-aligned on mobile */}
                        {headerAction && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: { xs: 0.75, sm: 1 },
                              flexWrap: "wrap",
                              width: { xs: "100%", sm: "auto" },
                              justifyContent: { xs: "flex-start", sm: "flex-end" },
                              flexShrink: 0,
                              "& .MuiButton-root": {
                                fontSize: { xs: "0.75rem", sm: undefined },
                                px: { xs: 1.5, sm: undefined },
                                py: { xs: 0.65, sm: undefined },
                                "& .MuiButton-startIcon svg": {
                                  fontSize: { xs: "1rem !important", sm: undefined },
                                },
                              },
                            }}
                          >
                            {headerAction}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* {children} */}
                </Box>
                {children}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </SidebarContext.Provider>
  );
}
