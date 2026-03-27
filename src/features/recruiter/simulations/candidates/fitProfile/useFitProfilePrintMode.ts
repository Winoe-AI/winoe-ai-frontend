import { useEffect } from 'react';

export function useFitProfilePrintMode() {
  useEffect(() => {
    document.body.classList.add('fit-profile-print-mode');
    return () => {
      document.body.classList.remove('fit-profile-print-mode');
    };
  }, []);
}
