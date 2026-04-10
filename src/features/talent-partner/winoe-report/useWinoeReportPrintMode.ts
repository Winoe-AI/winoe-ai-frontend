import { useEffect } from 'react';

export function useWinoeReportPrintMode() {
  useEffect(() => {
    document.body.classList.add('winoe-report-print-mode');
    return () => {
      document.body.classList.remove('winoe-report-print-mode');
    };
  }, []);
}
