import { Box, Typography } from "@mui/material";
import "./css/DataEmpty.css";

interface DataEmptyProps {
  title?: string;
  description?: string;
}

export function DataEmpty({ title = "Data belum tersedia", description }: DataEmptyProps) {
  return (
    <Box className="data-empty" role="status" aria-live="polite">
      <div className="data-empty__loader" aria-hidden="true">
        <div className="data-empty__juggler">
          <div className="data-empty__head" />
          <div className="data-empty__body" />
          <div className="data-empty__arm data-empty__right-arm" />
          <div className="data-empty__arm data-empty__left-arm" />
        </div>
        <div className="data-empty__ball data-empty__ball-1" />
        <div className="data-empty__ball data-empty__ball-2" />
        <div className="data-empty__ball data-empty__ball-3" />
      </div>

      <Box className="data-empty__text">
        <Typography variant="caption" sx={{ fontWeight: 100, color: "var(--foreground)", mb: description ? 0.5 : 0 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default DataEmpty;
