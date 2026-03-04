import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, Wifi, WifiOff, Wrench, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

type DeviceStatus = "connected" | "disconnected" | "maintenance" | "inactive";

const statusConfig: Record<DeviceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  connected: {
    label: "متصل",
    color: "bg-green-100 text-green-800",
    icon: <Wifi className="h-4 w-4" />,
  },
  disconnected: {
    label: "غير متصل",
    color: "bg-red-100 text-red-800",
    icon: <WifiOff className="h-4 w-4" />,
  },
  maintenance: {
    label: "صيانة",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Wrench className="h-4 w-4" />,
  },
  inactive: {
    label: "معطل",
    color: "bg-gray-100 text-gray-800",
    icon: <WifiOff className="h-4 w-4" />,
  },
};

export default function Devices() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Fetch devices
  const { data: devices, isLoading: devicesLoading, refetch } = trpc.device.list.useQuery();
  const deleteDeviceMutation = trpc.device.delete.useMutation();

  if (loading || devicesLoading) {
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

  const handleDeleteDevice = async (deviceId: number) => {
    try {
      await deleteDeviceMutation.mutateAsync({ id: deviceId });
      toast.success("تم حذف الجهاز بنجاح");
      setDeleteConfirm(null);
      refetch();
    } catch (error) {
      toast.error("فشل حذف الجهاز");
    }
  };

  const filteredDevices = (devices || []).filter((device: any) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة الأجهزة</h1>
            <p className="text-muted-foreground mt-1">إدارة وتتبع جميع الأجهزة المتصلة</p>
          </div>
          <Link href="/devices/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              جهاز جديد
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن جهاز..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Devices Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الأجهزة ({filteredDevices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDevices.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {devices?.length === 0 ? "لا توجد أجهزة مسجلة" : "لم يتم العثور على أجهزة"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>معرف الجهاز</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الموقع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>عنوان IP</TableHead>
                      <TableHead>آخر رؤية</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDevices.map((device: any) => {
                      const statusInfo = statusConfig[device.status as DeviceStatus];
                      return (
                        <TableRow key={device.id}>
                          <TableCell className="font-mono text-sm">{device.deviceId}</TableCell>
                          <TableCell className="font-medium">{device.name}</TableCell>
                          <TableCell>{device.location || "-"}</TableCell>
                          <TableCell>
                            <Badge className={statusInfo?.color}>
                              {statusInfo?.icon}
                              <span className="ml-1">{statusInfo?.label}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{device.ipAddress || "-"}</TableCell>
                          <TableCell className="text-sm">
                            {device.lastSeen
                              ? new Date(device.lastSeen).toLocaleString("ar-SA")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/devices/${device.id}`)}
                              >
                                عرض
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/devices/${device.id}/edit`)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteConfirm(device.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogTitle>حذف الجهاز</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا الجهاز؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
            <div className="flex gap-4 justify-end">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirm && handleDeleteDevice(deleteConfirm)}
                className="bg-red-600 hover:bg-red-700"
              >
                حذف
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
