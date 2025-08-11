import type { Route } from "./+types/home";
import { Welcome } from "../components/welcome/welcome";
import { useAuth } from "../context/AuthContext";
import { useRoleBasedNavigation } from "../hooks/useRoleBasedNavigation";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Morchis Nómina" },
    { name: "description", content: "Sistema de gestión de nómina y usuarios" },
  ];
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { navigateBasedOnRole } = useRoleBasedNavigation();

  useEffect(() => {
    // Si el usuario está logueado, usar navegación basada en roles
    if (isAuthenticated) {
      navigateBasedOnRole();
    }
  }, [isAuthenticated, navigateBasedOnRole]);

  // Solo mostrar Welcome cuando no está logueado
  return <Welcome />;
}
