import RegisterForm from "@/shared/components/pages/auth/registerForm";

export default function RegisterPage() {
  return (
    <>
      <div className="flex items-center bg-linear-to-br from-primary to-primary/60 justify-center min-h-screen">
        <RegisterForm />
      </div>
    </>
  );
}
