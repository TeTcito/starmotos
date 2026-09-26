// src/GpsPortal.tsx
import React from 'react';
import { useGpsPortal } from './hooks/useGpsPortal';
import { useIsDesktop } from './hooks/useIsDesktop';
import { GpsViewDesktop } from './components/desktop/gps/GpsViewDesktop';
import { GpsViewMobile } from './components/mobile/gps/GpsViewMobile';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onLogout: () => void;
}

export const GpsPortal: React.FC<Props> = ({ onLogout }) => {
  const portal = useGpsPortal();
  const isDesktop = useIsDesktop(1024);

  const {
    activeSection,
    setActiveSection,
    records,
    pendingRequests,
    activeRequests,
    profile,
    updateProfile,
    assignCredentials,
    toastMessage,
    showToast,
  } = portal;

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans antialiased selection:bg-cyan-600 selection:text-white">
      {isDesktop ? (
        <GpsViewDesktop
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          records={records}
          pendingRequests={pendingRequests}
          activeRequests={activeRequests}
          profile={profile}
          onUpdateProfile={updateProfile}
          onLogout={onLogout}
          onAssignCredentials={assignCredentials}
          showToast={showToast}
        />
      ) : (
        <GpsViewMobile
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          records={records}
          pendingRequests={pendingRequests}
          activeRequests={activeRequests}
          profile={profile}
          onUpdateProfile={updateProfile}
          onLogout={onLogout}
          onAssignCredentials={assignCredentials}
          showToast={showToast}
        />
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-zinc-900 border border-cyan-500/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in text-xs">
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <p className="text-zinc-200 font-medium">{toastMessage.text}</p>
        </div>
      )}
    </div>
  );
};
