import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

const severityConfig: Record<AlertSeverity, { label: string; color: string; icon: React.ReactNode }> = {
  low: { label: 'منخفضة', color: 'bg-blue-100 text-blue-800', icon: <AlertCircle className="h-4 w-4" /> },
  medium: { label: 'متوسطة', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="h-4 w-4" /> },
  high: { label: 'عالية', color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="h-4 w-4" /> },
  critical: { label: 'حرجة', color: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-4 w-4" /> },
};

export default function Alerts() {
  const { user, loading } = useAuth();
  const [filterResolved, setFilterResolved] = useState(false);

  const { data: alerts, isLoading: alertsLoading, refetch } = trpc.alert.getUnresolved.useQuery();
  const resolveAlertMutation = trpc.alert.resolve.useMutation();

  if (loading || alertsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">جاري التحميل...</p>
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

  const handleResolveAlert = async (alertId: number) => {
    try {
      await resolveAlertMutation.mutateAsync({ alertId });
      refetch();
    } catch (error) {
      console.error('فشل حل التنبيه:', error);
    }
  };

  const filteredAlerts = (alerts || []).filter((alert: any) => {
    if (filterResolved) return alert.resolved;
    return !alert.resolved;
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">التنبيهات</h1>
          <p className="text-muted-foreground">إدارة التنبيهات والأحداث الهامة</p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button
            variant={filterResolved ? 'outline' : 'default'}
            onClick={() => setFilterResolved(false)}
          >
            التنبيهات النشطة ({(alerts || []).filter((a: any) => !a.resolved).length})
          </Button>
          <Button
            variant={filterResolved ? 'default' : 'outline'}
            onClick={() => setFilterResolved(true)}
          >
            التنبيهات المحلولة ({(alerts || []).filter((a: any) => a.resolved).length})
          </Button>
        </div>

        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {filterResolved ? 'لا توجد تنبيهات محلولة' : 'لا توجد تنبيهات نشطة'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert: any) => {
              const severityInfo = severityConfig[alert.severity as AlertSeverity];
              return (
                <Card key={alert.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={severityInfo?.color}>
                            {severityInfo?.icon}
                            <span className="ml-1">{severityInfo?.label}</span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString('ar-SA')}
                          </span>
                        </div>
                        <p className="text-lg font-semibold mb-2">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">
                          الجهاز: {alert.deviceId || 'غير محدد'}
                        </p>
                      </div>
                      {!alert.resolved && (
                        <Button
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                          className="gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          حل
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
