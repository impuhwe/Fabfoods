import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import DemoBanner from './DemoBanner.jsx';
import CartDrawer from '../public/CartDrawer.jsx';

export function PublicLayout() {
  return (
    <div className="customer-ui flex min-h-dvh flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <DemoBanner />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export default PublicLayout;
