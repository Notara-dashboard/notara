import { Dashboard } from "@/components/dashboard";
import { ProtectedWorkspace } from "@/components/protected-workspace";
export default function Page() {
  return (
    <ProtectedWorkspace>
      <Dashboard />
    </ProtectedWorkspace>
  );
}
