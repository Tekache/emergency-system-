import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function MainLayout() {
  return (
    <>
      <Navbar />
      <main className="container page">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">
          Community reporting and tracking platform for Tudun Wada. It does not automatically contact police, fire or ambulance services. In a life-threatening emergency, call 112 directly.
        </div>
      </footer>
    </>
  );
}
