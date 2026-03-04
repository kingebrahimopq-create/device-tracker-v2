import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { ArrowRight, Loader2 } from 'lucide-react';

interface DeviceEditProps {
  params: {
    id: string;
  };
}

export default function DeviceEdit({ params }: DeviceEditProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const deviceId = parseInt(params.id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    ipAddress: '',
    macAddress: '',
    firmwareVersion: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch device data
  const { data: device, isLoading: deviceLoading } = trpc.device.get.useQuery({ id: deviceId });
  const updateDeviceMutation = trpc.device.update.useMutation();

  // Populate form when device data is loaded
  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name || '',
        description: device.description || '',
        location: device.location || '',
        ipAddress: device.ipAddress || '',
        macAddress: device.macAddress || '',
        firmwareVersion: device.firmwareVersion || '',
      });
    }
  }, [device]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateDeviceMutation.mutateAsync({
        id: deviceId,
        ...formData,
      });
      toast.success('تم تحديث الجهاز بنجاح');
      navigate('/devices');
    } catch (error) {
      toast.error('فشل تحديث الجهاز');
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
          <h1 className="text-3xl font-bold text-foreground">تحرير الجهاز</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>بيانات الجهاز</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">معرف الجهاز</label>
                <Input
                  disabled
                  value={device.deviceId}
                  className="bg-muted"
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
                  <label className="block text-sm font-medium mb-2">إصدار البرنامج الثابت</label>
                  <Input
                    value={formData.firmwareVersion}
                    onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })}
                    placeholder="v1.0.0"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      جاري التحديث...
                    </>
                  ) : (
                    'حفظ التغييرات'
                  )}
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
