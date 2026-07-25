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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { User, Mail, Eye, EyeOff, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import ConfirmCode from "./confirmCode";
import { toast } from "sonner";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

const formSchema = z
  .object({
    fullname: z.string().min(1, "Full name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function RegisterForm() {
  const { locale } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isConfirmEmailModalOpen, setConfirmEmailModalOpen] = useState(false);
  const [isCodeSend, setCodeSend] = useState(false);
  const [isCodeCorrect, setCodeCorrect] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullname: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (isCodeCorrect) {
      toast.success("You registrated successfully");
    }
  }, [isCodeCorrect]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("register form values:", values);
    setConfirmEmailModalOpen(true);
    setCodeSend(true);
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
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-center bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Register
            </CardTitle>
            <CardDescription className="text-center">
              Create your account to get started
            </CardDescription>
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
                    name="fullname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                            <Input className="pl-10" placeholder="Ada Lovelace" {...field} />
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
                  transition={{ delay: 0.5 }}
                >
                  <FormField
                    control={form.control}
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
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
                  transition={{ delay: 0.7 }}
                >
                  {isCodeSend ? (
                    <Button
                      onClick={() => setConfirmEmailModalOpen(true)}
                      className="w-full"
                      type="button"
                    >
                      Enter code
                    </Button>
                  ) : (
                    <Button onClick={form.handleSubmit(onSubmit)} className="w-full">
                      Register
                    </Button>
                  )}
                  <div className="flex items-center justify-end">
                    <Link to={withLocale(locale, ROUTE_PATHS.LOGIN)}>
                      <Button type="button" variant={"link"}>
                        I have an account
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </Form>
          </CardContent>
        </Card>
      </motion.div>

      {/* confirm code */}
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
