import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="h-full flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Settings className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-700">Settings</h2>
        <p className="text-neutral-500 mt-2">This module is currently under development.</p>
      </div>
    </div>
  );
}
