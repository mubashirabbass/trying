import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { 
  useRegister, 
  useListBranches, 
  getListBranchesQueryKey,
  RegisterBodyRole 
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  UserPlus, 
  ShieldCheck, 
  ArrowLeft, 
  Mail, 
  User, 
  Phone, 
  Fingerprint,
  MapPin
} from "lucide-react";
import { Link } from "wouter";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const registerMutation = useRegister();
  const { data: branchesResponse, isLoading: branchesLoading } = useListBranches({
    query: { queryKey: getListBranchesQueryKey() }
  });

  const branches = branchesResponse || [];
  console.log("Branches loaded:", branches.length, branches);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    registerMutation.mutate({ 
      data: { 
        name, 
        email, 
        password, 
        phone: phone || undefined,
        cnic: cnic || undefined,
        branchId: branchId ? Number(branchId) : undefined,
        role: "student" as RegisterBodyRole
      } 
    }, {
      onSuccess: (data) => {
        toast({
          title: "Registration Submitted Successfully!",
          description: `Welcome, ${data.user.name.split(" ")[0]}! Your account is pending administrator approval. Please wait for confirmation.`,
          duration: 6000,
        });
        setLocation("/login");
      },
      onError: (error: any) => {
        toast({
          title: "Registration Failed",
          description: error?.response?.data?.message || "An error occurred during registration. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <MainLayout>
      <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50/50">
        <div className="max-w-xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center">
                <UserPlus className="h-9 w-9 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 pt-4">
              Start Your Journey
            </h2>
            <p className="text-slate-500 text-sm">
              Create your student account to access world-class education
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-medium ml-1">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium ml-1">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium ml-1">Password</Label>
                  <div className="relative">
                    <Fingerprint className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 font-medium ml-1">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl"
                      placeholder="+92 300 1234567"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="branch" className="text-slate-700 font-medium ml-1">Select Branch / Campus</Label>
                  <Select value={branchId} onValueChange={setBranchId} required disabled={branchesLoading}>
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <SelectValue placeholder={branchesLoading ? "Loading campuses..." : "Choose your campus"} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {branches.length === 0 && !branchesLoading ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                          No campuses found.
                        </div>
                      ) : (
                        branches.map((branch: any) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name} ({branch.city})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnic" className="text-slate-700 font-medium ml-1">CNIC (Optional)</Label>
                  <Input
                    id="cnic"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4"
                    placeholder="12345-1234567-1"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-md shadow-primary/20 transition-all duration-200 active:scale-[0.98]"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 mr-2" />
                  )}
                  Create Free Account
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-50 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-bold hover:text-primary/80 transition-colors inline-flex items-center group">
                  <ArrowLeft className="h-3 w-3 mr-1 transform group-hover:-translate-x-1 transition-transform" />
                  Back to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
