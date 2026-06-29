import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Printer, FileText, Users, X, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Add API client import for authenticated requests
const apiClient = {
  async get(url: string) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log("🔑 Auth token found:", token ? "YES" : "NO");
    
    const response = await fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    
    console.log("📡 Response status:", response.status);
    console.log("📡 Response OK:", response.ok);
    
    if (!response.ok) {
      console.error("❌ Response not OK:", response.status, response.statusText);
      
      // Try to get error details, but handle cases where response is not JSON
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error("❌ Error details:", errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        console.error("❌ Could not parse error response as JSON:", parseError);
        // Try to get text response
        try {
          const errorText = await response.text();
          console.error("❌ Error response text:", errorText);
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (textError) {
          console.error("❌ Could not get error response text:", textError);
        }
      }
      
      throw new Error(errorMessage);
    }
    
    let data;
    try {
      data = await response.json();
      console.log("📦 Raw response data:", data);
      console.log("📦 Data type:", typeof data);
      console.log("📦 Is null?", data === null);
      console.log("📦 Is undefined?", data === undefined);
      console.log("📦 Is array?", Array.isArray(data));
      return data;
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError);
      throw new Error("Invalid JSON response from server");
    }
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: number;
  fullName: string;
  fatherName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  rollNumber: string;
  registrationNumber: string;
  profilePicture: string | null;
  nameUrdu?: string;
  gender?: string;
  cnic?: string;
  session?: string;
  shift?: string;
  department?: string;
  enrollments?: Enrollment[];
  payments?: Payment[];
}

interface Enrollment {
  id: number;
  courseId: number;
  enrollmentDate: string;
  course: {
    title: string;
    duration: string;
  };
}

interface Payment {
  id: number;
  amount: number;
  paymentDate: string;
  receiptUrl: string;
  method: string;
  status: string;
  notes?: string;
}

type FormType = "admission" | "feechart";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminForms() {
  const { toast } = useToast();
  const [activeForm, setActiveForm] = useState<FormType>("admission");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-trigger search when typing
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [debouncedQuery]);

  // Search students
  const { data: searchResults, isLoading: isSearching, error } = useQuery({
    queryKey: ["/api/users/students/search", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.trim().length < 2) return [];
      const data = await apiClient.get(`/api/users/students/search?q=${encodeURIComponent(debouncedQuery)}`);
      return data;
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30000, // Keep results for 30 seconds
  });

  const handleSearch = () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast({ title: "Please enter at least 2 characters", variant: "destructive" });
      return;
    }
    setShowSearchResults(true);
  };

  const handleSelectStudent = async (studentId: number) => {
    try {
      const student = await apiClient.get(`/api/users/${studentId}/details`);
      
      if (!student || typeof student !== 'object' || !student.id) {
        throw new Error("Invalid student data received");
      }
      
      setSelectedStudent(student);
      setShowSearchResults(false);
      setSearchQuery(""); // Clear search after selection
      toast({ title: "✓ Student loaded successfully" });
    } catch (error: any) {
      toast({ 
        title: "Error loading student details", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    }
  };

  const handlePrintForm = () => {
    const formElement = document.querySelector('.form-printable');
    if (!formElement) {
      toast({ title: "Error: Form not found", variant: "destructive" });
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Error: Please allow popups", variant: "destructive" });
      return;
    }

    // Get the form HTML
    const formHTML = formElement.innerHTML;
    
    // Create a complete HTML document for printing
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Form - GCCS</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 0.3cm;
              background: white;
              font-size: 10pt;
            }
            
            @page {
              size: A4 portrait;
              margin: 0.5cm;
            }
            
            /* Preserve colors */
            * {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Scale everything to fit on one page */
            .max-w-2xl {
              max-width: 100%;
              transform: scale(0.85);
              transform-origin: top left;
              width: 117.6%;
            }
            
            /* Borders */
            .border-2 {
              border: 2px solid #000 !important;
            }
            
            .border {
              border: 1px solid #000 !important;
            }
            
            .border-t {
              border-top: 1px solid #000 !important;
            }
            
            .border-b {
              border-bottom: 1px solid #000 !important;
            }
            
            .border-l {
              border-left: 1px solid #000 !important;
            }
            
            .border-r {
              border-right: 1px solid #000 !important;
            }
            
            .border-black {
              border-color: #000 !important;
            }
            
            /* GCCS Colors */
            .bg-\\[\\#6b1a2e\\],
            [class*="bg-[#6b1a2e]"] {
              background-color: #6b1a2e !important;
              color: white !important;
            }
            
            .border-\\[\\#6b1a2e\\],
            [class*="border-[#6b1a2e]"] {
              border-color: #6b1a2e !important;
            }
            
            .text-white {
              color: white !important;
            }
            
            /* Profile Photo - Fixed Size */
            img {
              max-width: 120px !important;
              max-height: 120px !important;
              width: 120px !important;
              height: 120px !important;
              object-fit: cover;
              border-radius: 50%;
            }
            
            /* Photo placeholder */
            .h-24 {
              height: 120px !important;
              width: 120px !important;
            }
            
            /* Grid layouts */
            .grid {
              display: grid;
            }
            
            .grid-cols-2 {
              grid-template-columns: repeat(2, 1fr);
            }
            
            .grid-cols-3 {
              grid-template-columns: repeat(3, 1fr);
            }
            
            .grid-cols-4 {
              grid-template-columns: repeat(4, 1fr);
            }
            
            .grid-cols-6 {
              grid-template-columns: repeat(6, 1fr);
            }
            
            .gap-2 {
              gap: 0.4rem;
            }
            
            .gap-3 {
              gap: 0.6rem;
            }
            
            .gap-4 {
              gap: 0.8rem;
            }
            
            /* Flex layouts */
            .flex {
              display: flex;
            }
            
            .flex-1 {
              flex: 1;
            }
            
            .items-center {
              align-items: center;
            }
            
            .justify-center {
              justify-content: center;
            }
            
            /* Spacing - Reduced for compactness */
            .p-2 { padding: 0.4rem; }
            .p-3 { padding: 0.5rem; }
            .p-4 { padding: 0.6rem; }
            .p-6 { padding: 0.8rem; }
            .py-2 { padding-top: 0.4rem; padding-bottom: 0.4rem; }
            .py-3 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .px-2 { padding-left: 0.4rem; padding-right: 0.4rem; }
            .px-3 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .px-4 { padding-left: 0.6rem; padding-right: 0.6rem; }
            .mb-2 { margin-bottom: 0.4rem; }
            .mb-3 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 0.6rem; }
            .mb-6 { margin-bottom: 0.8rem; }
            .mt-4 { margin-top: 0.6rem; }
            
            /* Text - Smaller for better fit */
            .text-xs { font-size: 8pt; }
            .text-sm { font-size: 9pt; }
            .text-base { font-size: 10pt; }
            .text-lg { font-size: 11pt; }
            .text-xl { font-size: 12pt; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            
            /* RTL for Urdu */
            [dir="rtl"] {
              direction: rtl;
              text-align: right;
            }
            
            /* Tables */
            table {
              width: 100%;
              border-collapse: collapse;
              page-break-inside: auto;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            td, th {
              padding: 0.3rem;
              border: 1px solid #000;
              font-size: 9pt;
            }
            
            /* Rounded corners */
            .rounded {
              border-radius: 0.25rem;
            }
            
            /* Input fields - show values only */
            input {
              border: none !important;
              background: transparent !important;
              outline: none !important;
              font-family: inherit;
              font-size: inherit;
              width: 100%;
              display: inline-block;
              padding: 0;
            }
            
            /* Hide buttons in print */
            button {
              display: none !important;
            }
            
            .mx-auto {
              margin-left: auto;
              margin-right: auto;
            }
            
            /* Widths */
            .w-full {
              width: 100%;
            }
            
            .h-8 {
              height: 2rem;
            }
            
            /* Text colors */
            .text-gray-700 {
              color: #374151;
            }
            
            /* Prevent page breaks */
            .border-\\[\\#6b1a2e\\] {
              page-break-inside: avoid;
            }
            
            /* Compact header */
            .bg-\\[\\#6b1a2e\\].py-3 {
              padding-top: 0.5rem !important;
              padding-bottom: 0.5rem !important;
            }
          </style>
        </head>
        <body>
          ${formHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  return (
    <DashboardLayout>
      <div className="pb-12 print:hidden">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Student Forms</h1>
          <p className="text-gray-600">Generate and print institutional forms with auto-filled student data</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-800">Search Student</h2>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Type name, roll number, or registration number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="h-11"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.trim().length >= 2 && (
            <div className="mt-3 max-h-80 overflow-y-auto border border-gray-300 rounded-lg shadow-lg bg-white">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500">
                  <Search className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Searching...
                </div>
              ) : !searchResults || searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No students found matching "{searchQuery}"
                </div>
              ) : (
                <div className="divide-y">
                  {searchResults.map((student: any) => (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student.id)}
                      className="p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{student.fullName}</p>
                          <p className="text-sm text-gray-600">
                            {student.rollNumber && `Roll: ${student.rollNumber}`}
                            {student.rollNumber && student.registrationNumber && " | "}
                            {student.registrationNumber && `Reg: ${student.registrationNumber}`}
                          </p>
                          {student.fatherName && (
                            <p className="text-xs text-gray-500 mt-1">Father: {student.fatherName}</p>
                          )}
                        </div>
                        <div className="text-blue-600 font-medium text-sm">Select →</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Student Info */}
          {selectedStudent && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedStudent.fullName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-900">{selectedStudent.fullName}</p>
                  <p className="text-sm text-green-700">
                    Roll: {selectedStudent.rollNumber} | Father: {selectedStudent.fatherName}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedStudent(null);
                    setSearchQuery("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Form Tabs */}
        <div className="bg-white rounded-lg border-2 border-gray-200 shadow-sm print:border-0 print:shadow-none">
          {/* Tab Navigation */}
          <div className="flex gap-2 p-4 border-b-2 border-gray-200 bg-gray-50 print:hidden">
            <Button
              onClick={() => setActiveForm("admission")}
              variant={activeForm === "admission" ? "default" : "outline"}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Admission Record
            </Button>
            <Button
              onClick={() => setActiveForm("feechart")}
              variant={activeForm === "feechart" ? "default" : "outline"}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Fee Chart
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-2 print:hidden">
            <Button onClick={handlePrintForm} variant="default">
              <Printer className="h-4 w-4 mr-2" />
              Print {activeForm === "admission" ? "Admission Record" : "Fee Chart"}
            </Button>
            <Button variant="outline" onClick={() => setSelectedStudent(null)}>
              Clear Form
            </Button>
          </div>

          {/* Form Content */}
          <div className="p-6 form-printable print:p-0">
            {activeForm === "admission" && (
              <AdmissionRecordForm student={selectedStudent} />
            )}
            {activeForm === "feechart" && (
              <FeeChartForm student={selectedStudent} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Form Components ──────────────────────────────────────────────────────────

interface FormProps {
  student: Student | null;
}

// Helper function to convert number to words
function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  
  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
  }
  
  if (num < 1000) return convertLessThanThousand(num);
  if (num < 100000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return convertLessThanThousand(thousands) + " Thousand" + (remainder !== 0 ? " " + convertLessThanThousand(remainder) : "");
  }
  if (num < 10000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    return convertLessThanThousand(lakhs) + " Lakh" + (remainder !== 0 ? " " + numberToWords(remainder) : "");
  }
  
  const crores = Math.floor(num / 10000000);
  const remainder = num % 10000000;
  return convertLessThanThousand(crores) + " Crore" + (remainder !== 0 ? " " + numberToWords(remainder) : "");
}

function AdmissionRecordForm({ student }: FormProps) {
  const [month, setMonth] = useState("");
  const [records, setRecords] = useState<any[]>([]);

  // Get current date for header
  const currentDate = new Date().toLocaleDateString("en-GB");
  const currentMonth = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  useEffect(() => {
    // Set current month as default
    setMonth(currentMonth);
    
    if (student && student.enrollments) {
      const newRecords = student.enrollments.map((enrollment, idx) => ({
        id: idx + 1,
        name: student.fullName,
        histNo: student.registrationNumber,
        course: enrollment.course.title,
        admDate: new Date(enrollment.enrollmentDate).toLocaleDateString("en-GB"),
        duration: enrollment.course.duration || "3 months",
        recNo: student.payments && student.payments[idx] ? student.payments[idx].receiptUrl : "",
        amount: student.payments && student.payments[idx] ? student.payments[idx].amount : 0,
      }));
      setRecords(newRecords);
    } else {
      // Default empty rows
      setRecords([{
        id: 1,
        name: "",
        histNo: "",
        course: "",
        admDate: "",
        duration: "",
        recNo: "",
        amount: 0,
      }]);
    }
  }, [student, currentMonth]);

  const addRow = () => {
    setRecords([...records, {
      id: records.length + 1,
      name: student?.fullName || "",
      histNo: student?.registrationNumber || "",
      course: "",
      admDate: "",
      duration: "",
      recNo: "",
      amount: 0,
    }]);
  };

  const deleteRow = (id: number) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const updateRecord = (id: number, field: string, value: any) => {
    setRecords(records.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const total = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Professional Header */}
      <div className="border-2 border-[#6b1a2e] rounded-lg overflow-hidden mb-6">
        {/* College Header */}
        <div className="bg-[#6b1a2e] text-white text-center py-4">
          <h1 className="text-2xl font-black mb-1">
            GLOBAL COLLEGE OF COMPUTER SCIENCE
          </h1>
          <p className="text-sm opacity-90">18 Hazari, Jhang District, Punjab, Pakistan</p>
          <p className="text-sm opacity-90">Phone: +92 301 989 0076 | Email: info@globalcollege.edu.pk</p>
        </div>

        {/* Form Title */}
        <div className="bg-gray-100 border-b-2 border-[#6b1a2e] py-3">
          <h2 className="text-xl font-bold text-center text-[#6b1a2e]">
            STUDENT ADMISSION RECORD
          </h2>
        </div>

        {/* Form Info Header */}
        <div className="p-4 bg-white">
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="flex items-center gap-3">
              <Label className="font-bold text-gray-700 whitespace-nowrap">Record for Month:</Label>
              <Input
                type="text"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="e.g. June 2026"
                className="flex-1 h-9 border-b-2 border-t-0 border-x-0 rounded-none focus:border-[#6b1a2e]"
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="font-bold text-gray-700">Date Prepared:</Label>
              <span className="text-gray-800 font-medium">{currentDate}</span>
            </div>
          </div>

          {/* Student Info (if selected) */}
          {student && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-bold text-gray-700">Student:</span>
                  <span className="ml-2 text-gray-900">{student.fullName}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-700">Roll No:</span>
                  <span className="ml-2 text-gray-900">{student.rollNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-700">Reg No:</span>
                  <span className="ml-2 text-gray-900">{student.registrationNumber || "N/A"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 print:hidden">
        <Button onClick={addRow} size="sm" className="bg-[#6b1a2e] hover:bg-[#5a1628]">
          <Plus className="h-4 w-4 mr-2" />
          Add Student Record
        </Button>
      </div>

      {/* Admission Records Table */}
      <div className="border-2 border-[#6b1a2e] rounded-lg overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#6b1a2e] text-white">
              <th className="border border-gray-300 px-3 py-3 text-center font-bold">Sr.No</th>
              <th className="border border-gray-300 px-3 py-3 font-bold">Name of Trainee</th>
              <th className="border border-gray-300 px-3 py-3 font-bold">Hist. No.</th>
              <th className="border border-gray-300 px-3 py-3 font-bold">Course</th>
              <th className="border border-gray-300 px-3 py-3 font-bold">Add. Date</th>
              <th className="border border-gray-300 px-3 py-3 font-bold">Duration</th>
              <th className="border border-gray-300 px-3 py-3 font-bold">Fee Rec. No.</th>
              <th className="border border-gray-300 px-3 py-3 font-bold">Fees Amount</th>
              <th className="border border-gray-300 px-3 py-3 font-bold print:hidden">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr key={record.id} className="hover:bg-gray-50 even:bg-gray-25">
                <td className="border border-gray-300 px-2 py-2 text-center font-bold text-[#6b1a2e]">
                  {idx + 1}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <Input
                    type="text"
                    value={record.name}
                    onChange={(e) => updateRecord(record.id, "name", e.target.value)}
                    className="border-0 h-8 text-sm font-medium"
                    placeholder="Student name"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <Input
                    type="text"
                    value={record.histNo}
                    onChange={(e) => updateRecord(record.id, "histNo", e.target.value)}
                    className="border-0 h-8 text-sm"
                    placeholder="Reg. number"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <Input
                    type="text"
                    value={record.course}
                    onChange={(e) => updateRecord(record.id, "course", e.target.value)}
                    className="border-0 h-8 text-sm"
                    placeholder="Course name"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <Input
                    type="text"
                    value={record.admDate}
                    onChange={(e) => updateRecord(record.id, "admDate", e.target.value)}
                    className="border-0 h-8 text-sm"
                    placeholder="DD/MM/YYYY"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <Input
                    type="text"
                    value={record.duration}
                    onChange={(e) => updateRecord(record.id, "duration", e.target.value)}
                    className="border-0 h-8 text-sm"
                    placeholder="e.g. 6 months"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <Input
                    type="text"
                    value={record.recNo}
                    onChange={(e) => updateRecord(record.id, "recNo", e.target.value)}
                    className="border-0 h-8 text-sm"
                    placeholder="Receipt no."
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <Input
                    type="number"
                    value={record.amount}
                    onChange={(e) => updateRecord(record.id, "amount", e.target.value)}
                    className="border-0 h-8 text-sm text-right"
                    placeholder="Amount"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center print:hidden">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteRow(record.id)}
                    className="h-7 px-2"
                    title="Delete this record"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#6b1a2e] text-white font-bold">
              <td colSpan={7} className="border-2 border-gray-300 px-3 py-3 text-center text-lg">
                GRAND TOTAL
              </td>
              <td className="border-2 border-gray-300 px-3 py-3 text-center text-lg">
                Rs. {total.toLocaleString()}
              </td>
              <td className="print:hidden"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer Section */}
      <div className="mt-8 print:mt-6">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div className="border-t-2 border-gray-400 pt-2">
            <p className="text-sm font-bold text-gray-700">Prepared By</p>
            <p className="text-xs text-gray-500 mt-1">Admin Officer</p>
          </div>
          <div className="border-t-2 border-gray-400 pt-2">
            <p className="text-sm font-bold text-gray-700">Verified By</p>
            <p className="text-xs text-gray-500 mt-1">Academic Supervisor</p>
          </div>
          <div className="border-t-2 border-gray-400 pt-2">
            <p className="text-sm font-bold text-gray-700">Approved By</p>
            <p className="text-xs text-gray-500 mt-1">Principal/Director</p>
          </div>
        </div>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>This is a computer-generated document. For any queries, contact administration office.</p>
        </div>
      </div>
    </div>
  );
}

function FeeChartForm({ student }: FormProps) {
  const [formData, setFormData] = useState({
    rollNo: "",
    admNo: "",
    admDate: "",
    traineeName: "",
    fatherName: "",
    dob: "",
    mobile: "",
    fromDate: "",
    toDate: "",
    admFee: "",
    admFeeRecNo: "",
    certFee: "",
    certFeeRecNo: "",
    certFeeDate: "",
    totalWords: "",
    traineeSign: "",
    certBoard: "",
    certNo: "",
    photo: "",
  });

  const [monthlyFees, setMonthlyFees] = useState(
    Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      recNo: "",
      date: "",
      amount: "",
    }))
  );

  useEffect(() => {
    if (student) {
      // Calculate admission date (earliest enrollment)
      const admissionDate = student.enrollments?.[0]
        ? new Date(student.enrollments[0].enrollmentDate)
        : null;
      
      const admDateStr = admissionDate ? admissionDate.toISOString().split("T")[0] : "";
      
      // Calculate end date based on course durations
      let endDate = "";
      if (admissionDate && student.enrollments && student.enrollments.length > 0) {
        // Extract duration in months from all courses
        const durations = student.enrollments.map((enrollment: any) => {
          const durationStr = enrollment.course.duration || "3 Months";
          // Parse duration string like "3 Months", "6 Months", etc.
          const match = durationStr.match(/(\d+)/);
          return match ? parseInt(match[1]) : 3; // Default to 3 months if can't parse
        });
        
        // Take the longest duration
        const longestDuration = Math.max(...durations);
        
        // Calculate end date
        const calculatedEndDate = new Date(admissionDate);
        calculatedEndDate.setMonth(calculatedEndDate.getMonth() + longestDuration);
        endDate = calculatedEndDate.toISOString().split("T")[0];
      }

      // Calculate total admission fee (sum of all enrolled course fees)
      let totalCourseFee = 0;
      if (student.enrollments && student.enrollments.length > 0) {
        // Fetch course fees - we'll need to sum them
        // For now, if payments exist, sum initial payments, otherwise 0
        totalCourseFee = student.payments
          ?.filter((p: any) => p.status === "verified" || p.status === "approved")
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
      }

      setFormData({
        rollNo: student.rollNumber || "",
        admNo: student.registrationNumber || "",
        admDate: admDateStr,
        traineeName: student.fullName || "",
        fatherName: student.fatherName || "",
        dob: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split("T")[0] : "",
        mobile: student.phoneNumber || "",
        fromDate: admDateStr,
        toDate: endDate,
        admFee: totalCourseFee > 0 ? totalCourseFee.toString() : "",
        admFeeRecNo: student.payments?.map((p: any) => p.receiptUrl || p.id).filter(Boolean).join(", ") || "",
        certFee: "",
        certFeeRecNo: "",
        certFeeDate: "",
        totalWords: "",
        traineeSign: "",
        certBoard: "",
        certNo: "",
        photo: student.profilePicture || "",
      });

      // Process monthly fees from payments
      if (student.payments && student.payments.length > 0) {
        // Group payments by month
        const paymentsByMonth: { [key: string]: { amount: number; recNo: string; date: string }[] } = {};
        
        student.payments.forEach((payment: any) => {
          if (payment.status === "verified" || payment.status === "approved") {
            const paymentDate = new Date(payment.paymentDate);
            const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (!paymentsByMonth[monthKey]) {
              paymentsByMonth[monthKey] = [];
            }
            
            paymentsByMonth[monthKey].push({
              amount: payment.amount || 0,
              recNo: payment.receiptUrl || payment.id?.toString() || "",
              date: paymentDate.toISOString().split("T")[0],
            });
          }
        });

        // Get the enrollment start date to determine which months to populate
        const enrollmentDate = admissionDate || new Date();

        // Create 12-month array starting from enrollment month
        const newMonthlyFees = Array.from({ length: 12 }, (_, i) => {
          const monthDate = new Date(enrollmentDate);
          monthDate.setMonth(enrollmentDate.getMonth() + i);
          const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
          
          const paymentsForMonth = paymentsByMonth[monthKey] || [];
          
          if (paymentsForMonth.length > 0) {
            // Sum all payments for this month (across all courses)
            const totalAmount = paymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
            // Use the first receipt number, or combine them
            const recNos = paymentsForMonth.map(p => p.recNo).filter(r => r).join(", ");
            const firstDate = paymentsForMonth[0].date;
            
            return {
              month: i + 1,
              recNo: recNos,
              date: firstDate,
              amount: totalAmount > 0 ? totalAmount.toString() : "",
            };
          }
          
          return {
            month: i + 1,
            recNo: "",
            date: "",
            amount: "",
          };
        });
        
        setMonthlyFees(newMonthlyFees);
      }
    }
  }, [student]);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateMonthlyFee = (month: number, field: string, value: string) => {
    setMonthlyFees(
      monthlyFees.map((fee) =>
        fee.month === month ? { ...fee, [field]: value } : fee
      )
    );
  };

  const totalMonthlyFees = monthlyFees.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0);
  const totalFigure = (parseFloat(formData.admFee) || 0) + (parseFloat(formData.certFee) || 0) + totalMonthlyFees;
  
  // Auto-generate total in words
  const totalInWords = totalFigure > 0 ? numberToWords(Math.floor(totalFigure)) + " Rupees Only" : "";
  
  // Update totalWords field when total changes
  useEffect(() => {
    if (totalInWords && totalInWords !== formData.totalWords) {
      setFormData(prev => ({ ...prev, totalWords: totalInWords }));
    }
  }, [totalInWords]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-2 border-[#6b1a2e] rounded">
        <div className="bg-[#6b1a2e] text-white text-center font-black text-lg py-3">
          GLOBAL COLLEGE OF COMPUTER SCIENCE — STUDENT FEE CHART
        </div>

        <div className="p-6">
          {/* Top Section with Photo */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <Label className="text-xs font-bold">Roll No.</Label>
                  <Input
                    type="text"
                    value={formData.rollNo}
                    onChange={(e) => updateField("rollNo", e.target.value)}
                    className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Admission No.</Label>
                  <Input
                    type="text"
                    value={formData.admNo}
                    onChange={(e) => updateField("admNo", e.target.value)}
                    className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">Admission Date</Label>
                  <Input
                    type="date"
                    value={formData.admDate}
                    onChange={(e) => updateField("admDate", e.target.value)}
                    className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
                  />
                </div>
              </div>

              <div className="mb-3">
                <Label className="text-xs font-bold">Trainee Name</Label>
                <Input
                  type="text"
                  value={formData.traineeName}
                  onChange={(e) => updateField("traineeName", e.target.value)}
                  className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Father Name</Label>
                <Input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => updateField("fatherName", e.target.value)}
                  className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
                />
              </div>
            </div>

            {/* Photo Box */}
            <div className="flex flex-col items-center">
              <Label className="text-xs font-bold mb-1">PHOTO</Label>
              <div className="w-20 h-24 border-2 border-gray-400 flex items-center justify-center text-xs text-gray-400">
                {formData.photo ? (
                  <img src={formData.photo} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  "No Photo"
                )}
              </div>
            </div>
          </div>

          {/* DOB / Mobile / From-To */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <Label className="text-xs font-bold">Date of Birth</Label>
              <Input
                type="date"
                value={formData.dob}
                onChange={(e) => updateField("dob", e.target.value)}
                className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Mobile #</Label>
              <Input
                type="tel"
                value={formData.mobile}
                onChange={(e) => updateField("mobile", e.target.value)}
                className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">From</Label>
                <Input
                  type="date"
                  value={formData.fromDate}
                  onChange={(e) => updateField("fromDate", e.target.value)}
                  className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">To</Label>
                <Input
                  type="date"
                  value={formData.toDate}
                  onChange={(e) => updateField("toDate", e.target.value)}
                  className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
                />
              </div>
            </div>
          </div>

          {/* Admission Fee */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Label className="text-xs font-bold">Admission Fee</Label>
              <Input
                type="number"
                value={formData.admFee}
                onChange={(e) => updateField("admFee", e.target.value)}
                className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Rec. No.</Label>
              <Input
                type="text"
                value={formData.admFeeRecNo}
                onChange={(e) => updateField("admFeeRecNo", e.target.value)}
                className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>
          </div>

          {/* Course Fee Table */}
          <div className="bg-[#6b1a2e] text-white text-xs font-bold py-1 px-3 -mx-6 mb-3">
            COURSE FEE RECORD
          </div>

          <table className="w-full border-collapse text-xs mb-4">
            <thead>
              <tr className="bg-[#6b1a2e] text-white">
                <th className="border border-gray-400 px-2 py-1">Course Fee</th>
                <th className="border border-gray-400 px-2 py-1">Amount</th>
                <th className="border border-gray-400 px-2 py-1">Rec. No</th>
                <th className="border border-gray-400 px-2 py-1">Submission Date</th>
              </tr>
            </thead>
            <tbody>
              {monthlyFees.map((fee) => (
                <tr key={fee.month} className="even:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-1 font-bold text-[#6b1a2e]">
                    Month {fee.month} Fee
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <Input
                      type="number"
                      value={fee.amount}
                      onChange={(e) => updateMonthlyFee(fee.month, "amount", e.target.value)}
                      placeholder="0"
                      className="border-0 h-6"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <Input
                      type="text"
                      value={fee.recNo}
                      onChange={(e) => updateMonthlyFee(fee.month, "recNo", e.target.value)}
                      className="border-0 h-6"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <Input
                      type="date"
                      value={fee.date}
                      onChange={(e) => updateMonthlyFee(fee.month, "date", e.target.value)}
                      className="border-0 h-6"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Certificate Fee */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <Label className="text-xs font-bold">Certificate Fee</Label>
              <Input
                type="number"
                value={formData.certFee}
                onChange={(e) => updateField("certFee", e.target.value)}
                className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Rec. No.</Label>
              <Input
                type="text"
                value={formData.certFeeRecNo}
                onChange={(e) => updateField("certFeeRecNo", e.target.value)}
                className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Date</Label>
              <Input
                type="date"
                value={formData.certFeeDate}
                onChange={(e) => updateField("certFeeDate", e.target.value)}
                className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>
          </div>

          {/* Total Fees */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Label className="text-xs font-bold">Total Fees in Figure</Label>
              <Input
                type="text"
                value={totalFigure}
                readOnly
                className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0 bg-gray-100"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">in Words</Label>
              <Input
                type="text"
                value={formData.totalWords}
                onChange={(e) => updateField("totalWords", e.target.value)}
                className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
                placeholder="e.g. Five Thousand Only"
              />
            </div>
          </div>

          {/* Signature and Certificate */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <Label className="text-xs font-bold">Trainee Signature</Label>
              <Input
                type="text"
                value={formData.traineeSign}
                onChange={(e) => updateField("traineeSign", e.target.value)}
                className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Certificate Board</Label>
              <Input
                type="text"
                value={formData.certBoard}
                onChange={(e) => updateField("certBoard", e.target.value)}
                className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Certificate No.</Label>
              <Input
                type="text"
                value={formData.certNo}
                onChange={(e) => updateField("certNo", e.target.value)}
                className="h-8 border-b-2 border-t-0 border-x-0 rounded-none px-0"
              />
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="flex justify-between pt-6 border-t-2 border-gray-400 text-xs font-bold text-center">
            <div className="flex-1">
              <div className="h-8 mb-1"></div>
              <div>Sign. Principal</div>
            </div>
            <div className="flex-1">
              <div className="h-8 mb-1"></div>
              <div>Sign. Director</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

