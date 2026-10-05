import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { TextField, MenuItem, InputAdornment, ListSubheader, Typography, Box, Chip } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { Search as SearchIcon } from "@mui/icons-material";
import type { TableFilterOption } from "./types";

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  options: TableFilterOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SearchHeader = memo(({ onSearchChange, onSearchKeyDown, onSearchClick }: { onSearchChange: (value: string) => void; onSearchKeyDown: (e: React.KeyboardEvent) => void; onSearchClick: (e: React.MouseEvent) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus search input when dropdown opens
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onSearchChange(e.target.value);
    },
    [onSearchChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      onSearchKeyDown(e);
    },
    [onSearchKeyDown],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSearchClick(e);
    },
    [onSearchClick],
  );

  return (
    <ListSubheader
      component="div"
      sx={{
        backgroundColor: "var(--card)",
        borderBottom: "1px solid var(--border)",
        px: 1.5,
        py: 1.25,
        position: "sticky",
        top: 0,
        zIndex: 2,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <TextField
        inputRef={inputRef}
        size="small"
        placeholder="Search..."
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onMouseDown={(e) => e.stopPropagation()}
        fullWidth
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "var(--background)",
            fontSize: "0.875rem",
            "& fieldset": {
              borderColor: "var(--border)",
            },
            "&:hover fieldset": {
              borderColor: "var(--muted-foreground)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "var(--primary)",
            },
          },
          "& .MuiInputBase-input": {
            color: "var(--foreground)",
            caretColor: "var(--foreground)",
          },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: "1rem", color: "var(--muted-foreground)" }} />
              </InputAdornment>
            ),
          },
        }}
      />
    </ListSubheader>
  );
});

SearchHeader.displayName = "SearchHeader";

function FilterSelectComponent({ id, label, value, options, onChange, disabled }: FilterSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const menuItemRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  // Parse label to extract name and badge
  const parseLabel = useCallback((label: string) => {
    const parts = label.split("|");
    if (parts.length === 2) {
      return { name: parts[0], badge: parts[1] };
    }
    return { name: label, badge: null };
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase();
    return options.filter((option) => {
      const { name, badge } = parseLabel(option.label);
      // Search di nama dan badge (nama_singkatan)
      return name.toLowerCase().includes(query) || (badge && badge.toLowerCase().includes(query));
    });
  }, [options, searchQuery, parseLabel]);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    if (filteredOptions.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedIndex(0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [filteredOptions]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
      const menuItem = menuItemRefs.current.get(highlightedIndex);
      if (menuItem) {
        menuItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [highlightedIndex, filteredOptions.length]);

  const handleMenuOpen = useCallback(() => {
    setIsOpen(true);
    setSearchQuery(""); // Reset search query
    setHighlightedIndex(0);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  }, []);

  const handleChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      onChange(event.target.value as string);
      setIsOpen(false);
    },
    [onChange],
  );

  const handleSelectOption = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery("");
      setHighlightedIndex(-1);
    },
    [onChange],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const nextIndex = prev + 1;
            return nextIndex >= filteredOptions.length ? 0 : nextIndex;
          });
          break;

        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const nextIndex = prev - 1;
            return nextIndex < 0 ? filteredOptions.length - 1 : nextIndex;
          });
          break;

        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            const selectedOption = filteredOptions[highlightedIndex];
            handleSelectOption(selectedOption.value);
          }
          break;

        case "Escape":
          event.preventDefault();
          if (searchQuery) {
            setSearchQuery("");
          } else {
            setIsOpen(false);
          }
          break;

        case "Tab":
          event.preventDefault();
          break;

        default:
          break;
      }
    },
    [filteredOptions, highlightedIndex, handleSelectOption, searchQuery],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSearchClick = useCallback((_event: React.MouseEvent) => {
    // Prevent menu from closing
  }, []);

  // Get display value for selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  const selectedDisplayValue = useMemo(() => {
    if (!selectedOption) return value === "__all" ? "Semua" : value;
    const { name } = parseLabel(selectedOption.label);
    return name;
  }, [selectedOption, value, parseLabel]);

  // Memoize the search header to prevent re-creation
  const searchHeader = useMemo(() => <SearchHeader onSearchChange={handleSearchChange} onSearchKeyDown={handleSearchKeyDown} onSearchClick={handleSearchClick} />, [handleSearchChange, handleSearchKeyDown, handleSearchClick]);

  return (
    <TextField
      ref={selectRef}
      key={id}
      label={label}
      size="small"
      select
      value={value}
      disabled={disabled}
      fullWidth
      slotProps={{
        select: {
          open: isOpen,
          onOpen: handleMenuOpen,
          onClose: handleMenuClose,
          onChange: handleChange,
          renderValue: () => selectedDisplayValue,
          MenuProps: {
            disableAutoFocusItem: true,
            autoFocus: false,
            PaperProps: {
              sx: {
                maxHeight: 400,
                minWidth: 280,
                overflow: "hidden",
                "& .MuiList-root": {
                  py: 0,
                  maxHeight: 400,
                  overflowY: "auto",
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
                },
              },
            },
            MenuListProps: {
              subheader: searchHeader,
              sx: {
                maxHeight: 400,
                overflowY: "auto",
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
              },
            },
          },
        },
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          backgroundColor: "var(--card)",
          color: "var(--foreground)",
          borderRadius: "8px",
          fontSize: "0.875rem",
          transition: "all 0.2s ease",
          "& fieldset": {
            borderColor: "var(--border)",
          },
          "&:hover fieldset": {
            borderColor: "var(--muted-foreground)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "var(--primary)",
          },
        },
        "& .MuiInputLabel-root": {
          color: "var(--muted-foreground)",
          fontSize: "0.875rem",
        },
      }}
    >
      {filteredOptions.length > 0 ? (
        filteredOptions.map((option, index) => {
          const { name, badge } = parseLabel(option.label);
          return (
            <MenuItem
              key={option.value}
              value={option.value}
              ref={(el) => {
                if (el) {
                  menuItemRefs.current.set(index, el);
                } else {
                  menuItemRefs.current.delete(index);
                }
              }}
              selected={value === option.value}
              onMouseEnter={() => setHighlightedIndex(index)}
              sx={{
                fontSize: "0.875rem",
                py: 1.25,
                px: 2,
                backgroundColor: highlightedIndex === index ? "var(--accent)" : "transparent",
                transition: "background-color 0.15s ease",
                "&.Mui-selected": {
                  backgroundColor: highlightedIndex === index ? "color-mix(in srgb, var(--primary) 20%, transparent)" : "color-mix(in srgb, var(--primary) 14%, transparent)",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
                  },
                },
                "&:hover": {
                  backgroundColor: highlightedIndex === index ? "var(--accent)" : "color-mix(in srgb, var(--accent) 70%, transparent)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1 }}>
                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    color: "var(--foreground)",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </Typography>
                {badge && (
                  <Chip
                    label={badge}
                    size="small"
                    sx={{
                      height: "20px",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      backgroundColor: "var(--accent)",
                      color: "var(--muted-foreground)",
                      border: "1px solid var(--border)",
                      "& .MuiChip-label": {
                        px: 1,
                      },
                    }}
                  />
                )}
              </Box>
            </MenuItem>
          );
        })
      ) : (
        <MenuItem disabled value="__no_results" sx={{ py: 2, justifyContent: "center" }}>
          <Typography variant="body2" sx={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
            {searchQuery ? "No results found" : options.length === 0 ? "Tidak ada data tersedia" : "No results found"}
          </Typography>
        </MenuItem>
      )}
    </TextField>
  );
}

export const FilterSelect = memo(FilterSelectComponent, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.label === nextProps.label &&
    prevProps.value === nextProps.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.options === nextProps.options &&
    prevProps.onChange === nextProps.onChange
  );
});

export default FilterSelect;
