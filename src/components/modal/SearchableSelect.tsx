import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, ListSubheader, Typography, Box, Chip, CircularProgress } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { Search as SearchIcon } from "@mui/icons-material";

export interface SearchableSelectOption {
  value: string;
  label: string;
  badge?: string;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  loading?: boolean;
  size?: "small" | "medium";
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
}

const SearchHeader = memo(({ onSearchChange, onSearchKeyDown, onSearchClick }: { onSearchChange: (value: string) => void; onSearchKeyDown: (e: React.KeyboardEvent) => void; onSearchClick: (e: React.MouseEvent) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
        placeholder="Cari..."
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

function SearchableSelectComponent({ label, value, options, onChange, disabled = false, required = false, placeholder, loading = false, size = "small", fullWidth = true, error = false, helperText }: SearchableSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const menuItemRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  // Parse label to extract name and badge
  const parseLabel = useCallback((labelText: string) => {
    const parts = labelText.split("|");
    if (parts.length === 2) {
      return { name: parts[0].trim(), badge: parts[1].trim() };
    }
    return { name: labelText, badge: null };
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase();
    return options.filter((option) => {
      const { name, badge } = parseLabel(option.label);
      const optionBadge = option.badge || badge;
      return name.toLowerCase().includes(query) || (optionBadge && optionBadge.toLowerCase().includes(query));
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
    setSearchQuery("");
    setHighlightedIndex(0);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  }, []);

  const handleChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      onChange(event.target.value);
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

  const handleSearchChange = useCallback((searchValue: string) => {
    setSearchQuery(searchValue);
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
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  const selectedDisplayValue = useMemo(() => {
    if (!selectedOption) return "";
    const { name } = parseLabel(selectedOption.label);
    return name;
  }, [selectedOption, parseLabel]);

  const searchHeader = useMemo(() => <SearchHeader onSearchChange={handleSearchChange} onSearchKeyDown={handleSearchKeyDown} onSearchClick={handleSearchClick} />, [handleSearchChange, handleSearchKeyDown, handleSearchClick]);

  const displayLabel = label;

  return (
    <FormControl fullWidth={fullWidth} size={size} disabled={disabled} error={error}>
      <InputLabel shrink={isOpen || Boolean(value)}>
        {label}
        {required && (
          <Box component="span" sx={{ color: "var(--danger, #dc2626)", ml: 0.5, fontWeight: 700 }}>
            *
          </Box>
        )}
      </InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        open={isOpen}
        onOpen={handleMenuOpen}
        onClose={handleMenuClose}
        label={displayLabel}
        displayEmpty
        renderValue={() => {
          if (loading) {
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                <Typography sx={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Loading...</Typography>
              </Box>
            );
          }
          return selectedDisplayValue || placeholder || "";
        }}
        MenuProps={{
          disableAutoFocusItem: true,
          autoFocus: false,
          PaperProps: {
            sx: {
              maxHeight: 400,
              minWidth: 280,
              overflow: "hidden",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--card)",
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
            subheader: options.length > 5 ? searchHeader : undefined,
            sx: {
              py: options.length > 5 ? 0 : 1,
              maxHeight: 400,
              overflowY: "auto",
            },
          },
        }}
        sx={{
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--border)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--muted-foreground)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--primary)",
          },
        }}
      >
        {loading ? (
          <MenuItem disabled>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          </MenuItem>
        ) : filteredOptions.length > 0 ? (
          filteredOptions.map((option, index) => {
            const { name, badge } = parseLabel(option.label);
            const optionBadge = option.badge || badge;
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
                selected={String(value) === String(option.value)}
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
                  {optionBadge && (
                    <Chip
                      label={optionBadge}
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
              {searchQuery ? "Tidak ada hasil" : options.length === 0 ? "Tidak ada data tersedia" : "Tidak ada hasil"}
            </Typography>
          </MenuItem>
        )}
      </Select>
      {helperText && (
        <Typography
          variant="caption"
          sx={{
            color: error ? "var(--destructive)" : "var(--muted-foreground)",
            mt: 0.5,
            ml: 1.75,
            fontSize: "0.75rem",
          }}
        >
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
}

export const SearchableSelect = memo(SearchableSelectComponent);

export default SearchableSelect;
