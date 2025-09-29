import CustomLoginForm from "@/components/auth/CustomLoginForm";
import "./../../components/auth/CustomLogin.css";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <CustomLoginForm />
    </div>
  );
}