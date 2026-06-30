import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

interface FeeReceiptProps {
  payment: {
    id: number;
    userName: string;
    userFatherName?: string;
    userId?: number;
    rollNumber?: string;
    courseName: string;
    amount: number;
    totalFee?: number;
    remainingFee?: number;
    method: string;
    installmentNumber?: number;
    installmentMonths?: number;
    createdAt: string;
    verifiedAt?: string;
    notes?: string;
  };
  institute: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
    website?: string;
  };
  onClose?: () => void;
}

export function FeeReceipt({ payment, institute, onClose }: FeeReceiptProps) {
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Receipt - ${payment.userName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body { 
              background: white; 
              font-family: 'Times New Roman', Times, serif; 
              padding: 20px;
            }
            
            .slip-wrapper {
              width: 640px;
              background: #fff;
              border: 3px solid #1a2fa0;
              border-radius: 4px;
              position: relative;
              margin: 0 auto;
            }
            .corner { position: absolute; width: 44px; height: 44px; }
            .tl { top:7px; left:7px; border-top:2px solid #1a2fa0; border-left:2px solid #1a2fa0; }
            .tr { top:7px; right:7px; border-top:2px solid #1a2fa0; border-right:2px solid #1a2fa0; }
            .bl { bottom:7px; left:7px; border-bottom:2px solid #1a2fa0; border-left:2px solid #1a2fa0; }
            .br { bottom:7px; right:7px; border-bottom:2px solid #1a2fa0; border-right:2px solid #1a2fa0; }
            .inner { margin:12px; border:1.5px solid #1a2fa0; padding:16px 28px 18px; }
            .row-table { width:100%; border-collapse:collapse; margin-bottom:12px; }
            .row-table td { padding:0; vertical-align:bottom; }
            .field-table { width:100%; border-collapse:collapse; }
            .field-table td { padding:0; vertical-align:bottom; }
            .field-table td.lbl { white-space:nowrap; font-size:13px; font-weight:700; color:#1a2fa0; padding-right:12px; width:1%; }
            .field-table td.uline { border-bottom:1.5px solid #1a2fa0; padding-bottom:2px; padding-left:12px; font-size:13px; color:#1a2fa0; font-weight:600; text-align: left; }
            .pad-l { padding-left:16px; }
            .pad-m { padding:0 8px; }
            .urdu { 
              border-top:1px solid #b0b8e0; 
              padding-top:10px; 
              text-align:center; 
              direction:rtl;
              font-size:13px; 
              color:#1a2fa0; 
              font-family:'Noto Nastaliq Urdu',serif; 
              line-height:2; 
              margin-top:4px; 
            }
            
            @media print {
              @page { size: A4 landscape; margin: 0.5cm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const receiptDate = payment.verifiedAt || payment.createdAt;
  const formattedDate = new Date(receiptDate).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  // Guard against API returning numeric columns as strings
  const amountPaid     = Number(payment.amount)     || 0;
  const totalCourseFee = Number(payment.totalFee) > 0 ? Number(payment.totalFee) : 0;
  const installmentLabel = payment.installmentNumber
    ? `Month #${payment.installmentNumber}${payment.installmentMonths ? ` of ${payment.installmentMonths}` : ""}`
    : "Monthly Fee";


  const ReceiptContent = () => (
    <div id="receipt-content" className="slip-wrapper">
      <div className="corner tl"></div>
      <div className="corner tr"></div>
      <div className="corner bl"></div>
      <div className="corner br"></div>

      <div className="inner">
        <div style={{ textAlign: 'center', fontSize: '58px', fontWeight: 900, color: '#1a2fa0', letterSpacing: '8px', lineHeight: 1, marginBottom: '2px' }}>GLOBAL</div>
        <div style={{ textAlign: 'center', fontSize: '17px', fontWeight: 700, color: '#1a2fa0', marginBottom: '6px' }}>College of Computer Science &amp; Commerce</div>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ background: '#1a2fa0', color: '#fff', fontSize: '14px', fontWeight: 700, padding: '4px 26px', borderRadius: '20px', letterSpacing: '1px' }}>Fee Slip</span>
        </div>

        <table className="row-table"><tbody><tr>
          <td style={{ width: '50%' }}><table className="field-table"><tbody><tr><td className="lbl">Receipt No:</td><td className="uline" style={{ paddingLeft: '8px', fontWeight: 700, color: '#1a2fa0' }}>{payment.id}</td></tr></tbody></table></td>
          <td style={{ width: '50%' }} className="pad-l"><table className="field-table"><tbody><tr><td className="lbl">Date:</td><td className="uline" style={{ paddingLeft: '8px' }}>{formattedDate}</td></tr></tbody></table></td>
        </tr></tbody></table>

        <table className="row-table"><tbody><tr>
          <td style={{ width: '50%' }}><table className="field-table"><tbody><tr><td className="lbl">Name:</td><td className="uline" style={{ paddingLeft: '8px' }}>{payment.userName}</td></tr></tbody></table></td>
          <td style={{ width: '50%' }} className="pad-l"><table className="field-table"><tbody><tr><td className="lbl">Father's Name:</td><td className="uline" style={{ paddingLeft: '8px' }}>{payment.userFatherName || '—'}</td></tr></tbody></table></td>
        </tr></tbody></table>

        <table className="row-table"><tbody><tr>
          <td style={{ width: '33%' }}><table className="field-table"><tbody><tr><td className="lbl">Class:</td><td className="uline" style={{ paddingLeft: '8px' }}>{payment.courseName}</td></tr></tbody></table></td>
          <td style={{ width: '34%' }} className="pad-m"><table className="field-table"><tbody><tr><td className="lbl">Section:</td><td className="uline" style={{ paddingLeft: '8px' }}>—</td></tr></tbody></table></td>
          <td style={{ width: '33%' }}><table className="field-table"><tbody><tr><td className="lbl">Roll No:</td><td className="uline" style={{ paddingLeft: '8px' }}>{payment.rollNumber === "Processing..." ? "Processing..." : (payment.rollNumber || "—")}</td></tr></tbody></table></td>
        </tr></tbody></table>

        <table className="row-table"><tbody><tr>
          <td style={{ width: '50%' }}><table className="field-table"><tbody><tr><td className="lbl">Total Course Fee:</td><td className="uline" style={{ paddingLeft: '8px' }}>Rs. {totalCourseFee > 0 ? totalCourseFee.toLocaleString() : '—'}</td></tr></tbody></table></td>
          <td style={{ width: '50%' }} className="pad-l"><table className="field-table"><tbody><tr><td className="lbl">Amount Paid (This Month):</td><td className="uline" style={{ fontWeight: 700, paddingLeft: '8px' }}>Rs. {amountPaid.toLocaleString()}</td></tr></tbody></table></td>
        </tr></tbody></table>

        <table className="row-table"><tbody><tr>
          <td style={{ width: '50%' }}><table className="field-table"><tbody><tr><td className="lbl">Installment:</td><td className="uline" style={{ paddingLeft: '8px', fontWeight: 700, color: '#1a2fa0' }}>{installmentLabel}</td></tr></tbody></table></td>
          <td style={{ width: '50%' }} className="pad-l"><table className="field-table"><tbody><tr><td className="lbl">Payment Method:</td><td className="uline" style={{ paddingLeft: '8px' }}>{(payment.method || '').toUpperCase()}</td></tr></tbody></table></td>
        </tr></tbody></table>

        <table className="row-table" style={{ marginBottom: '14px' }}><tbody><tr>
          <td style={{ width: '50%' }}><table className="field-table"><tbody><tr><td className="lbl">Accountant Sign:</td><td className="uline"></td></tr></tbody></table></td>
          <td style={{ width: '50%' }} className="pad-l"><table className="field-table"><tbody><tr><td className="lbl">Sign Manager:</td><td className="uline"></td></tr></tbody></table></td>
        </tr></tbody></table>

        <div className="urdu">فیس رسید ادارہ ہٰذا کے سربراہ کے دستخط اور مہر ضرور چیک کر لیں اور اسے سنبھال کر رکھیں۔</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .slip-wrapper {
          width: 640px;
          background: #fff;
          border: 3px solid #1a2fa0;
          border-radius: 4px;
          position: relative;
          font-family: 'Times New Roman', Times, serif;
        }
        .corner { position: absolute; width: 44px; height: 44px; }
        .tl { top:7px; left:7px; border-top:2px solid #1a2fa0; border-left:2px solid #1a2fa0; }
        .tr { top:7px; right:7px; border-top:2px solid #1a2fa0; border-right:2px solid #1a2fa0; }
        .bl { bottom:7px; left:7px; border-bottom:2px solid #1a2fa0; border-left:2px solid #1a2fa0; }
        .br { bottom:7px; right:7px; border-bottom:2px solid #1a2fa0; border-right:2px solid #1a2fa0; }
        .inner { margin:12px; border:1.5px solid #1a2fa0; padding:16px 28px 18px; }
        .row-table { width:100%; border-collapse:collapse; margin-bottom:12px; }
        .row-table td { padding:0; vertical-align:bottom; }
        .field-table { width:100%; border-collapse:collapse; }
        .field-table td { padding:0; vertical-align:bottom; }
        .field-table td.lbl { white-space:nowrap; font-size:13px; font-weight:700; color:#1a2fa0; padding-right:12px; width:1%; }
        .field-table td.uline { border-bottom:1.5px solid #1a2fa0; padding-bottom:2px; padding-left:12px; font-size:13px; color:#1a2fa0; font-weight:600; text-align: left; }
        .pad-l { padding-left:16px; }
        .pad-m { padding:0 8px; }
        .urdu { 
          border-top:1px solid #b0b8e0; 
          padding-top:10px; 
          text-align:center; 
          direction:rtl;
          font-size:13px; 
          color:#1a2fa0; 
          font-family:'Noto Nastaliq Urdu',serif; 
          line-height:2; 
          margin-top:4px; 
        }
        @media screen {
          .slip-wrapper { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        }
      `}</style>

      {/* Screen Version */}
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-100 rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-auto shadow-2xl">
          <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4 flex items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">Fee Slip</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handlePrint} className="rounded-lg font-bold">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose} className="rounded-lg text-white hover:bg-white/20">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="p-8 flex justify-center">
            <ReceiptContent />
          </div>
        </div>
      </div>
    </>
  );
}
