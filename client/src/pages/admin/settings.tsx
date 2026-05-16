import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Settings, Phone, Mail, CreditCard, Award, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Setting { id: number; key: string; value: string; label?: string; category: string; }

const CATEGORY_META: Record<string, { icon: any; label: string; color: string }> = {
  general: { icon: Settings, label: "General", color: "text-blue-600 bg-blue-50" },
  contact: { icon: Phone, label: "Contact Info", color: "text-green-600 bg-green-50" },
  payment: { icon: CreditCard, label: "Payment Accounts", color: "text-orange-600 bg-orange-50" },
  certificate: { icon: Award, label: "Certificate", color: "text-purple-600 bg-purple-50" },
  learning: { icon: Play, label: "Learning", color: "text-indigo-600 bg-indigo-50" },
  homepage: { icon: Settings, label: "Homepage CMS", color: "text-rose-600 bg-rose-50" },
  social: { icon: Settings, label: "Social Media", color: "text-sky-600 bg-sky-50" },
};

export default function AdminSettings() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchSettings = async () => {
    const r = await fetch(`${BASE}/api/settings`, { headers });
    if (r.ok) {
      const data: Setting[] = await r.json();
      setSettings(data);
      const vals: Record<string, string> = {};
      data.forEach(s => { vals[s.key] = s.value; });
      setValues(vals);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (category: string) => {
    const categorySettings = settings.filter(s => s.category === category);
    const updates: Record<string, string> = {};
    categorySettings.forEach(s => { updates[s.key] = values[s.key] ?? s.value; });
    setSaving(true);
    const r = await fetch(`${BASE}/api/settings`, {
      method: "PUT", headers, body: JSON.stringify(updates),
    });
    if (r.ok) {
      toast({ title: "Settings saved successfully!" });
    } else {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
    setSaving(false);
  };

  const categories = [...new Set(settings.map(s => s.category))];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your institute's information and preferences</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {categories.map(cat => {
            const meta = CATEGORY_META[cat] ?? { icon: Settings, label: cat, color: "text-gray-600 bg-gray-50" };
            const Icon = meta.icon;
            const catSettings = settings.filter(s => s.category === cat);
            return (
              <Card key={cat}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${meta.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {meta.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {catSettings.map(s => (
                    <div key={s.key}>
                      <Label className="text-sm font-medium">{s.label || s.key}</Label>
                      <Input
                        value={values[s.key] ?? s.value}
                        onChange={e => setValues(prev => ({ ...prev, [s.key]: e.target.value }))}
                        className="mt-1"
                        placeholder={s.label || s.key}
                      />
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button onClick={() => handleSave(cat)} disabled={saving} size="sm">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save {meta.label}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
