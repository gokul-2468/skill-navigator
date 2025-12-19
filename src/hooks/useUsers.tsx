import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  login_type: string | null;
  created_at: string;
}

export interface UserWithRole extends UserProfile {
  app_role?: "admin" | "moderator" | "student";
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setIsLoading(false);
      return;
    }

    // Fetch roles for all users
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    if (rolesError && rolesError.code !== "PGRST116") {
      console.error("Error fetching roles:", rolesError);
    }

    // Combine profiles with roles
    const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
      const userRole = roles?.find((r) => r.user_id === profile.user_id);
      return {
        ...profile,
        app_role: (userRole?.role as "admin" | "moderator" | "student") || "student",
      };
    });

    setUsers(usersWithRoles);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    // Subscribe to realtime updates for profiles
    const profilesChannel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          console.log("Profiles updated");
          fetchUsers();
        }
      )
      .subscribe();

    // Subscribe to realtime updates for user_roles
    const rolesChannel = supabase
      .channel("roles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => {
          console.log("Roles updated");
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, []);

  const updateUserRole = async (userId: string, role: "admin" | "moderator" | "student") => {
    // First check if user already has a role
    const { data: existing } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Update existing role
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (error) throw error;
    } else {
      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;
    }
  };

  const deleteUser = async (userId: string, profileId: string) => {
    // Delete from profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (profileError) throw profileError;

    // Delete role if exists
    await supabase.from("user_roles").delete().eq("user_id", userId);
  };

  return {
    users,
    isLoading,
    updateUserRole,
    deleteUser,
    refetch: fetchUsers,
  };
};