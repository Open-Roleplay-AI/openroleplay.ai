"use client";
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  Tooltip,
} from "@repo/ui/src/components";
import { Crystal } from "@repo/ui/src/components/icons";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import useCurrentUser from "../lib/hooks/use-current-user";
import { AnimatePresence, motion } from "framer-motion";
import { FadeInOut } from "../lib/utils";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

const Package = ({
  src,
  amount,
  bonus,
  price,
  handlePurchaseClick,
}: {
  src: string;
  amount: 300 | 1650 | 5450 | 11200 | 19400 | 90000;
  bonus: number;
  price: number;
  handlePurchaseClick?: any;
}) => {
  const router = useRouter();
  return (
    <Tooltip
      content={`Buy ${amount - bonus} ${
        bonus > 0 ? `(+ Bonus ${bonus})` : ""
      } crystals`}
      desktopOnly
    >
      <Card
        className="relative aspect-square h-[23rem] w-[23rem] rounded-lg tabular-nums duration-200 hover:shadow-lg md:h-64 md:w-64"
        role="button"
        onClick={
          handlePurchaseClick
            ? (e) => handlePurchaseClick(e)
            : () => router.push("/sign-in")
        }
      >
        <Image
          src={src}
          width={256}
          height={256}
          alt={"image for pricing"}
          className="absolute top-0 h-full w-full rounded-lg object-cover"
        />
        <div className="absolute bottom-0 h-[50%] w-full rounded-b-lg bg-gradient-to-b from-transparent via-white/95 to-white" />
        <div className="flex flex-col gap-1 pt-[70%]">
          <CardHeader className="flex items-center justify-center py-1">
            <CardTitle className="z-10 text-xl text-black">
              {(amount - bonus).toLocaleString()} Crystals
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex w-full items-center justify-center">
            <p className="z-10 w-full rounded-full bg-sky-100 text-center font-semibold text-sky-900">
              {price}$
            </p>
          </CardFooter>
        </div>
        {bonus > 0 && (
          <div className="absolute -left-2 -top-2 flex w-fit items-center gap-0.5 rounded-full bg-rose-500 p-1 px-2 text-sm font-medium text-white">
            <span className="text-amber-200">{"Bonus "}</span>
            <Crystal className="h-4 w-4" /> {bonus}
          </div>
        )}
      </Card>
    </Tooltip>
  );
};

const PackageWrapper = ({
  src,
  amount,
  bonus,
  price,
}: {
  src: string;
  amount: 300 | 1650 | 5450 | 11200 | 19400 | 90000;
  bonus: number;
  price: number;
}) => {
  const buyCrystal = useAction(api.stripe.pay);
  const currentUser = useCurrentUser();
  async function handlePurchaseClick(event: any) {
    event.preventDefault();
    const promise = buyCrystal({
      numCrystals: amount,
      userId: currentUser._id,
    });
    toast.promise(promise, {
      loading: "Redirecting to purchase page...",
      success: (paymentUrl) => {
        console.log("paymentUrl::", paymentUrl);
        window.location.href = paymentUrl!;
        return `Now you can proceed to purchase.`;
      },
      error: (error) => {
        return error
          ? (error.data as { message: string }).message
          : "Unexpected error occurred";
      },
    });
  }

  return (
    <Package
      src={src}
      amount={amount}
      bonus={bonus}
      price={price}
      handlePurchaseClick={handlePurchaseClick}
    />
  );
};

const DailyReward = () => {
  const { t } = useTranslation();
  const checkin = useMutation(api.serve.checkin);
  const checkedIn = useQuery(api.serve.checkedIn);
  const onClickHandler = async () => {
    const promise = checkin();
    toast.promise(promise, {
      loading: "Claiming your daily reward...",
      success: () => {
        return `You've claimed your daily reward!`;
      },
      error: (error) => {
        return error
          ? (error.data as { message: string }).message
          : "Unexpected error occurred";
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-8 px-5">
      <h1 className="font-display text-5xl">{t("Daily Rewards")}</h1>
      <AnimatePresence>
        {checkedIn && (
          <motion.p
            className="flex items-center gap-1 text-sm text-muted-foreground"
            {...FadeInOut}
          >
            <Crystal className="hidden h-4 w-4 md:inline" />
            {t("You've already claimed today's reward.")}
          </motion.p>
        )}
      </AnimatePresence>
      <Button onClick={onClickHandler} disabled={checkedIn}>
        {t("Claim 50 Crystals")}
      </Button>
    </div>
  );
};

export default function Page() {
  const { t } = useTranslation();
  const { isAuthenticated } = useConvexAuth();
  const packages = [
    { src: "/shop/tier1.png", amount: 300, bonus: 0, price: 0.99 },
    { src: "/shop/tier2.png", amount: 1650, bonus: 150, price: 4.99 },
    { src: "/shop/tier3.png", amount: 5450, bonus: 550, price: 14.99 },
    { src: "/shop/tier4.png", amount: 11200, bonus: 1300, price: 29.99 },
    { src: "/shop/tier5.png", amount: 19400, bonus: 3000, price: 49.99 },
    { src: "/shop/tier6.png", amount: 90000, bonus: 8000, price: 99.99 },
  ];

  return (
    <div className="flex w-full flex-col items-center gap-16 justify-self-start px-2 pb-32 pt-16">
      <div className="flex flex-col items-start gap-4 px-5 md:items-center">
        <h1 className="font-display text-5xl">{t("Shop")}</h1>
        <h2 className="bg-gradient-to-b from-gray-400 to-gray-600 bg-clip-text font-display text-3xl text-transparent">
          {t("Crystal Top-Up")}
        </h2>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <Crystal className="hidden h-4 w-4 md:inline" />
          {t(
            "Crystal is an universal currency for calling AI features in openroleplay.ai.",
          )}
        </p>
      </div>
      <AnimatePresence>
        {isAuthenticated ? (
          <motion.section
            {...FadeInOut}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {packages.map((pkg) => (
              <PackageWrapper
                key={pkg.src}
                src={pkg.src}
                amount={pkg.amount as any}
                bonus={pkg.bonus}
                price={pkg.price}
              />
            ))}
          </motion.section>
        ) : (
          <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Package
                key={pkg.src}
                src={pkg.src}
                amount={pkg.amount as any}
                bonus={pkg.bonus}
                price={pkg.price}
              />
            ))}
          </section>
        )}
      </AnimatePresence>
      <AnimatePresence>{isAuthenticated && <DailyReward />}</AnimatePresence>
    </div>
  );
}
