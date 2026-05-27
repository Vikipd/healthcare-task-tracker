import { useEffect, useState } from "react";

import { supabase } from "./supabaseClient";

import Login from "./pages/Login";

import AdminDashboard from "./pages/AdminDashboard";

import EmployeeDashboard from "./pages/EmployeeDashboard";

function App() {

  const [session, setSession] =
    useState(null);

  useEffect(() => {

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };

  }, []);

  // NOT LOGGED IN
  if (!session) {
    return <Login />;
  }

  const email =
    session.user.email;

  // ADMIN
  if (email === "admin@test.com") {
    return (
      <AdminDashboard
        session={session}
      />
    );
  }

  // EMPLOYEE
  return (
    <EmployeeDashboard
      session={session}
    />
  );
}

export default App;