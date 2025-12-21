import { useState } from "react";
import { Search, Shield, UserCheck, UserX, MoreVertical, Mail, Calendar, ClipboardCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUsers, UserWithRole } from "@/hooks/useUsers";
import { useTestResults, TestResultWithUser } from "@/hooks/useTestResults";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const UsersManager = () => {
  const { users, isLoading: usersLoading, updateUserRole, deleteUser } = useUsers();
  const { testResults, usersWithTests, totalTests, uniqueTestTakers, avgAccuracy, isLoading: resultsLoading } = useTestResults();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [testFilter, setTestFilter] = useState<string>("all");

  const handleRoleChange = async (userId: string, role: "admin" | "moderator" | "student") => {
    try {
      await updateUserRole(userId, role);
      toast({ title: `User role updated to ${role}` });
    } catch (error) {
      toast({ title: "Error updating role", variant: "destructive" });
    }
  };

  const handleDelete = async (userId: string, profileId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;

    try {
      await deleteUser(userId, profileId);
      toast({ title: "User removed successfully" });
    } catch (error) {
      toast({ title: "Error removing user", variant: "destructive" });
    }
  };

  // Get test count for each user
  const getUserTestCount = (userId: string) => {
    return testResults.filter(r => r.user_id === userId).length;
  };

  // Get latest test result for a user
  const getLatestTestResult = (userId: string): TestResultWithUser | undefined => {
    return testResults.find(r => r.user_id === userId);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.app_role === roleFilter;
    
    // Filter by test attendance
    const hasTests = getUserTestCount(user.user_id) > 0;
    const matchesTest = testFilter === "all" || 
      (testFilter === "attended" && hasTests) || 
      (testFilter === "not-attended" && !hasTests);
    
    return matchesSearch && matchesRole && matchesTest;
  });

  const roleColors = {
    admin: "bg-destructive/10 text-destructive border-destructive/20",
    moderator: "bg-warning/10 text-warning border-warning/20",
    student: "bg-primary/10 text-primary border-primary/20",
  };

  const roleIcons = {
    admin: Shield,
    moderator: UserCheck,
    student: UserX,
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "??";
  };

  const isLoading = usersLoading || resultsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and view test attendance</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>Realtime updates enabled</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-display font-bold">{users.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Test Takers</p>
          <p className="text-2xl font-display font-bold text-success">{uniqueTestTakers}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Tests Taken</p>
          <p className="text-2xl font-display font-bold text-primary">{totalTests}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Avg Accuracy</p>
          <p className="text-2xl font-display font-bold text-warning">{avgAccuracy}%</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="test-results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <Select value={testFilter} onValueChange={setTestFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Test Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="attended">Attended Test</SelectItem>
                <SelectItem value="not-attended">Not Attended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border p-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Role</th>
                      <th className="text-left p-4 font-medium">Tests Taken</th>
                      <th className="text-left p-4 font-medium">Last Score</th>
                      <th className="text-left p-4 font-medium">Joined</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => {
                      const RoleIcon = roleIcons[user.app_role || "student"];
                      const testCount = getUserTestCount(user.user_id);
                      const latestResult = getLatestTestResult(user.user_id);
                      
                      return (
                        <tr
                          key={user.id}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                  {getInitials(user.name, user.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name || "Unnamed"}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "capitalize gap-1",
                                roleColors[user.app_role || "student"]
                              )}
                            >
                              <RoleIcon className="w-3 h-3" />
                              {user.app_role || "student"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
                              <span className={testCount > 0 ? "text-success font-medium" : "text-muted-foreground"}>
                                {testCount} {testCount === 1 ? "test" : "tests"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            {latestResult ? (
                              <div className="flex items-center gap-2">
                                <TrendingUp className={cn("w-4 h-4", 
                                  latestResult.accuracy >= 70 ? "text-success" : 
                                  latestResult.accuracy >= 50 ? "text-warning" : "text-destructive"
                                )} />
                                <span className={cn("font-medium",
                                  latestResult.accuracy >= 70 ? "text-success" : 
                                  latestResult.accuracy >= 50 ? "text-warning" : "text-destructive"
                                )}>
                                  {latestResult.accuracy}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(user.user_id, "admin")}
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(user.user_id, "moderator")}
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Make Moderator
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(user.user_id, "student")}
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Make Student
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDelete(user.user_id, user.id)}
                                >
                                  Remove User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="test-results" className="space-y-4">
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Score</th>
                    <th className="text-left p-4 font-medium">Accuracy</th>
                    <th className="text-left p-4 font-medium">Weak Areas</th>
                    <th className="text-left p-4 font-medium">Strong Areas</th>
                    <th className="text-left p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr
                      key={result.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                              {getInitials(result.user_name || null, result.user_email || null)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{result.user_name || "Unnamed"}</p>
                            <p className="text-xs text-muted-foreground">{result.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{result.score}/{result.total_questions}</span>
                      </td>
                      <td className="p-4">
                        <Badge className={cn(
                          result.accuracy >= 70 ? "bg-success/20 text-success border-success/30" :
                          result.accuracy >= 50 ? "bg-warning/20 text-warning border-warning/30" :
                          "bg-destructive/20 text-destructive border-destructive/30"
                        )}>
                          {result.accuracy}%
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {result.weak_topics && result.weak_topics.length > 0 ? (
                            result.weak_topics.slice(0, 2).map((topic, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                                {topic}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {result.strong_topics && result.strong_topics.length > 0 ? (
                            result.strong_topics.slice(0, 2).map((topic, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                                {topic}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(result.created_at).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {testResults.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No test results yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
