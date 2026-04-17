'use client';

import { useEffect, useRef } from 'react';
import TalentPartnerDashboardView from '@/features/talent-partner/dashboard/TalentPartnerDashboardView';
import { useDashboardData } from './hooks/useDashboardData';
import { logPerf, nowMs } from './utils/perfUtils';

export default function TalentPartnerDashboardPage() {
  const renderStartRef = useRef(nowMs());

  const {
    profile,
    profileError,
    trials,
    trialsError,
    loadingProfile,
    loadingTrials,
    refresh,
  } = useDashboardData();

  useEffect(() => {
    logPerf('dashboard-shell-first-render', renderStartRef.current);
  }, []);

  return (
    <TalentPartnerDashboardView
      profile={profile}
      error={profileError}
      profileLoading={loadingProfile}
      trials={trials}
      trialsError={trialsError}
      trialsLoading={loadingTrials}
      onRefresh={() => void refresh()}
    />
  );
}
