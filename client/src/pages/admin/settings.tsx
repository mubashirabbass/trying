import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, Save, Settings, Phone, CreditCard, Award, Play, Share2, MessageSquare, 
  ExternalLink, Users, Clock, Inbox, AlertTriangle, Search, CheckCircle, 
  Globe, Database, Activity, Info, EyeOff, Copy, 
  RefreshCw, Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useSettings } from "@/lib/SettingsContext";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Setting { 
  id: number; 
  key: string; 
  value: string; 
  label?: string; 
  category: string; 
}

const CATEGORY_META: Record<string, { icon: any; label: string; color: string; description: string }> = {
  general: { 
    icon: Globe, 
    label: "General Settings", 
    color: "text-blue-600 bg-blue-50 border-blue-200", 
    description: "Basic site information and identity"
  },
  contact: { 
    icon: Phone, 
    label: "Contact Information", 
    color: "text-green-600 bg-green-50 border-green-200", 
    description: "Contact details and communication channels"
  },
  payment: { 
    icon: CreditCard, 
    label: "Payment Methods", 
    color: "text-orange-600 bg-orange-50 border-orange-200", 
    description: "Payment gateway and account settings"
  },
  social: { 
    icon: Share2, 
    label: "Social Media & Chat", 
    color: "text-sky-600 bg-sky-50 border-sky-200", 
    description: "Social media profiles and live chat"
  },
  homepage: { 
    icon: Home, 
    label: "Homepage Content", 
    color: "text-rose-600 bg-rose-50 border-rose-200", 
    description: "Homepage content management"
  },
  learning: { 
    icon: Play, 
    label: "Learning Settings", 
    color: "text-indigo-600 bg-indigo-50 border-indigo-200", 
    description: "Course completion parameters"
  },
  certificate: { 
    icon: Award, 
    label: "Certificate Settings", 
    color: "text-purple-600 bg-purple-50 border-purple-200", 
    description: "Certificate generation settings"
  },
  student_portal: { 
    icon: Users, 
    label: "Student Portal", 
    color: "text-emerald-600 bg-emerald-50 border-emerald-200", 
    description: "Student portal notifications"
  },
  announcement: { 
    icon: AlertTriangle, 
    label: "Critical Announcements", 
    color: "text-amber-600 bg-amber-50 border-amber-200", 
    description: "Site-wide popup announcements"
  },
};

export default function AdminSettings() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { refetch } = useSettings();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());
  const [lastSaved, setLastSaved] = useState<Record<string, Date>>({});

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const fetchSettings = async () => {
    try {
      const r = await fetch(`${BASE}/api/settings`, { headers });
      if (r.ok) {
        const data: Setting[] = await r.json();
        setSettings(data);
        const vals: Record<string, string> = {};
        data.forEach(s => { vals[s.key] = s.value; });
        setValues(vals);
      } else {
        toast({ 
          title: "Failed to load settings", 
          description: "Please refresh the page and try again",
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Network error", 
        description: "Could not connect to server",
        variant: "destructive" 
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleValueChange = (key: string, newValue: string) => {
    setValues(prev => ({ ...prev, [key]: newValue }));
    setUnsavedChanges(prev => new Set(prev.add(key)));
  };

  const handleSave = async (category: string) => {
    const categorySettings = settings.filter(s => s.category === category);
    const updates: Record<string, string> = {};
    let hasChanges = false;
    
    categorySettings.forEach(s => { 
      const newValue = values[s.key] ?? s.value;
      if (newValue !== s.value) {
        updates[s.key] = newValue;
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      toast({ title: "No changes to save" });
      return;
    }

    setSaving(category);
    try {
      const r = await fetch(`${BASE}/api/settings`, {
        method: "PUT", 
        headers, 
        body: JSON.stringify(updates),
      });
      
      if (r.ok) {
        setSettings(prev => prev.map(s => 
          updates.hasOwnProperty(s.key) ? { ...s, value: updates[s.key] } : s
        ));
        
        setUnsavedChanges(prev => {
          const newSet = new Set(prev);
          categorySettings.forEach(s => newSet.delete(s.key));
          return newSet;
        });
        
        setLastSaved(prev => ({ ...prev, [category]: new Date() }));
        
        // Trigger immediate refetch of the global settings context so other components update instantly
        refetch();
        
        toast({ 
          title: "Settings saved successfully!",
          description: `Updated ${Object.keys(updates).length} setting(s)`,
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      toast({ 
        title: "Failed to save settings", 
        description: "Please check your connection and try again",
        variant: "destructive" 
      });
    }
    setSaving(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };
  // Filter settings based on search query
  const filteredSettings = settings.filter(s => 
    s.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique categories
  const categories = [...new Set(settings.map(s => s.category))];

  // Render individual category view
  const renderCategoryView = () => {
    if (!selectedCategory) return null;
    
    const meta = CATEGORY_META[selectedCategory] ?? { 
      icon: Settings, 
      label: selectedCategory, 
      color: "text-gray-600 bg-gray-50 border-gray-200",
      description: "Category settings"
    };
    const Icon = meta.icon;
    const catSettings = settings.filter(s => s.category === selectedCategory);
    const hasUnsaved = catSettings.some(s => unsavedChanges.has(s.key));
    const isSaving = saving === selectedCategory;

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2"
          >
            ← Back to Overview
          </Button>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${meta.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{meta.label}</h2>
              <p className="text-sm text-gray-500">{meta.description}</p>
            </div>
          </div>
        </div>

        {/* Single Category Settings */}
        <Card className={`border-2 ${meta.color} max-w-4xl`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${meta.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    {meta.label}
                    {hasUnsaved && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        <Clock className="h-3 w-3 mr-1" />
                        {catSettings.filter(s => unsavedChanges.has(s.key)).length} Unsaved Changes
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-normal mt-1">{meta.description}</p>
                </div>
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {catSettings.length} settings
                </Badge>
                {lastSaved[selectedCategory] && (
                  <Badge variant="secondary" className="text-sm bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Saved
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {catSettings.map(s => {
              const isToggle = s.key === "student_notice_enabled" || s.key === "critical_popup_enabled";
              const isTextarea = s.key === "student_notice_text" || s.key === "critical_popup_message" || 
                                s.key.includes('content') || s.key.includes('description') || s.key.includes('about');
              const hasChanged = unsavedChanges.has(s.key);
              
              return (
                <div key={s.key} className={`p-6 rounded-xl border-2 transition-all ${hasChanged ? 'border-amber-300 bg-amber-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Label className="text-base font-semibold text-gray-900">
                        {s.label || s.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {hasChanged && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-sm">
                          <Clock className="h-3 w-3 mr-1" />
                          Modified
                        </Badge>
                      )}
                    </div>
                    
                    {s.value && !isToggle && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(values[s.key] ?? s.value)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {isToggle ? (
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={values[s.key] === "true"}
                        onCheckedChange={(checked) => handleValueChange(s.key, checked ? "true" : "false")}
                      />
                      <span className="text-base text-slate-600 flex items-center gap-2">
                        {values[s.key] === "true" ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            {s.key === "critical_popup_enabled"
                              ? "Popup is ACTIVE — visitors will see it"
                              : "Notice banner is visible to students"}
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-5 w-5 text-gray-400" />
                            {s.key === "critical_popup_enabled"
                              ? "Popup is hidden from visitors"
                              : "Notice banner is hidden"}
                          </>
                        )}
                      </span>
                    </div>
                  ) : isTextarea ? (
                    <div className="space-y-2">
                      <Textarea
                        value={values[s.key] ?? s.value}
                        onChange={e => handleValueChange(s.key, e.target.value)}
                        className="min-h-[150px] resize-none text-base"
                        placeholder={
                          s.key === "critical_popup_message" 
                            ? "Enter the critical announcement message that will appear on the public site..."
                            : s.key === "student_notice_text"
                            ? "Enter the notice text that will scroll on student portal"
                            : `Enter ${s.label || s.key.replace(/_/g, ' ')}`
                        }
                      />
                      <p className="text-xs text-gray-500">Characters: {(values[s.key] ?? s.value).length}</p>
                    </div>
                  ) : (
                    <Input
                      value={values[s.key] ?? s.value}
                      onChange={e => handleValueChange(s.key, e.target.value)}
                      className="w-full text-base h-11"
                      placeholder={s.label || s.key.replace(/_/g, ' ')}
                    />
                  )}
                  {/* Help text for specific fields */}
                  {s.key === "video_completion_threshold" && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Minimum percentage of video that must be watched to mark as completed (0-100)
                      </p>
                    </div>
                  )}
                  {s.key.includes('tawk') && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-sm text-emerald-700 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Used for live chat integration on your website. Get these values from your Tawk.to dashboard.
                      </p>
                    </div>
                  )}
                  {s.key.includes('bank') && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-700 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Include full bank details with IBAN for international transfers and proper account identification
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            
            <Separator className="my-8" />
            
            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => handleSave(selectedCategory)} 
                  disabled={isSaving || !hasUnsaved} 
                  size="lg"
                  className="min-w-[140px]"
                >
                  {isSaving ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Save {meta.label}</>
                  )}
                </Button>
                
                {hasUnsaved && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      // Reset values to original
                      const resetVals = {...values};
                      catSettings.forEach(s => {
                        resetVals[s.key] = s.value;
                      });
                      setValues(resetVals);
                      setUnsavedChanges(prev => {
                        const newSet = new Set(prev);
                        catSettings.forEach(s => newSet.delete(s.key));
                        return newSet;
                      });
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Changes
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {lastSaved[selectedCategory] && (
                  <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700">Last saved: {lastSaved[selectedCategory].toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-gray-500">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              Site Settings
            </h1>
            <p className="text-gray-600 mt-2">Configure your institute's information and preferences</p>
          </div>
          
          <div className="flex items-center gap-3">
            {unsavedChanges.size > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                <Clock className="h-3 w-3 mr-1" />
                {unsavedChanges.size} unsaved changes
              </Badge>
            )}
            <Button variant="outline" onClick={() => fetchSettings()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {selectedCategory ? (
        renderCategoryView()
      ) : (
        // Overview with Category Selection
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-1 w-fit">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Settings Overview
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Settings</p>
                      <p className="text-2xl font-bold text-gray-900">{settings.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Categories</p>
                      <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Unsaved Changes</p>
                      <p className="text-2xl font-bold text-gray-900">{unsavedChanges.size}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Categories Saved</p>
                      <p className="text-2xl font-bold text-gray-900">{Object.keys(lastSaved).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => {
                const meta = CATEGORY_META[cat] ?? { 
                  icon: Settings, 
                  label: cat, 
                  color: "text-gray-600 bg-gray-50 border-gray-200",
                  description: "Category settings"
                };
                const Icon = meta.icon;
                const catSettings = settings.filter(s => s.category === cat);
                const hasUnsaved = catSettings.some(s => unsavedChanges.has(s.key));
                const lastSavedTime = lastSaved[cat];
                
                return (
                  <Card 
                    key={cat} 
                    className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 ${meta.color} group`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${meta.color} group-hover:scale-110 transition-transform`}>
                          <Icon className="h-8 w-8" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 truncate">{meta.label}</h3>
                            {hasUnsaved && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                <Clock className="h-3 w-3 mr-1" />
                                {catSettings.filter(s => unsavedChanges.has(s.key)).length} Unsaved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{meta.description}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Settings className="h-3 w-3" />
                                {catSettings.length} settings
                              </span>
                              {lastSavedTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Saved {lastSavedTime.toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                            <div className="text-blue-600 font-medium group-hover:text-blue-700">
                              Configure →
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Recent Activity */}
            {Object.keys(lastSaved).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(lastSaved)
                      .sort(([,a], [,b]) => b.getTime() - a.getTime())
                      .slice(0, 5)
                      .map(([category, time]) => (
                        <div key={category} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{CATEGORY_META[category]?.label || category}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            Saved at {time.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
      {/* Tawk.to Live Chat Integration Card - Show only in overview */}
      {!selectedCategory && (
        <Card className="border-2 border-emerald-200 bg-emerald-50/40 mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-emerald-700 bg-emerald-100">
                <MessageSquare className="h-5 w-5" />
              </div>
              Live Chat Management (Tawk.to)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Monitor and respond to customer queries from your website's live chat widget. 
                All conversations are managed through the Tawk.to dashboard.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-white border border-slate-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <Inbox className="h-6 w-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700">All Conversations</p>
                    <p className="text-sm text-gray-500">View inbox & reply to chats</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-slate-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700">Agent Management</p>
                    <p className="text-sm text-gray-500">Add and manage team members</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-slate-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <Activity className="h-6 w-6 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700">Analytics & Reports</p>
                    <p className="text-sm text-gray-500">Chat performance metrics</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="https://dashboard.tawk.to"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                Open Tawk.to Dashboard
                <ExternalLink className="h-4 w-4" />
              </a>
              
              <a
                href="https://dashboard.tawk.to/#/account/profile"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 border-2 border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 font-semibold px-6 py-3 rounded-xl transition-all"
              >
                <Users className="h-4 w-4" />
                Manage Agents
              </a>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-emerald-200">
              <p className="text-sm text-gray-600 mb-2 font-medium">Integration Details:</p>
              <div className="space-y-2 text-xs text-gray-500 font-mono">
                <div className="flex items-center justify-between">
                  <span>Property ID:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded">6a0d64b5eb79041c2f204f14</code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard('6a0d64b5eb79041c2f204f14')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Widget ID:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded">1jp252pdn</code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard('1jp252pdn')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}