import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";

export default function Devices() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><p>جاري التحميل...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">إدارة الأجهزة</h1>
          <Link href="/devices/new">
            <Button className="gap-2"><Plus className="h-4 w-4" />جهاز جديد</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">قريباً: قائمة الأجهزة</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}