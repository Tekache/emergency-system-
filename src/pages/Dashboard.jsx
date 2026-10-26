import { useAuth } from "../context/AuthContext";
import UserDashboard from "./UserDashboard";
import StaffDashboard from "./StaffDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  return user.role === "user" ? <UserDashboard /> : <StaffDashboard />;
}
