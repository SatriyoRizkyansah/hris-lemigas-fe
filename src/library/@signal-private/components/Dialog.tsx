/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dialog, Zoom } from "@mui/material";
import { forwardRef } from "react";
import { type TransitionProps } from "@mui/material/transitions";
import { useSignalValue } from "@Signal/hooks";
import { dialog_signal } from "@Signal/use-signal/dialog-init-signal";
import { close_dialog } from "@Signal/use-signal/dialog-method-signal";
import { show_alert_snackbar } from "@Signal/use-signal/snackbar_signal";
import { doubleClickAction } from "src/components/common/double-click";

const transition_component = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Zoom timeout={100} ref={ref} {...props} />;
});

export default function SignalDialog() {
  const dialogState = useSignalValue(dialog_signal);

  const handleClose = (_event: any, reason?: string) => {
    if (reason === "escapeKeyDown") return;

    if (dialogState.should_disabled_clickaway_close) return;

    if (dialogState.should_close_for_one_clickaway) {
      close_dialog();
    } else {
      doubleClickAction(
        () => {
          show_alert_snackbar({
            severity: "error",
            message: "Double klik untuk menutup dialog",
          });
        },
        () => {
          close_dialog();
        },
      );
    }
  };

  return (
    <Dialog
      id="PreactSignalDialog"
      key={"PreactSignalDialog"}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          close_dialog();
        }
      }}
      onClose={handleClose}
      TransitionComponent={transition_component}
      scroll="body"
      {...dialogState.dialog_props}
      open={Boolean(dialogState.open)}
    >
      {dialogState.render_component || <></>}
    </Dialog>
  );
}
