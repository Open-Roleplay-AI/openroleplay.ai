import { Toaster } from "@repo/ui/src/components/toaster";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ConvexReactClient } from "convex/react";
import { useTheme } from "next-themes";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import CrystalDialog from "./crystal-dialog";
import PaymentDialog from "./crystals/payment-dialog";
import { dark } from "@clerk/themes";

console.log("process.env.CONVEX_URL");
console.log(process.env.NEXT_PUBLIC_CONVEX_URL);

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string,
);

export function AuthenticationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  return (
    <ClerkProvider
      publishableKey={
        process.env.NODE_ENV === "development"
          ? "pk_test_bmF0aW9uYWwtbW9zcXVpdG8tMjUuY2xlcmsuYWNjb3VudHMuZGV2JA"
          : process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      }
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: "black",
        },
        elements: {
          formFieldInput: "rounded-lg text-foreground bg-background",
          formResendCodeLink: "text-foreground",
          footerActionLink: "text-foreground",
          otpCodeFieldInput: "rounded-lg text-foreground bg-foreground/10",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <I18nextProvider i18n={i18n} defaultNS={"translation"}>
          <Toaster />
          <CrystalDialog />
          <PaymentDialog />
          <TooltipProvider>{children}</TooltipProvider>
        </I18nextProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
