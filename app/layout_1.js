
import "./globals.css";
export const metadata={
  title:"FIXCUT - 고정지출 진단",
  description:"통신비, OTT, 대출 고정지출 진단",
  manifest:"/manifest.json",
  viewport:{width:"device-width",initialScale:1,maximumScale:1,userScalable:false,viewportFit:"cover"},
  themeColor:"#000000"
};
export default function RootLayout({children}){
  return (
    <html lang="ko">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#f5f5f7] antialiased" style={{WebkitTapHighlightColor:"transparent"}}>
        {children}
      </body>
    </html>
  )
}
