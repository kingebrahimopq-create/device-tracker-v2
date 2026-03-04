import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Shield, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";

type UserRole = "admin" | "manager" | "user";

const roleConfig: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
  admin: {
    label: "مسؤول",
    color: "bg-red-100 text-red-800",
    icon: <Shield className="h-4 w-4" />,
  },
  manager: {
    label: "مدير",
    color: "bg-blue-100 text-blue-800",
    icon: <Users className="h-4 w-4" />,
  },
  user: {
    label: "مستخدم",
    color: "bg-green-100 text-green-800",
    icon: <UserCheck className="h-4 w-4" />,
  },
};

export default function UserManagement() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [roleChangeUser, setRoleChangeUser] = useState<{ id: number; newRole: UserRole } | null>(null);

  // Fetch users
  const { data: users, isLoading: usersLoading, refetch } = trpc.user.list.useQuery();
  const updateRoleMutation = trpc.user.updateRole.useMutation();

  if (loading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">يجب تسجيل الدخول أولاً</p>
      </div>
    );
  }

  // Check if user is admin
  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">ليس لديك صلاحيات للوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  const handleRoleChange = async () => {
    if (!roleChangeUser) return;

    try {
      await updateRoleMutation.mutateAsync({
        userId: roleChangeUser.id,
        role: roleChangeUser.newRole,
      });
      toast.success("تم تحديث دور المستخدم بنجاح");
      setRoleChangeUser(null);
      refetch();
    } catch (error) {
      toast.error("فشل تحديث دور المستخدم");
    }
  };

  const filteredUsers = (users || []).filter((u: any) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground mt-1">إدارة المستخدمين والأدوار والصلاحيات</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأدوار</SelectItem>
              <SelectItem value="admin">مسؤول</SelectItem>
              <SelectItem value="manager">مدير</SelectItem>
              <SelectItem value="user">مستخدم</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>المستخدمون ({filteredUsers.length})</CardTitle>
            <CardDescription>قائمة جميع المستخدمين في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {users?.length === 0 ? "لا توجد مستخدمون" : "لم يتم العثور على مستخدمين"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>آخر تسجيل دخول</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u: any) => {
                      const roleInfo = roleConfig[u.role as UserRole];
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name || "-"}</TableCell>
                          <TableCell>{u.email || "-"}</TableCell>
                          <TableCell>
                            <Badge className={roleInfo?.color}>
                              {roleInfo?.icon}
                              <span className="ml-1">{roleInfo?.label}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{u.department || "-"}</TableCell>
                          <TableCell>{u.phone || "-"}</TableCell>
                          <TableCell className="text-sm">
                            {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleString("ar-SA") : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRoleChangeUser({ id: u.id, newRole: u.role })}
                            >
                              تغيير الدور
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Change Dialog */}
        <AlertDialog open={roleChangeUser !== null} onOpenChange={() => setRoleChangeUser(null)}>
          <AlertDialogContent>
            <AlertDialogTitle>تغيير دور المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              اختر الدور الجديد للمستخدم
            </AlertDialogDescription>
            <div className="my-4">
              <Select
                value={roleChangeUser?.newRole || ""}
                onValueChange={(value) =>
                  setRoleChangeUser(
                    roleChangeUser ? { ...roleChangeUser, newRole: value as UserRole } : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مسؤول</SelectItem>
                  <SelectItem value="manager">مدير</SelectItem>
                  <SelectItem value="user">مستخدم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4 justify-end">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleRoleChange}>
                تحديث
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
