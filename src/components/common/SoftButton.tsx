import React from "react";
import { Button, type ButtonProps } from "@mui/material";

export type SoftButtonProps = ButtonProps;

const baseStyles = {
  borderRadius: "10px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.95rem",
  px: 2,
  py: 0.65,

  backgroundColor: "#fdfdfd", // off-white
  color: "#18181b", // soft black
  border: "1px solid #e4e4e7", // zinc-200

  boxShadow: "0 10px 25px rgba(24, 24, 27, 0.10)",
  transition: "transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease",

  "&:hover": {
    backgroundColor: "#f4f4f5", // zinc-100
    boxShadow: "0 14px 32px rgba(24, 24, 27, 0.14)",
    transform: "translateY(-1px)",
  },

  "&:active": {
    transform: "translateY(0)",
    boxShadow: "0 8px 18px rgba(24, 24, 27, 0.16)",
  },
};

export const SoftButton = React.forwardRef<HTMLButtonElement, SoftButtonProps>(({ sx, ...props }, ref) => {
  const computedSx = Array.isArray(sx) ? [baseStyles, ...sx] : [baseStyles, sx];
  return <Button ref={ref} disableElevation {...props} sx={computedSx} />;
});

SoftButton.displayName = "SoftButton";

export default SoftButton;
