import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Edit2, MapPin, Wifi, WifiOff, Wrench, Clock, Network } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

interface DeviceDetailProps {
  params: {
    id: string;
  };
}

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

export default function DeviceDetail({ params }: DeviceDetailProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const deviceId = parseInt(params.id);

  // Fetch device data
  const { data: device, isLoading: deviceLoading } = trpc.device.get.useQuery({ id: deviceId });
  const { data: logs } = trpc.log.listByDevice.useQuery({ deviceId });
  const { data: permissions } = trpc.device.getPermissions.useQuery({ deviceId });

  if (loading || deviceLoading) {
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

  if (!device) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">الجهاز غير موجود</p>
      </div>
    );
  }

  const statusInfo = statusConfig[device.status as DeviceStatus];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/devices")}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">تفاصيل الجهاز</h1>
        </div>

        {/* Device Overview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{device.name}</CardTitle>
                <CardDescription className="mt-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm">{device.deviceId}</code>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge className={statusInfo?.color}>
                  {statusInfo?.icon}
                  <span className="ml-1">{statusInfo?.label}</span>
                </Badge>
                <Button size="sm" onClick={() => navigate(`/devices/${device.id}/edit`)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  تحرير
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">الوصف</h3>
                <p className="text-foreground">{device.description || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">الموقع</h3>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-foreground">{device.location || "-"}</p>
                </div>
              </div>
            </div>

            {/* Network Info */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Network className="h-4 w-4" />
                معلومات الشبكة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">عنوان IP</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {device.ipAddress || "-"}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عنوان MAC</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {device.macAddress || "-"}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الرقم التسلسلي</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {device.serialNumber || "-"}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إصدار البرنامج الثابت</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {device.firmwareVersion || "-"}
                  </code>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                المواعيد
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">تم الإنشاء</p>
                  <p className="text-foreground">
                    {new Date(device.createdAt).toLocaleString("ar-SA")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">آخر تحديث</p>
                  <p className="text-foreground">
                    {new Date(device.updatedAt).toLocaleString("ar-SA")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">آخر رؤية</p>
                  <p className="text-foreground">
                    {device.lastSeen ? new Date(device.lastSeen).toLocaleString("ar-SA") : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">آخر تغيير حالة</p>
                  <p className="text-foreground">
                    {new Date(device.lastStatusChange).toLocaleString("ar-SA")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="logs">سجل الأنشطة</TabsTrigger>
            <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
          </TabsList>

          {/* Activity Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>سجل الأنشطة</CardTitle>
                <CardDescription>جميع العمليات على هذا الجهاز</CardDescription>
              </CardHeader>
              <CardContent>
                {!logs || logs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">لا توجد سجلات نشاط</p>
                ) : (
                  <div className="space-y-4">
                    {logs.slice(0, 10).map((log: any) => (
                      <div key={log.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{log.description}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(log.createdAt).toLocaleString("ar-SA")}
                            </p>
                          </div>
                          <Badge variant="outline">{log.actionType}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>الصلاحيات</CardTitle>
                <CardDescription>المستخدمون الذين لديهم وصول إلى هذا الجهاز</CardDescription>
              </CardHeader>
              <CardContent>
                {!permissions || permissions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">لا توجد صلاحيات مخصصة</p>
                ) : (
                  <div className="space-y-4">
                    {permissions.map((perm: any) => (
                      <div key={perm.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">المستخدم: {perm.userId}</p>
                            <p className="text-sm text-muted-foreground">
                              منحت بواسطة: {perm.grantedBy}
                            </p>
                          </div>
                          <Badge>{perm.permission}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
