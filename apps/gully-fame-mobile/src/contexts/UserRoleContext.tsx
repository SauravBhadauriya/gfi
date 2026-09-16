import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

type roles = "participants" | "fan";

interface UserRoleContextProps {
  role: roles;
  setRole: (role: roles) => void;
  isLoading: boolean;
}

const DEFAULT_ROLE: roles = "fan";

const UserRoleContext = createContext<UserRoleContextProps>({
  role: DEFAULT_ROLE,
  setRole: () => {},
  isLoading: true,
});

export const useUserRole = () => useContext(UserRoleContext);

export const UserRoleProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [role, setRoleState] = useState<roles>(DEFAULT_ROLE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole");
        
        if (!isMounted) return;

        // Validate and set role with fallback to default
        if (storedRole === "participants" || storedRole === "fan") {
          console.log("[UserRoleContext] Loaded role from storage:", storedRole);
          setRoleState(storedRole as roles);
        } else if (storedRole) {
          console.warn("[UserRoleContext] Invalid stored role:", storedRole, "- using default");
          setRoleState(DEFAULT_ROLE);
        } else {
          console.log("[UserRoleContext] No stored role - using default:", DEFAULT_ROLE);
          setRoleState(DEFAULT_ROLE);
        }
      } catch (error) {
        console.error("[UserRoleContext] Failed to load role from storage:", error);
        if (isMounted) {
          setRoleState(DEFAULT_ROLE);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRole();

    return () => {
      isMounted = false;
    };
  }, []);

  const setRole = async (newRole: roles) => {
    // Validate role before setting
    if (newRole !== "participants" && newRole !== "fan") {
      console.warn("[UserRoleContext] Invalid role attempted:", newRole);
      return;
    }

    try {
      console.log("[UserRoleContext] Setting role to:", newRole);
      setRoleState(newRole);
      await AsyncStorage.setItem("userRole", newRole);
    } catch (error) {
      console.error("[UserRoleContext] Failed to save role:", error);
      // Revert on error
      setRoleState(DEFAULT_ROLE);
    }
  };

  return (
    <UserRoleContext.Provider value={{ role, setRole, isLoading }}>
      {children}
    </UserRoleContext.Provider>
  );
};
