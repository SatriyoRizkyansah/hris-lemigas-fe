import { Snackbar, Alert } from '@mui/material'
import { Box } from '@mui/material'
import { useSignalValue } from '@Signal/hooks'
import { alert_signal } from '@Signal/use-signal/snackbar_signal'

export function AlertSnackbar() {
  const alertValue = useSignalValue(alert_signal)

  const handleClose = () => {
    alert_signal.value = {
      ...alert_signal.value,
      open: false,
    }
  }

  const getTextColor = () => {
    switch (alertValue.severity) {
      case 'warning':
        return 'inherit' // putih biar kontras
      case 'success':
      case 'error':
      case 'info':
      default:
        return '#fff'
    }
  }

  return (
    <Snackbar
      open={alertValue.open}
      autoHideDuration={alertValue.autoHideDuration}
      onClose={handleClose}
      anchorOrigin={alertValue.anchorOrigin}
    >
      <Box>
        <Alert
          onClose={handleClose}
          severity={alertValue.severity}
          variant={alertValue.variant}
          sx={{
            color: getTextColor(),
            '& .MuiAlert-icon': {
              color: getTextColor(), // ikon ikut putih juga
            },
          }}
        >
          {alertValue.message}
        </Alert>
      </Box>
    </Snackbar>
  )
}
