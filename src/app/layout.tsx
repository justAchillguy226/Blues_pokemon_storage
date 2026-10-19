import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blues_pokemon_storage',
  description: '多帳號寶可夢管理與標籤倉庫系統',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>
        <main style={{ maxWidth: '880px', margin: '0 auto', padding: '20px 16px 48px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
