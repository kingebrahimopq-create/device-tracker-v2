import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';

export default function DeviceForm() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    deviceId: '',
    name: '',
    description: '',
    deviceTypeId: 1,
    location: '',
    ipAddress: '',
    macAddress: '',
    serialNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDeviceMutation = trpc.device.create.useMutation();

  if (loading) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createDeviceMutation.mutateAsync(formData as any);
      toast.success('تم إنشاء الجهاز بنجاح');
      navigate('/devices');
    } catch (error) {
      toast.error('فشل إنشاء الجهاز');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/devices')}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">إضافة جهاز جديد</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>بيانات الجهاز</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">معرف الجهاز *</label>
                  <Input
                    required
                    value={formData.deviceId}
                    onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                    placeholder="مثال: DEVICE-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">اسم الجهاز *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="اسم الجهاز"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الوصف</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف الجهاز"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">الموقع</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="موقع الجهاز"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">عنوان IP</label>
                  <Input
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    placeholder="192.168.1.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">عنوان MAC</label>
                  <Input
                    value={formData.macAddress}
                    onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                    placeholder="00:1A:2B:3C:4D:5E"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">الرقم التسلسلي</label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="SN-12345"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الجهاز'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/devices')}>
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
