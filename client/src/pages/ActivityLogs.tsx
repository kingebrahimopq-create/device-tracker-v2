import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ActionType = 'create' | 'update' | 'delete' | 'status_change' | 'permission_change' | 'access' | 'alert' | 'other';

const actionConfig: Record<ActionType, { label: string; color: string }> = {
  create: { label: 'إنشاء', color: 'bg-blue-100 text-blue-800' },
  update: { label: 'تحديث', color: 'bg-green-100 text-green-800' },
  delete: { label: 'حذف', color: 'bg-red-100 text-red-800' },
  status_change: { label: 'تغيير الحالة', color: 'bg-yellow-100 text-yellow-800' },
  permission_change: { label: 'تغيير الصلاحيات', color: 'bg-purple-100 text-purple-800' },
  access: { label: 'وصول', color: 'bg-indigo-100 text-indigo-800' },
  alert: { label: 'تنبيه', color: 'bg-orange-100 text-orange-800' },
  other: { label: 'أخرى', color: 'bg-gray-100 text-gray-800' },
};

export default function ActivityLogs() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionType | 'all'>('all');

  const { data: logs, isLoading: logsLoading } = trpc.log.list.useQuery({
    limit: 100,
    offset: 0,
  });

  if (loading || logsLoading) {
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

  const filteredLogs = (logs || [])
    .filter((log: any) => {
      const matchesSearch =
        log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userId?.toString().includes(searchQuery);
      const matchesAction = actionFilter === 'all' || log.actionType === actionFilter;
      return matchesSearch && matchesAction;
    })
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleExportCSV = () => {
    const csv = [
      ['التاريخ', 'المستخدم', 'الإجراء', 'الوصف', 'الجهاز'],
      ...filteredLogs.map((log: any) => [
        new Date(log.createdAt).toLocaleString('ar-SA'),
        log.userId,
        actionConfig[log.actionType as ActionType]?.label || log.actionType,
        log.description || '',
        log.deviceId || '',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">سجل الأنشطة</h1>
            <p className="text-muted-foreground">تتبع جميع العمليات والتغييرات في النظام</p>
          </div>
          <Button onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير CSV
          </Button>
        </div>

        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في السجلات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">لا توجد سجلات</p>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log: any) => {
              const actionInfo = actionConfig[log.actionType as ActionType];
              return (
                <Card key={log.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={actionInfo?.color}>
                            {actionInfo?.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString('ar-SA')}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{log.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>المستخدم: {log.userId}</span>
                          {log.deviceId && <span>الجهاز: {log.deviceId}</span>}
                        </div>
                      </div>
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
