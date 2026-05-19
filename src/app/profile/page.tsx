"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, ShieldCheck, LogOut, Camera } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, logout, deleteAccount } = useAuth();
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

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
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('dashboard.profile.title') || 'User Profile'}</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          {/* Cover Header */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          
          <div className="px-8 pb-8">
            {/* Avatar Profile Photo */}
            <div className="relative flex justify-between items-end -mt-12 mb-8">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md">
                  <div className="h-full w-full rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 h-8 w-8 bg-neutral-900 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-neutral-800 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
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
                <h2 className="text-xl font-bold text-neutral-900">{user?.name || "John Doe"}</h2>
                <p className="text-sm text-neutral-500">{t(`dashboard.roles.${user?.role?.toLowerCase()}`) || user?.role || "Role"}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-neutral-100">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500 uppercase flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    {t('dashboard.profile.fullName') || 'Full Name'}
                  </label>
                  <p className="text-neutral-900 font-medium">{user?.name || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500 uppercase flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    {t('dashboard.profile.email') || 'Email Address'}
                  </label>
                  <p className="text-neutral-900 font-medium">{user?.email || "No email provided"}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500 uppercase flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t('dashboard.profile.userRole') || 'User Role'}
                  </label>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {t(`dashboard.roles.${user?.role?.toLowerCase()}`) || user?.role || "Unassigned"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Danger Zone */}
          <div className="bg-red-50/50 px-8 py-6 border-t border-red-100">
            <h3 className="text-red-800 font-semibold mb-2">{t('dashboard.profile.dangerZone') || 'Danger Zone'}</h3>
            <p className="text-sm text-red-600/80 mb-4">
              {t('dashboard.profile.dangerZoneDesc') || 'Permanently delete your account and all associated data. This action cannot be undone.'}
            </p>
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              {t('dashboard.profile.deleteAccount') || 'Delete Account'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-neutral-900 mb-2">{t('dashboard.profile.deleteAccount') || 'Delete Account'}</h3>
            <p className="text-neutral-600 mb-6">
              {t('dashboard.profile.deleteConfirmDesc') || 'Are you sure you want to delete your account? This action is permanent and all ERP data will be lost.'}
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
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
