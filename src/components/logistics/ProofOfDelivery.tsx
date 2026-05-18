"use client";
import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, CheckCircle2, FileCheck } from 'lucide-react';

interface ProofOfDeliveryProps {
  onComplete: () => void;
}

export default function ProofOfDelivery({ onComplete }: ProofOfDeliveryProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [podImage, setPodImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const fileName = e.target.files[0].name;
      setTimeout(() => {
        setPodImage(fileName);
        setIsUploading(false);
      }, 1200);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-neutral-200 px-6 py-5 bg-neutral-50/50 flex items-center gap-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Camera className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Proof of Delivery (POD)</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Upload delivery confirmation and receiver signature.</p>
        </div>
      </div>
      
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="space-y-6">
          
          <div 
            className={`border-2 border-dashed rounded-xl transition-colors flex flex-col items-center justify-center p-10 text-center cursor-pointer group ${
              podImage ? 'border-emerald-300 bg-emerald-50' : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleSimulateUpload}
              accept="image/*,.pdf"
            />
            
            {podImage ? (
              <>
                <div className="h-14 w-14 bg-emerald-100 rounded-full flex items-center justify-center shadow-sm border border-emerald-200 mb-4">
                  <FileCheck className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-emerald-800 mb-1">POD Uploaded Successfully</h3>
                <p className="text-xs text-emerald-600 font-medium">{podImage}</p>
              </>
            ) : (
              <>
                <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-200 mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-7 w-7 text-blue-500" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-800 mb-1">Upload POD Document</h3>
                <p className="text-xs text-neutral-500">Supports JPG, PNG, PDF (Max 5MB)</p>
              </>
            )}
            
            {isUploading && (
              <div className="mt-6 flex items-center gap-2 text-sm text-blue-600 font-medium">
                <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                Processing document...
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center gap-4">
            <button
              onClick={() => onComplete()}
              disabled={!podImage}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Delivery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
