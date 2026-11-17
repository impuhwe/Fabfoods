import { Route, Routes } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import RequireRole from './components/auth/RequireRole.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';
import { STAFF_ROLES } from './lib/roles.js';
import HomePage from './pages/public/HomePage.jsx';
import MenuPage from './pages/public/MenuPage.jsx';
import MenuItemPage from './pages/public/MenuItemPage.jsx';
import AboutPage from './pages/public/AboutPage.jsx';
import GalleryPage from './pages/public/GalleryPage.jsx';
import ReservationsPage from './pages/public/ReservationsPage.jsx';
import ContactPage from './pages/public/ContactPage.jsx';
import LoginPage from './pages/public/LoginPage.jsx';
import RegisterPage from './pages/public/RegisterPage.jsx';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage.jsx';
import AuthNoticePage from './pages/public/AuthNoticePage.jsx';
import AccountPage from './pages/public/AccountPage.jsx';
import CartPage from './pages/public/CartPage.jsx';
import CheckoutPage from './pages/public/CheckoutPage.jsx';
import OrderPage from './pages/public/OrderPage.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminReservations from './pages/admin/AdminReservations.jsx';
import AdminMenuReview from './pages/admin/AdminMenuReview.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import Forbidden from './pages/Forbidden.jsx';
import NotFound from './pages/NotFound.jsx';
import DevUiKit from './pages/DevUiKit.jsx';

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="menu/:slug" element={<MenuItemPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order/:orderNumber" element={<OrderPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="reset-password"
          element={
            <AuthNoticePage
              eyebrow="Password reset"
              title="Reset links are not active yet."
              description="Transactional email is not connected, so reset links cannot be sent."
              note="No password has been changed. When email delivery is configured, reset links will open here."
            />
          }
        />
        <Route
          path="verify-email"
          element={
            <AuthNoticePage
              eyebrow="Email verification"
              title="Email verification is not active yet."
              description="Accounts work without email verification for now because email delivery is not connected."
              note="No verification email has been sent. This page will become the verification landing page once email is configured."
            />
          }
        />
        <Route
          path="account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route path="403" element={<Forbidden />} />
        {import.meta.env.DEV ? <Route path="dev/ui" element={<DevUiKit />} /> : null}
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin"
        element={
          <RequireRole roles={STAFF_ROLES}>
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="reservations" element={<AdminReservations />} />
        <Route
          path="menu-review"
          element={
            <RequireRole roles={['manager', 'admin']}>
              <AdminMenuReview />
            </RequireRole>
          }
        />
        <Route
          path="settings"
          element={
            <RequireRole roles={['manager', 'admin']}>
              <AdminSettings />
            </RequireRole>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
