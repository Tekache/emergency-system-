import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ReportEmergency from "./pages/ReportEmergency";
import MyReports from "./pages/MyReports";
import ReportDetails from "./pages/ReportDetails";
import Profile from "./pages/Profile";
import ReportsList from "./pages/ReportsList";
import AdminUsers from "./pages/AdminUsers";
import SystemRecords from "./pages/SystemRecords";

const staff = ["responder", "admin"];
const guard = (el, roles) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

const NotFound = () => (
  <div className="card center">
    <h1>Page not found</h1>
    <Link className="btn" to="/">Go home</Link>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={guard(<Dashboard />)} />
            <Route path="/profile" element={guard(<Profile />)} />
            <Route path="/reports/:id" element={guard(<ReportDetails />)} />
            <Route path="/report" element={guard(<ReportEmergency />, ["user"])} />
            <Route path="/my-reports" element={guard(<MyReports />, ["user"])} />
            <Route path="/incidents" element={guard(<ReportsList view="all" />, staff)} />
            <Route path="/incidents/active" element={guard(<ReportsList view="active" />, staff)} />
            <Route path="/incidents/history" element={guard(<ReportsList view="history" />, staff)} />
            <Route path="/admin/users" element={guard(<AdminUsers />, ["admin"])} />
            <Route path="/admin/records" element={guard(<SystemRecords />, ["admin"])} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
