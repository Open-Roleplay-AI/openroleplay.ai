"use client";
import {
  CircleUserRound,
  Home,
  MessageSquare,
  Plus,
  Store,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/src/components/tabs";
import Link from "next/link";
import { Discord } from "@repo/ui/src/components/social-icons";
import { LanguageSelect } from "./lang-select";
import { useTranslation } from "react-i18next";

function TabsController() {
  const pathname = usePathname();
  const getFirstDirectory = (urlString: string): string =>
    `/${new URL(urlString, "http://example.com").pathname.split("/")[1] || ""}`;
  const { t } = useTranslation();

  return (
    <Tabs value={getFirstDirectory(pathname)}>
      <TabsList className="border-b-none shadow-t-2xl fixed bottom-0 left-0 right-0 z-20 mx-auto flex h-16 w-full gap-2 rounded-none rounded-t-lg border bg-background/90 backdrop-blur-md backdrop-saturate-150 lg:static lg:h-full lg:w-40 lg:flex-col lg:items-start lg:justify-start lg:rounded-none lg:border-none lg:bg-transparent lg:shadow-none">
        <Link href="/">
          <TabsTrigger
            className="flex w-full flex-col items-center gap-0.5 rounded-full lg:flex-row lg:items-start"
            value="/"
          >
            <Home className="h-5 w-5 p-1" />
            {t("Discover")}
          </TabsTrigger>
        </Link>
        <Link href="/chats">
          <TabsTrigger
            className="flex w-full flex-col items-center gap-0.5 rounded-full lg:flex-row lg:items-start"
            value="/chats"
          >
            <MessageSquare className="h-5 w-5 p-1" />
            {t("Chats")}
          </TabsTrigger>
        </Link>
        <Link href="/my-characters">
          <TabsTrigger
            className="flex w-full flex-col items-center gap-0.5 rounded-full lg:flex-row lg:items-start"
            value="/my-characters"
          >
            <Plus className="h-5 w-5 p-1" />
            <span className="hidden lg:inline">{t("My")} </span>
            {t("Characters")}
          </TabsTrigger>
        </Link>
        <Link href="/my-personas">
          <TabsTrigger
            className="flex w-full flex-col items-center gap-0.5 rounded-full lg:flex-row lg:items-start"
            value="/my-personas"
          >
            <CircleUserRound className="h-5 w-5 p-1" />
            <span className="hidden lg:inline">{t("My")} </span>
            {t("Personas")}
          </TabsTrigger>
        </Link>
        <Link href="/shop">
          <TabsTrigger
            className="hidden w-full flex-col items-center gap-0.5 rounded-full lg:flex lg:flex-row lg:items-start"
            value="/shop"
          >
            <Store className="h-5 w-5 p-1" />
            {t("Shop")}
          </TabsTrigger>
        </Link>
        <Link href="/discord">
          <TabsTrigger
            className="hidden w-full flex-col items-center gap-0.5 rounded-full lg:flex lg:flex-row lg:items-start"
            value="/discord"
          >
            <Discord className="h-5 w-5 p-1" />
            {t("Community")}
          </TabsTrigger>
        </Link>
        <div className="hidden w-full px-2 lg:flex">
          <LanguageSelect />
        </div>
      </TabsList>
    </Tabs>
  );
}

export default TabsController;
