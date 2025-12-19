import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { UsersManager } from "@/components/admin/UsersManager";
import { useUserRole } from "@/hooks/useUserRole";

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useUserRole();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <UsersManager />
    </AdminLayout>
  );
};

export default AdminUsers;