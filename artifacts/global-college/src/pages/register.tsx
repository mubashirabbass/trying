import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { useRegister } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { RegisterBodyRole } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const registerMutation = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    registerMutation.mutate({ 
      data: { 
        name, 
        email, 
        password, 
        phone: phone || undefined,
        cnic: cnic || undefined,
        role: "student" as RegisterBodyRole
      } 
    }, {
      onSuccess: (data) => {
        login(data.user, data.token);
        
        toast({
          title: "Registration successful",
          description: `Welcome to Global College, ${data.user.name}!`,
        });
        
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({
          title: "Registration failed",
          description: error.message || "An error occurred during registration",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <MainLayout>
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Join Global College</h2>
            <p className="mt-2 text-sm text-gray-600">
              Create a student account to enroll in courses
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                  placeholder="+92 300 1234567"
                />
              </div>
              
              <div>
                <Label htmlFor="cnic">CNIC (Optional - Required for Certification)</Label>
                <Input
                  id="cnic"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  className="mt-1"
                  placeholder="12345-1234567-1"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
