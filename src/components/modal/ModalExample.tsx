import { Box, Button, Stack, Chip, Avatar, TextField, MenuItem, ToggleButtonGroup, ToggleButton } from "@mui/material";
import Modal, { type ModalSection } from "./Modal";
import { useState } from "react";

const ROLE_TAGS = ["Angular", "Javascript", "Tailwind"];

const durationOptions = ["30 min", "60 min", "90 min"];

export function ModalExample() {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState<string>(durationOptions[0]);

  const sections: ModalSection[] = [
    {
      title: "Interview Details",
      description: "Senior Frontend Angular Developer",
      content: (
        <Stack spacing={2}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Avatar sx={{ width: 48, height: 48, borderRadius: "1rem", fontWeight: 600 }}>DF</Avatar>
            <Box>
              <Box sx={{ fontWeight: 600, color: "var(--foreground)" }}>Diffco LLC</Box>
              <Box sx={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>Senior Frontend Angular Developer</Box>
            </Box>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {ROLE_TAGS.map((tag) => (
              <Chip key={tag} label={tag} size="small" sx={{ borderRadius: "var(--radius-full)", backgroundColor: "var(--muted)", color: "var(--foreground)" }} />
            ))}
            <Chip label="Remote" size="small" sx={{ borderRadius: "var(--radius-full)" }} />
          </Stack>
          <TextField label="Interview Title" fullWidth size="small" defaultValue="UX Designer Interview - Jake and Aspect Team" />
          <TextField label="Meeting URL" fullWidth size="small" defaultValue="https://us04web.zoom.us/j/75806772593?pwd=bD098d8" />
        </Stack>
      ),
    },
    {
      title: "Interview date & time",
      content: (
        <Stack spacing={2}>
          <TextField label="Pick a slot" select fullWidth size="small">
            <MenuItem value="slot-1">Tomorrow - 09:00 AM</MenuItem>
            <MenuItem value="slot-2">Tomorrow - 01:00 PM</MenuItem>
          </TextField>
          <Box>
            <Box sx={{ mb: 1, fontWeight: 600, color: "var(--foreground)" }}>Duration</Box>
            <ToggleButtonGroup exclusive value={duration} onChange={(_, value) => value && setDuration(value)}>
              {durationOptions.map((option) => (
                <ToggleButton key={option} value={option} sx={{ borderRadius: "var(--radius)", textTransform: "none" }}>
                  {option}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Stack>
      ),
    },
    {
      title: "Prospect Details",
      content: (
        <Stack spacing={2}>
          <TextField label="Name" fullWidth size="small" defaultValue="Jack Sparrow" />
          <TextField label="Email Address" fullWidth size="small" defaultValue="jacksparrow@gmail.com" />
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)} sx={{ textTransform: "none", borderRadius: "var(--radius)" }}>
        Open Example Modal
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Schedule new interview"
        description="Fill in the correct information for this interview."
        sections={sections}
        actions={[
          {
            label: "Cancel",
            variant: "ghost",
            onClick: () => setOpen(false),
          },
          {
            label: "Schedule Interview",
            variant: "primary",
            onClick: () => setOpen(false),
          },
        ]}
      />
    </>
  );
}

export default ModalExample;
