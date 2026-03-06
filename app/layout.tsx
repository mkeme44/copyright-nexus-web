import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copyright Compass",
  description: "Copyright determination for cultural heritage professionals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
