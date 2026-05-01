import React from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [needsOnboarding, setNeedsOnboarding] = 
    React.useState(false);

  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = 
        await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        // Check if profile is complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('level, department')
          .eq('id', session.user.id)
          .maybeSingle();

        // If no level or department set needs onboarding
        if (!profile?.level || !profile?.department) {
          setNeedsOnboarding(true);
        }
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = 
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center 
        justify-center bg-bg">
        <Loader2 className="h-8 w-8 animate-spin 
          text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (needsOnboarding && 
    !window.location.pathname.includes('onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}