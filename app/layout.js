import "./globals.css";
export const metadata = {
  title: "FIXCUT - 월 19.4만원 절약",
  description: "통신·구독·대출 고정비 절약",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
};
export default function RootLayout({ children }) {
  return <html lang="ko"><body>{children}</body></html>;
}
