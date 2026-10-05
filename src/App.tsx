import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./theme";
import AppRoutes from "./routes";
import { AlertSnackbar } from "@Signal/components/AlertSnackbar";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
        <AlertSnackbar />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
