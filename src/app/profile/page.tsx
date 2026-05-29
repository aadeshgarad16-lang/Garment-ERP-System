"use client";


import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, ShieldCheck, LogOut, Camera, Image as ImageIcon } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, logout, deleteAccount } = useAuth();
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowPhotoOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleDeleteConfirm = () => {
    if (user?.email) {
      deleteAccount(user.email);
      router.push('/login');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">{t('profile') || 'User Profile'}</h1>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-slate-700 overflow-hidden">
          {/* Cover Header */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>

          <div className="px-8 pb-8">
            {/* Avatar Profile Photo */}
            <div className="relative flex justify-between items-end -mt-12 mb-8">
              <div className="relative" ref={optionsRef}>
                <div className="h-24 w-24 rounded-full bg-white dark:bg-slate-900 p-1 shadow-md">
                  <div className="h-full w-full rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <button
                  onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                  className="absolute bottom-0 right-0 h-8 w-8 bg-neutral-900 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-neutral-800 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>

                {showPhotoOptions && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-neutral-200 dark:border-slate-700 overflow-hidden z-10 animate-in fade-in zoom-in duration-150">
                    <button
                      onClick={() => { cameraRef.current?.click(); setShowPhotoOptions(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                      {t('takePhoto') || 'Camera'}
                    </button>
                    <button
                      onClick={() => { fileRef.current?.click(); setShowPhotoOptions(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {t('uploadPhoto') || 'File Manager'}
                    </button>
                  </div>
                )}

                <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraRef} />
                <input type="file" accept="image/*" className="hidden" ref={fileRef} />
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t('actions.logout') || 'Logout'}
              </button>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{user?.name || "John Doe"}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t(`${user?.role?.toLowerCase()}`) || user?.role || "Role"}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-neutral-100 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    {t('fullName') || 'Full Name'}
                  </label>
                  <p className="text-neutral-900 dark:text-neutral-100 font-medium">{user?.name || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    {t('email') || 'Email Address'}
                  </label>
                  <p className="text-neutral-900 dark:text-neutral-100 font-medium">{user?.email || "No email provided"}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t('userRole') || 'User Role'}
                  </label>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {t(`${user?.role?.toLowerCase()}`) || user?.role || "Unassigned"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50/50 px-8 py-6 border-t border-red-100">
            <h3 className="text-red-800 font-semibold mb-2">{t('dangerZone') || 'Danger Zone'}</h3>
            <p className="text-sm text-red-600/80 mb-4">
              {t('dagerZone', 'Permanently delete your account and all associated data. This action cannot be undone.')}
            </p>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              {t('deleteAccount') || 'Delete Account'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">{t('deleteAccount') || 'Delete Account'}</h3>
            <p className="text -neutral-600 dark:text-neutral-400 mb-6">
              {t('deleteConfirmDesc') || 'Are you sure you want to delete your account? This action is permanent and all ERP data will be lost.'}
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
              >
                {t('actions.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                {t('actions.confirm') || 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
