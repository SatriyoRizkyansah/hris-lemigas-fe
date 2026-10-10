import { TextField, InputAdornment } from "@mui/material";

export const formatRupiahDisplay = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "";
  const numStr = String(value).replace(/\D/g, "");
  if (!numStr) return "";
  const num = Number(numStr);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("id-ID");
};

export const parseRupiah = (formatted: string): number => {
  const digits = formatted.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

type RupiahFieldProps = {
  label: string;
  value: number | string | null | undefined;
  onChange: (num: number, raw: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function RupiahField({ label, value, onChange, required, disabled, placeholder }: RupiahFieldProps) {
  const display = formatRupiahDisplay(value);
  return (
    <TextField
      label={label}
      size="small"
      fullWidth
      required={required}
      disabled={disabled}
      placeholder={placeholder ?? "0"}
      value={display}
      onChange={(e) => {
        const raw = e.target.value;
        // allow empty
        if (raw === "") {
          onChange(0, "");
          return;
        }
        const num = parseRupiah(raw);
        onChange(num, raw);
      }}
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
        },
      }}
      inputProps={{ inputMode: "numeric" }}
    />
  );
}

export default RupiahField;
