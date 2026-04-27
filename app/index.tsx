import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function Index() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [minTimePassed, setMinTimePassed] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // ⏳ minimum loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && minTimePassed) {
      // trigger fade first
      setFadeOut(true);

      // wait for fade animation before navigating
      setTimeout(() => {
        if (user && userData?.setupCompleted) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      }, 500); // must match fade duration
    }
  }, [loading, minTimePassed]);

  return <LoadingScreen fadeOut={fadeOut} />;
}