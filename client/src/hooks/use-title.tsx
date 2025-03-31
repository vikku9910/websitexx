import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to set the document title with the site name from settings
 * @param pageName The name of the current page to append to the site name
 */
export function useTitle(pageName?: string) {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ['/api/site-settings'],
  });
  
  const siteName = settings?.siteName || 'ClassiSpot';
  
  useEffect(() => {
    if (pageName) {
      document.title = `${siteName} - ${pageName}`;
    } else {
      document.title = `${siteName} - Post Free Classified Ads`;
    }
  }, [siteName, pageName]);
}