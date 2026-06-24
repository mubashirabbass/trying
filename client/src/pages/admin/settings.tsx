import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Settings, Phone, CreditCard, Award, Play, Share2, MessageSquare, ExternalLink, Users, Clock, Inbox, Megaphone } from "lucide-react";
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
  social: { icon: Share2, label: "Social Media & Live Chat", color: "text-sky-600 bg-sky-50" },
  student_portal: { icon: Megaphone, label: "Student Portal Notice", color: "text-red-600 bg-red-50" },
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
                      {s.key === "student_notice_enabled" ? (
                        <div className="flex items-center gap-3 mt-2">
                          <Switch
                            checked={values[s.key] === "true"}
                            onCheckedChange={(checked) => setValues(prev => ({ ...prev, [s.key]: checked ? "true" : "false" }))}
                          />
                          <span className="text-sm text-slate-600">
                            {values[s.key] === "true" ? "Notice banner is visible" : "Notice banner is hidden"}
                          </span>
                        </div>
                      ) : s.key === "student_notice_text" ? (
                        <Textarea
                          value={values[s.key] ?? s.value}
                          onChange={e => setValues(prev => ({ ...prev, [s.key]: e.target.value }))}
                          className="mt-1 min-h-[80px]"
                          placeholder="Enter the notice text that will scroll on student portal"
                        />
                      ) : (
                        <Input
                          value={values[s.key] ?? s.value}
                          onChange={e => setValues(prev => ({ ...prev, [s.key]: e.target.value }))}
                          className="mt-1"
                          placeholder={s.label || s.key}
                        />
                      )}
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
          {/* ── Tawk.to Live Chat Quick Access ── */}
          <Card className="border-2 border-emerald-200 bg-emerald-50/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-emerald-700 bg-emerald-100">
                  <MessageSquare className="h-4 w-4" />
                </div>
                Live Chat Queries (Tawk.to)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                View and reply to all customer chat queries sent via the Live Chat button on your website.
                Agents can respond in real time from the Tawk.to dashboard.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                  <Inbox className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">All Conversations</p>
                    <p className="text-[11px] text-slate-400">View inbox & reply</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">Manage Agents</p>
                    <p className="text-[11px] text-slate-400">Add team members</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">Chat History</p>
                    <p className="text-[11px] text-slate-400">Past conversations</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <a
                  href="https://dashboard.tawk.to"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  Open Tawk.to Dashboard
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://dashboard.tawk.to/#/account/profile"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
                >
                  <Users className="h-4 w-4" />
                  Manage Agent Accounts
                </a>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Property ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">6a0d64b5eb79041c2f204f14</code>
                &nbsp;·&nbsp; Widget: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">1jp252pdn</code>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
