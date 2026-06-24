import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface FeeReceiptProps {
  payment: {
    id: number;
    userName: string;
    userId?: number;
    rollNumber?: string;
    courseName: string;
    amount: number;
    totalFee?: number;
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
  const [printContainer, setPrintContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create print container at body level
    const container = document.createElement('div');
    container.className = 'fee-receipt-print-container';
    document.body.appendChild(container);
    setPrintContainer(container);

    return () => {
      document.body.removeChild(container);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const receiptDate = payment.verifiedAt || payment.createdAt;
  const formattedDate = new Date(receiptDate).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const admissionFee = 0;
  const totalAmount = payment.amount + admissionFee;

  const ReceiptContent = () => (
    <div className="slip-wrapper">
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
          <td style={{ width: '50%' }}><table className="field-table"><tbody><tr><td className="lbl">Sr. No:</td><td className="uline" style={{ paddingLeft: '8px' }}>{payment.id}</td></tr></tbody></table></td>
          <td style={{ width: '50%' }} className="pad-l"><table className="field-table"><tbody><tr><td className="lbl">Date:</td><td className="uline" style={{ paddingLeft: '8px' }}>{formattedDate}</td></tr></tbody></table></td>
        </tr></tbody></table>

        <table className="row-table"><tbody><tr>
          <td style={{ width: '50%' }}><table className="field-table"><tbody><tr><td className="lbl">Name:</td><td className="uline" style={{ paddingLeft: '8px' }}>{payment.userName}</td></tr></tbody></table></td>
          <td style={{ width: '50%' }} className="pad-l"><table className="field-table"><tbody><tr><td className="lbl">Father's Name:</td><td className="uline" style={{ paddingLeft: '8px' }}>—</td></tr></tbody></table></td>
        </tr></tbody></table>

        <table className="row-table"><tbody><tr>
          <td style={{ width: '33%' }}><table className="field-table"><tbody><tr><td className="lbl">Class:</td><td className="uline" style={{ paddingLeft: '8px' }}>{payment.courseName}</td></tr></tbody></table></td>
          <td style={{ width: '34%' }} className="pad-m"><table className="field-table"><tbody><tr><td className="lbl">Section:</td><td className="uline" style={{ paddingLeft: '8px' }}>—</td></tr></tbody></table></td>
          <td style={{ width: '33%' }}><table className="field-table"><tbody><tr><td className="lbl">Roll No:</td><td className="uline" style={{ paddingLeft: '8px' }}>{payment.rollNumber || "—"}</td></tr></tbody></table></td>
        </tr></tbody></table>

        <table className="row-table"><tbody><tr>
          <td style={{ width: '50%' }}><table className="field-table"><tbody><tr><td className="lbl">Monthly Fee:</td><td className="uline" style={{ paddingLeft: '8px' }}>Rs. {payment.amount.toLocaleString()}</td></tr></tbody></table></td>
          <td style={{ width: '50%' }} className="pad-l"><table className="field-table"><tbody><tr><td className="lbl">Admission Fee:</td><td className="uline" style={{ paddingLeft: '8px' }}>Rs. {admissionFee.toLocaleString()}</td></tr></tbody></table></td>
        </tr></tbody></table>

        <table className="row-table"><tbody><tr>
          <td style={{ width: '50%' }}><table className="field-table"><tbody><tr><td className="lbl">Fee Month:</td><td className="uline" style={{ paddingLeft: '8px' }}>{payment.installmentNumber ? `Installment #${payment.installmentNumber}` : "Full Payment"}</td></tr></tbody></table></td>
          <td style={{ width: '50%' }} className="pad-l"><table className="field-table"><tbody><tr><td className="lbl">Total:</td><td className="uline" style={{ fontWeight: 700, paddingLeft: '8px' }}>Rs. {totalAmount.toLocaleString()}</td></tr></tbody></table></td>
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
        @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap');
        
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
          .fee-receipt-print-container { display: none; }
        }
        
        @media print {
          @page { size: A4 landscape; margin: 0.5cm; }
          
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          
          body > *:not(.fee-receipt-print-container) {
            display: none !important;
          }
          
          .fee-receipt-print-container {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .slip-wrapper { box-shadow: none !important; page-break-inside: avoid !important; }
          
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Print Version - Rendered at body level via Portal */}
      {printContainer && createPortal(
        <ReceiptContent />,
        printContainer
      )}

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
