import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Mail, Eye, EyeOff, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ReuseableModal from "@/shared/components/reusable-modal";
import ConfirmCode from "./confirmCode";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export default function LoginForm() {
  const navigate = useNavigate();
  const { locale } = useTranslation();

  // states
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [isConfirmEmailModalOpen, setConfirmEmailModalOpen] = useState(false);
  const [isCodeSend, setCodeSend] = useState(false);
  const [isCodeCorrect, setCodeCorrect] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    if (isCodeCorrect) {
      const resetPasswordPath = withLocale(locale, ROUTE_PATHS.RESET_PASSWORD);
      navigate(`${resetPasswordPath}?email=${forgotPasswordForm.getValues("email")}`);
    }
  }, [isCodeCorrect]);

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    console.log("login form values:", values);
    toast.success("Login successful!");
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const onForgotPasswordSubmit = (values: z.infer<typeof forgotPasswordSchema>) => {
    console.log("forgot password email:", values);
    setForgotPasswordModalOpen(false);
    setConfirmEmailModalOpen(true);
    setCodeSend(true);
    toast.success("Verification code sent to your email!");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="min-w-[320px] md:min-w-[400px] lg:min-w-[500px] shadow-2xl">
          <CardHeader className="space-y-1">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto bg-linear-to-r from-blue-500 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mb-4"
            >
              <LogIn className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-center bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Login
            </CardTitle>
            <CardDescription className="text-center">
              Welcome back! Please login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              className="pl-10"
                              type="email"
                              placeholder="muxsincoder@gmail.com"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              className="pl-10 pr-10"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                            />
                            <Button
                              variant={"ghost"}
                              size={"icon"}
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-0 top-0 hover:bg-transparent text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button onClick={loginForm.handleSubmit(onLoginSubmit)} className="w-full">
                    Login
                  </Button>
                  <div className="flex items-center justify-between">
                    <Link to={withLocale(locale, ROUTE_PATHS.REGISTER)}>
                      <Button type="button" variant={"link"}>
                        Create an account
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant={"link"}
                      onClick={() => setForgotPasswordModalOpen(true)}
                    >
                      Forgot Password?
                    </Button>
                  </div>
                </motion.div>
              </div>
            </Form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Forgot Password Modal */}
      <ReuseableModal
        open={isForgotPasswordModalOpen}
        setOpen={setForgotPasswordModalOpen}
        title="Forgot Password"
      >
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            Enter your email address and we'll send you a verification code to reset your password.
          </p>

          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
              <div className="space-y-4">
                <FormField
                  control={forgotPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            className="pl-10"
                            type="email"
                            placeholder="muxsincoder@gmail.com"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Send Verification Code
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </ReuseableModal>

      {/* Confirm Code Modal */}
      <ConfirmCode
        isConfirmEmailModalOpen={isConfirmEmailModalOpen}
        setConfirmEmailModalOpen={setConfirmEmailModalOpen}
        isCodeSend={isCodeSend}
        setCodeSend={setCodeSend}
        setCodeCorrect={setCodeCorrect}
      />
    </>
  );
}
