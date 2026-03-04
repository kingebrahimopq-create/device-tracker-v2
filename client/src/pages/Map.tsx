import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Wifi, WifiOff, Wrench } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

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

export default function Map() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);

  // Fetch devices
  const { data: devices, isLoading: devicesLoading } = trpc.device.list.useQuery();

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

  const devicesWithLocation = (devices || []).filter(
    (d: any) => d.latitude && d.longitude
  );

  const filteredDevices = devicesWithLocation.filter((device: any) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">خريطة الأجهزة</h1>
          <p className="text-muted-foreground mt-1">عرض مواقع الأجهزة على الخريطة</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>الخريطة التفاعلية</CardTitle>
                <CardDescription>
                  {devicesWithLocation.length} جهاز لديه موقع محدد
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      سيتم دعم خريطة Google Maps قريباً
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      يمكنك عرض قائمة الأجهزة بمواقعها في الجانب الأيسر
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Devices List */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">الأجهزة</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ابحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>

                {/* Devices List */}
                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredDevices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {devicesWithLocation.length === 0
                        ? "لا توجد أجهزة بمواقع محددة"
                        : "لم يتم العثور على أجهزة"}
                    </p>
                  ) : (
                    filteredDevices.map((device: any) => {
                      const statusInfo = statusConfig[device.status as DeviceStatus];
                      return (
                        <div
                          key={device.id}
                          onClick={() => setSelectedDevice(device.id)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedDevice === device.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-medium text-sm">{device.name}</p>
                            <Badge className={statusInfo?.color} variant="outline">
                              {statusInfo?.icon}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            📍 {device.location || "موقع غير محدد"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {device.latitude}, {device.longitude}
                          </p>
                          <Link href={`/devices/${device.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full mt-2 h-7 text-xs"
                            >
                              عرض التفاصيل
                            </Button>
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>معلومات الخريطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">إجمالي الأجهزة</h3>
                <p className="text-3xl font-bold">{devices?.length || 0}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">أجهزة بمواقع</h3>
                <p className="text-3xl font-bold text-green-600">{devicesWithLocation.length}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">بدون موقع</h3>
                <p className="text-3xl font-bold text-red-600">
                  {(devices?.length || 0) - devicesWithLocation.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
