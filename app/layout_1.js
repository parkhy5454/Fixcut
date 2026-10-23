import "./globals.css";

export const metadata = {
  title: "FIXCUT - 월 19만원 아끼기",
  description: "통신·구독·대출 고정비 3분 스캔"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
