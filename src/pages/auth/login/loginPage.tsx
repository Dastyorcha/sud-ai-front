import LoginForm from "@/shared/components/pages/auth/loginForm";

export default function LoginPage() {
  return (
    <>
      <div className="flex items-center bg-linear-to-br from-primary to-primary/60 justify-center min-h-screen">
        <LoginForm />
      </div>
    </>
  );
}
