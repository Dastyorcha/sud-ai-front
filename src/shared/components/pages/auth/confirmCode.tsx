import ReuseableModal from "@/shared/components/reusable-modal";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/shared/components/ui/input-otp";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import * as z from "zod";

interface ConfirmCodePropsTypes {
  isConfirmEmailModalOpen: boolean;
  setConfirmEmailModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCodeSend: boolean;
  setCodeSend: React.Dispatch<React.SetStateAction<boolean>>;
  setCodeCorrect: React.Dispatch<React.SetStateAction<boolean>>;
}

const formSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits"),
});

export default function ConfirmCode({
  isConfirmEmailModalOpen,
  setConfirmEmailModalOpen,
  isCodeSend,
  setCodeSend,
  setCodeCorrect,
}: ConfirmCodePropsTypes) {
  const location = useLocation();

  // states
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    if (timeLeft > 0 && isCodeSend) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, isCodeSend]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const onOtpSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("OTP values:", values);
    setConfirmEmailModalOpen(false);
    toast.success("You have successfully registrated!!!");
    setCodeCorrect(true);
    if (!location.pathname?.includes("/login")) {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  const handleResend = () => {
    console.log("Resending OTP...");
    setTimeLeft(300);
    setCanResend(false);
    setCodeSend(true);
    form.reset();
  };

  return (
    <>
      <ReuseableModal
        open={isConfirmEmailModalOpen}
        setOpen={setConfirmEmailModalOpen}
        title="Confirm Your Email"
      >
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              We've sent a verification code to your email address. Please enter
              it below.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="size-4" />
              <span
                className={timeLeft <= 60 ? "text-red-500 font-semibold" : ""}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onOtpSubmit)}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-center block">
                        Enter Verification Code
                      </FormLabel>
                      <FormControl>
                        <div className="flex justify-center">
                          <InputOTP maxLength={6} {...field}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {canResend ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResend}
                  >
                    Resend Code
                  </Button>
                ) : (
                  <Button
                    onClick={form.handleSubmit(onOtpSubmit)}
                    className="w-full"
                    disabled={timeLeft === 0}
                  >
                    Verify Email
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </ReuseableModal>
    </>
  );
}
