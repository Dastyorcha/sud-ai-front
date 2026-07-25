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
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useTranslation();
  const loginPath = withLocale(locale, ROUTE_PATHS.LOGIN);

  // states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.get("email")) navigate(loginPath);
  }, [location.search]);

  const onSubmit = (values: z.infer<typeof resetPasswordSchema>) => {
    console.log("reset password values:", values);
    toast.success("Password reset successful!");
    setTimeout(() => {
      window.location.href = loginPath;
    }, 0);
    navigate(loginPath);
  };

  return (
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
            <Lock className="w-8 h-8 text-white" />
          </motion.div>
          <CardTitle className="text-3xl font-bold text-center bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center">Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            className="pl-10 pr-10"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                          />
                          <Button
                            variant={"ghost"}
                            size={"icon"}
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-0 top-0 hover:bg-transparent text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? (
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
                <Button onClick={form.handleSubmit(onSubmit)} className="w-full">
                  Reset Password
                </Button>
              </motion.div>
            </div>
          </Form>

          <div className="flex items-center justify-between">
            <Link to={withLocale(locale, ROUTE_PATHS.REGISTER)}>
              <Button type="button" variant={"link"}>
                Create an account
              </Button>
            </Link>
            <Link to={loginPath}>
              <Button type="button" variant={"link"}>
                Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
