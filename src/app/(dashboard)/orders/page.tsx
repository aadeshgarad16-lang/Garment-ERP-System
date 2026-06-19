
"use client";

import React, { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveOrderAPI, getOrderByIdAPI, getLatestPoSequenceAPI, getAllOrdersAPI, Order } from "@/lib/api";
import {
  CreditCard,
  FileText,
  MapPin,
  Upload,
  ShoppingBag,
  X,
  Eye,
} from "lucide-react";
import WorkflowIndicator from "@/components/WorkflowIndicator";

interface GarmentSpec {
  id: string;
  itemDescription: string;
  size: string;
  pattern: string;
  quantity: number;
  stockAvailable: number;
  unitPrice: number;
  photoName: string | null;
}

interface InitialFormState {
  poNumber: string;
  customerName: string;
  poDate: string;
  deliveryDate: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  deliveryType: "single" | "multi";
  deliveryAddress: string;
  deliveryPin: string;
  deliveryLocationType: string;
  parentPoNumber?: string;
  billingCompany: string;
  billingPin: string;
  billingAddress: string;
  gstNumber: string;
  cinNumber: string;
  testCertificate: string;
  transportCost: string;
  paymentTerm: string;
  poAmount: number;
  advancedAmount: number;
}

const DEFAULT_FORM_STATE: InitialFormState = {
  poNumber: "",
  customerName: "",
  poDate: "",
  deliveryDate: "",
  contactPerson: "",
  contactPhone: "",
  contactEmail: "",
  deliveryType: "single",
  deliveryAddress: "",
  deliveryPin: "",
  deliveryLocationType: "To Customer",
  parentPoNumber: "",
  billingCompany: "",
  billingPin: "",
  billingAddress: "",
  gstNumber: "",
  cinNumber: "",
  testCertificate: "Yes",
  transportCost: "Paid by Customer",
  paymentTerm: "Select term...",
  poAmount: 0,
  advancedAmount: 0,
};

const getInputStyle = (error?: string) =>
  `w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder-neutral-500 caret-black dark:caret-white focus:outline-none focus:ring-2 transition shadow-sm ${error ? "border-red-500 focus:ring-red-500" : "border-neutral-300 dark:border-slate-700 focus:ring-blue-500"
  }`;

const inputStyle = getInputStyle();

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resumeId");

  const [formState, setFormState] = useState<InitialFormState>(DEFAULT_FORM_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof InitialFormState, string>>>({});
  const [orderId, setOrderId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; base64: string } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [specs, setSpecs] = useState<GarmentSpec[]>([
    { id: "1", itemDescription: "", size: "", pattern: "", quantity: 0, stockAvailable: 0, unitPrice: 0, photoName: null },
  ]);

  const [isLinkingParent, setIsLinkingParent] = useState(false);
  const [parentPOs, setParentPOs] = useState<Order[]>([]);
  const [parentSearchTerm, setParentSearchTerm] = useState("");
  const [tempParentPo, setTempParentPo] = useState("");
  const [parentPage, setParentPage] = useState(1);
  const PARENT_PAGE_SIZE = 5;

  useEffect(() => {
    if (isLinkingParent && parentPOs.length === 0) {
      getAllOrdersAPI().then((orders) => {
        // filter out the current drafting order itself if any, and only confirmed orders
        setParentPOs(orders.filter(o => o.status !== "DRAFT"));
      });
    }
  }, [isLinkingParent, parentPOs.length]);

  const filteredParentPOs = useMemo(() => {
    return parentPOs.filter(po =>
      (po.poNumber || "").toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
      (po.customerName || "").toLowerCase().includes(parentSearchTerm.toLowerCase())
    );
  }, [parentPOs, parentSearchTerm]);

  const paginatedParentPOs = useMemo(() => {
    const startIndex = (parentPage - 1) * PARENT_PAGE_SIZE;
    return filteredParentPOs.slice(startIndex, startIndex + PARENT_PAGE_SIZE);
  }, [filteredParentPOs, parentPage]);

  const totalParentPages = Math.ceil(filteredParentPOs.length / PARENT_PAGE_SIZE);

  const validateField = useCallback((field: keyof InitialFormState, value: string | number | undefined, currentState?: InitialFormState): string | undefined => {
    const strVal = value !== undefined ? String(value).trim() : "";
    const activeState = currentState || formState;

    switch (field) {
      case "poNumber":
        if (!strVal) return "Required";
        if (!/^PO-\d{4}-\d+$/.test(strVal)) return "Must match PO-YYYY-Number";
        break;
      case "customerName":
      case "billingCompany":
      case "contactPerson":
        if (field !== "contactPerson" && !strVal) return "Required";
        if (strVal && (!/^[a-zA-Z\s'.]{2,100}$/.test(strVal) || /^(abcd|aaaa|xyz|12345|test|asdf|qwer)$/i.test(strVal) || /^(.)\1{2,}$/.test(strVal))) {
          return "Please enter a valid name. Placeholder text like 'ABCD' or numbers are not allowed.";
        }
        break;
      case "contactPhone":
        if (!strVal) return "Required";
        if (!/^[6-9]\d{9}$/.test(strVal)) return "Please enter a valid 10-digit mobile number.";
        break;
      case "contactEmail":
        if (!strVal) return "Required";
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(strVal)) {
          return "Please enter a valid email address (e.g., corporate@domain.com)";
        }
        break;
      case "deliveryAddress":
        if (activeState.deliveryType === "single" && !strVal) return "Required";
        break;
      case "billingAddress":
        if (!strVal) return "Required";
        break;
      case "deliveryPin":
        if (activeState.deliveryType === "single") {
          if (!strVal) return "Required";
          if (!/^[1-9][0-9]{5}$/.test(strVal)) return "Please enter a valid 6-digit postal PIN code.";
        }
        break;
      case "billingPin":
        if (!strVal) return "Required";
        if (!/^[1-9][0-9]{5}$/.test(strVal)) return "Please enter a valid 6-digit postal PIN code.";
        break;
      case "gstNumber": {
        if (!strVal) return "Required";
        const cleanGst = strVal.replace(/[\s\u200B-\u200D\uFEFF]+/g, "").toUpperCase();
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGst)) {
          return "Please enter a valid 15-digit alphanumeric GST number.";
        }
        break;
      }
      case "cinNumber": {
        if (!strVal) return "Required";
        const cleanCin = strVal.replace(/[\s\u200B-\u200D\uFEFF]+/g, "").toUpperCase();
        if (!/^[LU]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(cleanCin)) {
          return "Please enter a valid 21-character alphanumeric CIN.";
        }
        break;
      }
      case "poAmount":
        if (!strVal || Number(strVal) <= 0) return "Must be greater than 0";
        break;
    }
    return undefined;
  }, [formState]);

  const validateForm = useCallback((isDraft = false): boolean => {
    if (isDraft) {
      if (!formState.poNumber.trim()) {
        setErrors({ poNumber: "A PO number is required even for draft saves." });
        return false;
      }
      return true;
    }

    let isValid = true;
    const newErrors: Partial<Record<keyof InitialFormState, string>> = {};

    (Object.keys(formState) as Array<keyof InitialFormState>).forEach((key) => {
      const err = validateField(key, formState[key], formState);
      if (err) {
        newErrors[key] = err;
        isValid = false;
      }
    });

    setErrors(newErrors);

    if (!uploadedFile) {
      isValid = false;
      alert("Please upload a valid Purchase Order file before submission.");
    }

    return isValid;
  }, [formState, uploadedFile, validateField]);

  const handleBlur = (field: keyof InitialFormState) => {
    let currentValue = formState[field];
    if (typeof currentValue === "string") {
      const trimmed = currentValue.trim();
      if (trimmed !== currentValue) {
        handleInputChange(field, trimmed);
        currentValue = trimmed;
      }
    }
    const err = validateField(field, currentValue, formState);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  useEffect(() => {
    let isMounted = true;

    if (!resumeId) {
      getLatestPoSequenceAPI().then((nextNumber) => {
        if (!isMounted) return;
        const currentYear = new Date().getFullYear();
        const formattedPo = `PO-${currentYear}-${String(nextNumber).padStart(3, "0")}`;
        setFormState((prev) => ({ ...prev, poNumber: formattedPo }));
      });
    } else {
      setOrderId(resumeId);

      getOrderByIdAPI(resumeId).then((draft) => {
        if (!isMounted || !draft) return;
        setFormState({
          poNumber: draft.poNumber || "",
          customerName: draft.customerName || "",
          poDate: draft.poDate || "",
          deliveryDate: draft.deliveryDate || "",
          contactPerson: draft.contactPerson || "",
          contactPhone: draft.contactPhone || "",
          contactEmail: draft.contactEmail || "",
          deliveryType: (draft as any).deliveryType || "single",
          deliveryAddress: draft.deliveryAddress || "",
          deliveryPin: draft.deliveryPin || "",
          deliveryLocationType: draft.deliveryLocationType || "To Customer",
          parentPoNumber: draft.parentPoNumber || "",
          billingCompany: draft.billingCompany || "",
          billingPin: draft.billingPin || "",
          billingAddress: draft.billingAddress || "",
          gstNumber: draft.gstNumber || "",
          cinNumber: draft.cinNumber || "",
          testCertificate: draft.testCertificate || "Yes",
          transportCost: draft.transportCost || "Paid by Customer",
          paymentTerm: draft.paymentTerm || "Select term...",
          poAmount: draft.poAmount || 0,
          advancedAmount: (draft as any).advancedAmount || 0,
        });

        if (draft.poImageName && draft.poImageBase64) {
          setUploadedFile({ name: draft.poImageName, base64: draft.poImageBase64 });
        }
        if (draft.specs?.length > 0) setSpecs(draft.specs);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [resumeId]);

  const handleInputChange = (field: keyof InitialFormState, value: string | number) => {
    setFormState((prev) => {
      const nextState = { ...prev, [field]: value };

      if (field === "deliveryType") {
        setErrors((prevErr) => ({
          ...prevErr,
          deliveryAddress: undefined,
          deliveryPin: undefined,
        }));
        if (value === "multi") {
          nextState.deliveryAddress = "";
          nextState.deliveryPin = "";
        }
      }

      // Auto-calculate 50% advanced amount if "50% Advanced, 50% on Delivery" is selected
      if (field === "poAmount" || field === "paymentTerm") {
        const currentPaymentTerm = field === "paymentTerm" ? value : prev.paymentTerm;
        const currentPoAmount = field === "poAmount" ? Number(value) : (prev.poAmount || 0);

        if (currentPaymentTerm === "50% Advanced, 50% on Delivery") {
          nextState.advancedAmount = parseFloat((currentPoAmount * 0.5).toFixed(2));
        }
      }

      return nextState;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        nextErrors[field] = undefined;
        return nextErrors;
      });
    }
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    if (numericValue.length <= 10) {
      handleInputChange("contactPhone", numericValue);
    }
  };

  const totalAmountCalculations = useMemo(() => {
    const totalAmount = formState.poAmount || 0;
    const remainingAmount = Math.max(0, totalAmount - (formState.advancedAmount || 0));
    return { totalAmount, remainingAmount };
  }, [formState.poAmount, formState.advancedAmount]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedFile({ name: file.name, base64: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setOrderId("");
    setFormState(DEFAULT_FORM_STATE);
    setIsLinkingParent(false);
    setUploadedFile(null);
    setErrors({});
    setSpecs([{ id: "1", itemDescription: "", size: "", pattern: "", quantity: 0, stockAvailable: 0, unitPrice: 0, photoName: null }]);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/orders");
    }
  };

  const getPayload = (status: "DRAFT" | "SUBMITTED", stage: "Order Initiation" | "Stock Check") => ({
    ...formState,
    id: orderId || Date.now().toString(),
    poImageName: uploadedFile?.name || undefined,
    poImageBase64: uploadedFile?.base64 || undefined,
    totalAmount: totalAmountCalculations.totalAmount,
    specs,
    status,
    stage,
    date: new Date().toISOString(),
  });

  const handleSaveDraft = async () => {
    if (!validateForm(true)) return;
    setIsSaving(true);
    try {
      const response = await saveOrderAPI(getPayload("DRAFT", "Order Initiation"));
      if (response.success) {
        alert("Draft Saved Successfully");
        resetForm();
      }
    } catch (err) {
      console.error("Failed saving draft:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitOrder = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      console.group("🚀 Debugging Form Submission");
      console.log("Submit clicked. Form values payload:", formState);

      const isValid = validateForm(false);
      if (!isValid) {
        console.error("❌ CRITICAL SUBMIT FAILURE: Validation blocked submission.");
        console.table(errors);
        alert("Form submission blocked! Check console logs for validation errors.");
        console.groupEnd();
        return;
      }

      setIsSaving(true);
      const payload = getPayload("SUBMITTED", "Order Initiation");
      const response = await saveOrderAPI(payload);

      if (response.success) {
        console.log("✅ Step 1 Saved Successfully. Redirecting to Specifications...");
        const targetPo = encodeURIComponent(formState.poNumber);
        const targetCust = encodeURIComponent(formState.customerName);
        router.push(`/order-specifications?poNumber=${targetPo}&customerName=${targetCust}`);
      } else {
        console.error("❌ API returned success: false", response);
        alert("Form submission failed on the server. Check logs.");
      }
    } catch (error) {
      console.error("CRITICAL SUBMIT FAILURE:", error);
      alert("Form submission blocked! Check console logs for validation errors.");
    } finally {
      setIsSaving(false);
      console.groupEnd();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 sm:px-6">
      <WorkflowIndicator currentStep="Order Initiation" />

      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 p-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-blue-600" />
            Order Initiation
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Create and manage purchase orders</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="w-full space-y-6">
          {/* PURCHASE ORDER DETAILS */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-visible">
            <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-4 bg-neutral-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <FileText className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                Purchase Order Information
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label htmlFor="poNumber" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    PO Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="poNumber"

                    type="text"
                    value={formState.poNumber}
                    readOnly
                    className={`${getInputStyle(errors.poNumber)} bg-neutral-100 dark:bg-slate-800 cursor-not-allowed`}
                  />
                  {errors.poNumber && <p className="text-red-500 text-xs mt-1">{errors.poNumber}</p>}

                  <div className="mt-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      <input
                        type="checkbox"
                        checked={isLinkingParent}
                        onChange={(e) => {
                          setIsLinkingParent(e.target.checked);
                          if (!e.target.checked) {
                            handleInputChange("parentPoNumber", "");
                            setTempParentPo("");
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
                      />
                      Link to Existing Parent Order
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="poDate" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    PO Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="poDate"
                    type="date"
                    value={formState.poDate}
                    onBlur={() => handleBlur("poDate")}
                    onChange={(e) => handleInputChange("poDate", e.target.value)}
                    className={`${getInputStyle(errors.poDate)} h-[42px]`}
                  />
                  {errors.poDate && <p className="text-red-500 text-xs mt-1">{errors.poDate}</p>}
                </div>

                <div>
                  <label htmlFor="deliveryDate" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="deliveryDate"
                    type="date"
                    value={formState.deliveryDate}
                    onBlur={() => handleBlur("deliveryDate")}
                    onChange={(e) => handleInputChange("deliveryDate", e.target.value)}
                    className={`${getInputStyle(errors.deliveryDate)} h-[42px]`}
                  />
                  {errors.deliveryDate && <p className="text-red-500 text-xs mt-1">{errors.deliveryDate}</p>}
                </div>

                <div>
                  <label htmlFor="customerName" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={formState.customerName}
                    onBlur={() => handleBlur("customerName")}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    placeholder="Enter customer name"
                    className={getInputStyle(errors.customerName)}
                  />
                  {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
                </div>
              </div>

              {/* LINK TO PARENT PO GRID */}
              {isLinkingParent && (
                <div className="bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl p-5 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">Select Parent PO</h3>
                    <input
                      type="text"
                      placeholder="Search Parent POs..."
                      value={parentSearchTerm}
                      onChange={(e) => {
                        setParentSearchTerm(e.target.value);
                        setParentPage(1);
                      }}
                      className={getInputStyle()}
                      style={{ maxWidth: '300px' }}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-neutral-600 dark:text-neutral-400">
                      <thead className="text-xs text-neutral-700 uppercase bg-neutral-100 dark:bg-slate-700 dark:text-neutral-300">
                        <tr>
                          <th className="px-4 py-3 text-center">Select (Parent)</th>
                          <th className="px-4 py-3">Parent PO Number</th>
                          <th className="px-4 py-3">PO Date</th>
                          <th className="px-4 py-3">Customer Name</th>
                          <th className="px-4 py-3">Order Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedParentPOs.length > 0 ? (
                          paginatedParentPOs.map((po) => (
                            <tr key={po.id} className="border-b dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-700 transition">
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="radio"
                                  name="parentPoSelection"
                                  value={po.poNumber}
                                  checked={tempParentPo === po.poNumber}
                                  onChange={() => setTempParentPo(po.poNumber)}
                                  className="w-4 h-4 text-blue-600 border-neutral-300 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{po.poNumber}</td>
                              <td className="px-4 py-3">{po.poDate}</td>
                              <td className="px-4 py-3">{po.customerName}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${po.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                  {po.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                              No previous orders found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {totalParentPages > 1 && (
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-200 dark:border-slate-700">
                      <span className="text-xs text-neutral-500">
                        Showing {((parentPage - 1) * PARENT_PAGE_SIZE) + 1} to {Math.min(parentPage * PARENT_PAGE_SIZE, filteredParentPOs.length)} of {filteredParentPOs.length} Entries
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={parentPage === 1}
                          onClick={() => setParentPage(p => Math.max(1, p - 1))}
                          className="px-3 py-1 text-xs border rounded-md disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          disabled={parentPage === totalParentPages}
                          onClick={() => setParentPage(p => Math.min(totalParentPages, p + 1))}
                          className="px-3 py-1 text-xs border rounded-md disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      disabled={!tempParentPo}
                      onClick={() => {
                        handleInputChange("parentPoNumber", tempParentPo);
                      }}
                      className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {formState.parentPoNumber === tempParentPo && tempParentPo ? 'Link Confirmed ✓' : 'OK (Confirm Link)'}
                    </button>
                  </div>
                </div>
              )}

              {/* CUSTOMER CONTACT INFORMATION */}
              <div className="bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl p-5">
                <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Customer Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="contactPerson" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Contact Person Name</label>
                    <input
                      id="contactPerson"
                      type="text"
                      value={formState.contactPerson}
                      onBlur={() => handleBlur("contactPerson")}
                      onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                      placeholder="Contact person"
                      className={getInputStyle(errors.contactPerson)}
                    />
                    {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
                  </div>
                  <div>
                    <label htmlFor="contactPhone" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Phone Number <span className="text-red-500">*</span></label>
                    <div className={`flex mt-2 shadow-sm rounded-lg overflow-hidden border transition ${errors.contactPhone ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500' : 'border-neutral-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500'}`}>
                      <span className="inline-flex items-center px-3 bg-neutral-100 dark:bg-slate-800 border-r border-neutral-300 dark:border-slate-700 text-neutral-500 dark:text-neutral-400 text-sm font-medium select-none">
                        +91
                      </span>
                      <input
                        id="contactPhone"
                        type="tel"
                        value={formState.contactPhone}
                        onBlur={() => handleBlur("contactPhone")}
                        onChange={handlePhoneInputChange}
                        placeholder=" 00000 00000"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder-neutral-500 caret-black dark:caret-white focus:outline-none"
                      />
                    </div>
                    {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
                  </div>
                  <div>
                    <label htmlFor="contactEmail" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email ID <span className="text-red-500">*</span></label>
                    <input
                      id="contactEmail"
                      type="email"
                      value={formState.contactEmail}
                      onBlur={() => handleBlur("contactEmail")}
                      onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                      placeholder="corporate@company.com"
                      className={getInputStyle(errors.contactEmail)}
                    />
                    {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
                  </div>
                </div>
              </div>

              {/* DELIVERY CONFIGURATION OPTIONS TOGGLE */}
              <div className="bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200 dark:border-slate-700/80 rounded-xl p-4">
                <div>
                  <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block mb-2">
                    Delivery Option Configurations <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="single"
                        checked={formState.deliveryType === "single"}
                        onChange={() => handleInputChange("deliveryType", "single")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300"
                      />
                      Single Delivery Address
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="multi"
                        checked={formState.deliveryType === "multi"}
                        onChange={() => handleInputChange("deliveryType", "multi")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300"
                      />
                      Multiple Delivery Addresses (Per Item Layout)
                    </label>
                  </div>
                </div>
              </div>

              {/* DYNAMIC DELIVERY SECTIONS MATCHING STATE CONFIGURATION */}
              {formState.deliveryType === "single" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2 flex flex-col">
                    <label htmlFor="deliveryAddress" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="deliveryAddress"
                      value={formState.deliveryAddress}
                      onBlur={() => handleBlur("deliveryAddress")}
                      onChange={(e) => handleInputChange("deliveryAddress", e.target.value)}
                      placeholder="Enter complete delivery address"
                      className={`${getInputStyle(errors.deliveryAddress)} flex-1 min-h-[100px] mt-1 resize-y`}
                    />
                    {errors.deliveryAddress && <p className="text-red-500 text-xs mt-1">{errors.deliveryAddress}</p>}
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label htmlFor="deliveryPin" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">PIN Code <span className="text-red-500">*</span></label>
                      <input
                        id="deliveryPin"
                        type="text"
                        value={formState.deliveryPin}
                        onBlur={() => handleBlur("deliveryPin")}
                        onChange={(e) => handleInputChange("deliveryPin", e.target.value)}
                        placeholder="e.g. 422001"
                        className={`${getInputStyle(errors.deliveryPin)} mt-1`}
                      />
                      {errors.deliveryPin && <p className="text-red-500 text-xs mt-1">{errors.deliveryPin}</p>}
                    </div>

                    {/* DELIVERY LOCATION TYPE DROPDOWN */}
                    <div>
                      <label htmlFor="deliveryLocationType" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Delivery Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="deliveryLocationType"
                        value={formState.deliveryLocationType}
                        onChange={(e) => handleInputChange("deliveryLocationType", e.target.value)}
                        className={`${inputStyle} mt-1`}
                      >
                        <option value="Door Delivery">Door Delivery</option>
                        <option value="Godown Delivery">Godown Delivery</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* BILLING AND COMPLIANCE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="billingCompany" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Bill / Invoice To <span className="text-red-500">*</span></label>
                  <input
                    id="billingCompany"
                    type="text"
                    value={formState.billingCompany}
                    onBlur={() => handleBlur("billingCompany")}
                    onChange={(e) => handleInputChange("billingCompany", e.target.value)}
                    placeholder="Company name"
                    className={getInputStyle(errors.billingCompany)}
                  />
                  {errors.billingCompany && <p className="text-red-500 text-xs mt-1">{errors.billingCompany}</p>}
                </div>
                <div>
                  <label htmlFor="billingPin" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Billing Address (PIN)</label>
                  <input
                    id="billingPin"
                    type="text"
                    value={formState.billingPin}
                    onBlur={() => handleBlur("billingPin")}
                    onChange={(e) => handleInputChange("billingPin", e.target.value)}
                    placeholder="Billing PIN"
                    className={getInputStyle(errors.billingPin)}
                  />
                  {errors.billingPin && <p className="text-red-500 text-xs mt-1">{errors.billingPin}</p>}
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="billingAddress" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Billing Address</label>
                  <textarea
                    id="billingAddress"
                    value={formState.billingAddress}
                    onBlur={() => handleBlur("billingAddress")}
                    onChange={(e) => handleInputChange("billingAddress", e.target.value)}
                    placeholder="Billing address"
                    className={`${getInputStyle(errors.billingAddress)} min-h-[80px]`}
                  />
                  {errors.billingAddress && <p className="text-red-500 text-xs mt-1">{errors.billingAddress}</p>}
                </div>
              </div>

              {/* LOGISTICS & METRICS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label htmlFor="gstNumber" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">GST Reg No <span className="text-red-500">*</span></label>
                  <input
                    id="gstNumber"
                    type="text"
                    value={formState.gstNumber}
                    onBlur={() => handleBlur("gstNumber")}
                    onChange={(e) => handleInputChange("gstNumber", e.target.value.replace(/[\s\u200B-\u200D\uFEFF]+/g, "").toUpperCase())}
                    placeholder="GST Number"
                    className={getInputStyle(errors.gstNumber)}
                  />
                  {errors.gstNumber && <p className="text-red-500 text-xs mt-1">{errors.gstNumber}</p>}
                </div>
                <div>
                  <label htmlFor="cinNumber" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">CIN <span className="text-red-500">*</span></label>
                  <input
                    id="cinNumber"
                    type="text"
                    value={formState.cinNumber}
                    onBlur={() => handleBlur("cinNumber")}
                    onChange={(e) => handleInputChange("cinNumber", e.target.value.replace(/[\s\u200B-\u200D\uFEFF]+/g, "").toUpperCase())}
                    placeholder="CIN Number"
                    className={getInputStyle(errors.cinNumber)}
                  />
                  {errors.cinNumber && <p className="text-red-500 text-xs mt-1">{errors.cinNumber}</p>}
                </div>
                <div>
                  <label htmlFor="testCertificate" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Test Certificate Required</label>
                  <select
                    id="testCertificate"
                    value={formState.testCertificate}
                    onChange={(e) => handleInputChange("testCertificate", e.target.value)}
                    className={getInputStyle(errors.testCertificate)}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="transportCost" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Transport Cost</label>
                  <select
                    id="transportCost"
                    value={formState.transportCost}
                    onChange={(e) => handleInputChange("transportCost", e.target.value)}
                    className={getInputStyle(errors.transportCost)}
                  >
                    <option>Paid by Customer</option>
                    <option>Paid by Sasons</option>
                  </select>
                </div>
              </div>

              {/* PO UPLOAD SECTION */}
              <div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">PO File <span className="text-red-500">*</span></span>
                {!uploadedFile ? (
                  <label className="mt-3 border-2 border-dashed border-neutral-300 dark:border-slate-700 rounded-xl p-8 text-center bg-neutral-50 dark:bg-slate-800 cursor-pointer hover:bg-neutral-100 dark:hover:bg-slate-800 transition block">
                    <Upload className="h-10 w-10 mx-auto text-neutral-400" />
                    <p className="mt-3 text-sm text-blue-600 font-medium">Upload PO File</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">PDF, DOC, XLS, PNG, JPG up to 10MB</p>
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
                  </label>
                ) : (
                  <div className="mt-3 flex items-center justify-between border border-neutral-200 dark:border-slate-700 rounded-xl p-4 bg-gray-50 dark:bg-slate-800">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm truncate">{uploadedFile.name}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 hover:bg-neutral-200 dark:hover:bg-slate-700 rounded-md transition"
                        title="View PO File"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-neutral-200 dark:hover:bg-slate-700 rounded-md transition"
                        title="Delete PO File"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PAYMENT DETAILS (GST REMOVED) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-neutral-200 dark:border-slate-700">
            <div className="border-b border-neutral-200 dark:border-slate-700 px-6 py-4 bg-neutral-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                Payment Details
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label htmlFor="paymentTerm" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Payment Term</label>
                  <select
                    id="paymentTerm"
                    value={formState.paymentTerm}
                    onChange={(e) => handleInputChange("paymentTerm", e.target.value)}
                    className={`${getInputStyle(errors.paymentTerm)} mt-2`}
                  >
                    <option>Select term...</option>
                    <option>Within 30 Days</option>
                    <option>Within 45 Days</option>
                    <option>Within 60 Days</option>
                    <option>Within 90 Days</option>
                    <option>50% Advanced, 50% on Delivery</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="poAmount" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">PO Amount <span className="text-red-500">*</span></label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 font-medium">₹</span>
                    <input
                      id="poAmount"
                      type="number"
                      value={formState.poAmount || ""}
                      onBlur={() => handleBlur("poAmount")}
                      onChange={(e) => handleInputChange("poAmount", Number(e.target.value))}
                      className={`${getInputStyle(errors.poAmount)} pl-10`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.poAmount && <p className="text-red-500 text-xs mt-1">{errors.poAmount}</p>}
                </div>
                <div>
                  <label htmlFor="advancedAmount" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Advanced Amount</label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 font-medium">₹</span>
                    <input
                      id="advancedAmount"
                      type="number"
                      value={formState.advancedAmount || ""}
                      onChange={(e) => handleInputChange("advancedAmount", Number(e.target.value))}
                      className={`${inputStyle} pl-10`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Remaining Amount</label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 font-medium">₹</span>
                    <input
                      type="text"
                      readOnly
                      value={totalAmountCalculations.remainingAmount.toFixed(2)}
                      className={`${inputStyle} pl-10 bg-neutral-100 dark:bg-slate-800 cursor-not-allowed font-medium`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <div className="flex justify-between items-center text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="w-max whitespace-nowrap block">
                    Total order amount
                  </span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">₹{totalAmountCalculations.totalAmount.toFixed(2)}</span>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-6 pt-5 mt-2 border-t border-neutral-100 dark:border-slate-800">
                  <div className="text-xl font-bold ml-2">
                    <span className="text-blue-600">₹{totalAmountCalculations.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM GLOBAL ACTION PANEL */}
          <div className="w-full flex justify-end mt-6 border-t border-neutral-200 dark:border-slate-700 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition shadow-sm"
              >
                {isSaving ? "Saving..." : "Save as Draft"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/drafts")}
                className="px-5 py-2.5 border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:bg-slate-800 transition shadow-sm"
              >
                View Drafts
              </button>

              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSaving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition shadow-sm"
              >
                {isSaving ? "Submitting..." : "Submit and Go to Specification →"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreviewModal && uploadedFile && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-4xl shadow-2xl border border-neutral-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate pr-4">
                Preview: {uploadedFile.name}
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-md transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-neutral-50 dark:bg-slate-950 rounded-lg min-h-[300px]">
              {uploadedFile.base64.startsWith("data:image/") ? (
                <img
                  src={uploadedFile.base64}
                  alt={uploadedFile.name}
                  className="max-w-full max-h-[65vh] object-contain rounded-md"
                />
              ) : (
                <embed
                  src={uploadedFile.base64}
                  type={uploadedFile.base64.split(";")[0].split(":")[1]}
                  className="w-full h-[65vh] rounded-md"
                />
              )}
            </div>

            <div className="flex justify-end mt-4 pt-2 border-t border-neutral-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">Loading Order Initiation Framework...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}