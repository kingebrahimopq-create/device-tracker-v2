import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, FileText, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";

type ReportType = "devices" | "activities" | "alerts" | "users";
type DateRange = "7d" | "30d" | "90d" | "custom";

export default function Reports() {
  const { user, loading } = useAuth();
  const [reportType, setReportType] = useState<ReportType>("devices");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch statistics
  const { data: deviceStats } = trpc.stats.devices.useQuery();
  const { data: alertStats } = trpc.stats.alerts.useQuery();
  const { data: activityLogs } = trpc.log.list.useQuery({ limit: 1000, offset: 0 });

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

  const handleExportCSV = () => {
    if (reportType === "devices" && deviceStats) {
      const csv = [
        ["الإحصائية", "القيمة"],
        ["إجمالي الأجهزة", deviceStats.total],
        ["أجهزة متصلة", deviceStats.connected],
        ["أجهزة غير متصلة", deviceStats.disconnected],
        ["أجهزة في صيانة", deviceStats.maintenance],
        ["أجهزة معطلة", deviceStats.inactive],
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `devices-report-${new Date().toISOString().split("T")[0]}.csv`);
      link.click();
      toast.success("تم تصدير التقرير بنجاح");
    } else if (reportType === "activities" && activityLogs) {
      const csv = [
        ["التاريخ", "المستخدم", "الإجراء", "الوصف", "الجهاز"],
        ...activityLogs.map((log: any) => [
          new Date(log.createdAt).toLocaleString("ar-SA"),
          log.userId,
          log.actionType,
          log.description || "",
          log.deviceId || "",
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `activities-report-${new Date().toISOString().split("T")[0]}.csv`);
      link.click();
      toast.success("تم تصدير التقرير بنجاح");
    }
  };

  // Prepare chart data
  const deviceStatusData = deviceStats
    ? [
        { name: "متصل", value: deviceStats.connected, fill: "#10b981" },
        { name: "غير متصل", value: deviceStats.disconnected, fill: "#ef4444" },
        { name: "صيانة", value: deviceStats.maintenance, fill: "#f59e0b" },
        { name: "معطل", value: deviceStats.inactive, fill: "#6b7280" },
      ]
    : [];

  const alertSeverityData = alertStats
    ? [
        { name: "حرج", value: alertStats.critical, fill: "#dc2626" },
        { name: "عالي", value: alertStats.high, fill: "#f97316" },
        { name: "متوسط", value: alertStats.medium, fill: "#eab308" },
        { name: "منخفض", value: alertStats.low, fill: "#3b82f6" },
      ]
    : [];

  const activityTypeData = activityLogs
    ? Object.entries(
        (activityLogs as any[]).reduce(
          (acc, log) => {
            acc[log.actionType] = (acc[log.actionType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      ).map(([type, count]) => ({
        name: type,
        value: count,
      }))
    : [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">التقارير</h1>
          <p className="text-muted-foreground mt-1">عرض وتصدير التقارير والإحصائيات</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">خيارات التقرير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">نوع التقرير</label>
                <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="devices">الأجهزة</SelectItem>
                    <SelectItem value="activities">الأنشطة</SelectItem>
                    <SelectItem value="alerts">التنبيهات</SelectItem>
                    <SelectItem value="users">المستخدمون</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">نطاق التاريخ</label>
                <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">آخر 7 أيام</SelectItem>
                    <SelectItem value="30d">آخر 30 يوم</SelectItem>
                    <SelectItem value="90d">آخر 90 يوم</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === "custom" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">من التاريخ</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">إلى التاريخ</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex items-end">
                <Button onClick={handleExportCSV} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  تصدير CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Content */}
        {reportType === "devices" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الأجهزة</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{deviceStats?.total || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">متصلة</CardTitle>
                  <Badge className="bg-green-100 text-green-800">
                    {deviceStats?.connected || 0}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {deviceStats?.total
                      ? `${Math.round(((deviceStats.connected || 0) / deviceStats.total) * 100)}%`
                      : "0%"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">غير متصلة</CardTitle>
                  <Badge className="bg-red-100 text-red-800">
                    {deviceStats?.disconnected || 0}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {deviceStats?.total
                      ? `${Math.round(((deviceStats.disconnected || 0) / deviceStats.total) * 100)}%`
                      : "0%"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">في الصيانة</CardTitle>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {deviceStats?.maintenance || 0}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {deviceStats?.total
                      ? `${Math.round(((deviceStats.maintenance || 0) / deviceStats.total) * 100)}%`
                      : "0%"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>توزيع حالة الأجهزة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={deviceStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} جهاز`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>توزيع خطورة التنبيهات</CardTitle>
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
          </div>
        )}

        {reportType === "activities" && (
          <Card>
            <CardHeader>
              <CardTitle>توزيع أنواع الأنشطة</CardTitle>
              <CardDescription>عدد العمليات حسب النوع</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={activityTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value} عملية`} />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="عدد العمليات" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {reportType === "alerts" && (
          <Card>
            <CardHeader>
              <CardTitle>ملخص التنبيهات</CardTitle>
              <CardDescription>إحصائيات التنبيهات الحالية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">التنبيهات حسب الخطورة</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">حرج</span>
                      <Badge className="bg-red-100 text-red-800">{alertStats?.critical || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">عالي</span>
                      <Badge className="bg-orange-100 text-orange-800">{alertStats?.high || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">متوسط</span>
                      <Badge className="bg-yellow-100 text-yellow-800">{alertStats?.medium || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">منخفض</span>
                      <Badge className="bg-blue-100 text-blue-800">{alertStats?.low || 0}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">حالة التنبيهات</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">غير محلولة</span>
                      <Badge className="bg-red-100 text-red-800">{alertStats?.unresolved || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">محلولة</span>
                      <Badge className="bg-green-100 text-green-800">{alertStats?.resolved || 0}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
