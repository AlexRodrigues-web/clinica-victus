// frontend/src/components/Layout.jsx
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="layout-wrapper">
      <Header />
      <main style={{ paddingTop: '60px', paddingBottom: '60px' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
