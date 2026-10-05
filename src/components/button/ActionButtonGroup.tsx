import { Box } from "@mui/material";
import type { ReactNode } from "react";

interface ActionButtonGroupProps {
  children: ReactNode;
  gap?: number;
}

/**
 * Container untuk group action buttons dengan spacing yang konsisten
 * 
 * @example
 * ```tsx
 * <ActionButtonGroup>
 *   <ActionButton variant="edit" title="Edit" icon={<EditIcon />} onClick={handleEdit} />
 *   <ActionButton variant="delete" title="Hapus" icon={<DeleteIcon />} onClick={handleDelete} />
 *   <ActionMenuButton items={menuItems} />
 * </ActionButtonGroup>
 * ```
 */
export function ActionButtonGroup({ children, gap = 0.5 }: ActionButtonGroupProps) {
  return (
    <Box sx={{ display: "flex", gap, justifyContent: "center", alignItems: "center" }}>
      {children}
    </Box>
  );
}

export default ActionButtonGroup;
