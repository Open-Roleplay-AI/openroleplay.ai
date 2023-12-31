import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import cx from "classnames";
import { calSans, inter } from "./fonts";
import { Providers } from "./providers";
import NavBar from "./navbar";
import { constructMetadata } from "./lib/utils";
import Footer from "./footer";
import TabsController from "./tabs-controller";

export const metadata = constructMetadata();

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning={true} lang="en">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1"
      />
      <body className={cx(calSans.variable, inter.variable)}>
        <Providers>
          <NavBar />
          <main className="flex w-full pt-16 font-default lg:pt-32">
            <TabsController />
            {children}
          </main>
          <Analytics />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
