import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle, Wifi, WifiOff, Wrench, Plus, Eye } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  // Fetch statistics
  const { data: deviceStats } = trpc.stats.devices.useQuery();
  const { data: alertStats } = trpc.stats.alerts.useQuery();
  const { data: notifications } = trpc.notification.unreadCount.useQuery();

  if (loading) {
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

  // Prepare chart data
  const deviceStatusData = deviceStats
    ? [
        { name: "متصل", value: deviceStats.connected, fill: "#10b981" },
        { name: "غير متصل", value: deviceStats.disconnected, fill: "#ef4444" },
        { name: "صيانة", value: deviceStats.maintenance, fill: "#f59e0b" },
      ]
    : [];

  const alertSeverityData = alertStats
    ? [
        { name: "حرج", value: alertStats.critical, fill: "#dc2626" },
        { name: "غير محلول", value: alertStats.unresolved, fill: "#f97316" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">لوحة التحكم</h1>
          <p className="text-muted-foreground">مرحباً بك {user.name || "المستخدم"}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Devices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الأجهزة</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deviceStats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">أجهزة مسجلة في النظام</p>
            </CardContent>
          </Card>

          {/* Connected Devices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أجهزة متصلة</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{deviceStats?.connected || 0}</div>
              <p className="text-xs text-muted-foreground">
                {deviceStats?.total ? `${Math.round(((deviceStats.connected || 0) / deviceStats.total) * 100)}%` : "0%"} من الأجهزة
              </p>
            </CardContent>
          </Card>

          {/* Disconnected Devices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أجهزة غير متصلة</CardTitle>
              <WifiOff className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{deviceStats?.disconnected || 0}</div>
              <p className="text-xs text-muted-foreground">تحتاج إلى فحص</p>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التنبيهات</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{alertStats?.unresolved || 0}</div>
              <p className="text-xs text-muted-foreground">تنبيهات غير محلولة</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Device Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>توزيع حالة الأجهزة</CardTitle>
              <CardDescription>توزيع الأجهزة حسب حالة الاتصال</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={deviceStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {deviceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} جهاز`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Alert Summary */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص التنبيهات</CardTitle>
              <CardDescription>حالة التنبيهات الحالية</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={alertSeverityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value} تنبيه`} />
                  <Bar dataKey="value" fill="#8884d8">
                    {alertSeverityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الإجراءات السريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/devices">
                <Button className="w-full justify-start" variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  عرض جميع الأجهزة
                </Button>
              </Link>
              <Link href="/devices/new">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  إضافة جهاز جديد
                </Button>
              </Link>
              <Link href="/alerts">
                <Button className="w-full justify-start" variant="outline">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  عرض التنبيهات
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">حالة النظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الخادم</span>
                <Badge className="bg-green-100 text-green-800">نشط</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">قاعدة البيانات</span>
                <Badge className="bg-green-100 text-green-800">متصلة</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الإشعارات</span>
                <Badge className={notifications?.count ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                  {notifications?.count || 0} جديدة
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>النشاط الأخير</CardTitle>
            <CardDescription>آخر العمليات في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-medium">تم إضافة جهاز جديد</p>
                  <p className="text-xs text-muted-foreground">منذ 5 دقائق</p>
                </div>
                <Badge variant="outline">إنشاء</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-medium">تم تحديث حالة الجهاز</p>
                  <p className="text-xs text-muted-foreground">منذ 15 دقيقة</p>
                </div>
                <Badge variant="outline">تحديث</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">تنبيه جديد</p>
                  <p className="text-xs text-muted-foreground">منذ 30 دقيقة</p>
                </div>
                <Badge variant="outline">تنبيه</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
