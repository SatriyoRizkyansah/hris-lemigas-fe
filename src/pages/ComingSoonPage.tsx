import { Box } from "@mui/material";
import { DashboardLayout } from "../layouts";
import { ComingSoon } from "../components";

interface ComingSoonPageProps {
  title: string;
  description?: string;
  sectionTitle?: string;
}

export function ComingSoonPage({ title, description = "Fitur ini sedang dalam pengembangan dan akan segera hadir.", sectionTitle }: ComingSoonPageProps) {
  return (
    <DashboardLayout sectionTitle={sectionTitle} title={title}>
      <Box sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
        <ComingSoon title={title} description={description} />
      </Box>
    </DashboardLayout>
  );
}

export default ComingSoonPage;
