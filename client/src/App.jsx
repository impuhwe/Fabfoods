import { Route, Routes } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import RequirePermission from './components/auth/RequirePermission.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';
import { PERMISSIONS } from './lib/permissions.js';
import HomePage from './pages/public/HomePage.jsx';
import MenuPage from './pages/public/MenuPage.jsx';
import MenuItemPage from './pages/public/MenuItemPage.jsx';
import AboutPage from './pages/public/AboutPage.jsx';
import GalleryPage from './pages/public/GalleryPage.jsx';
import ReservationsPage from './pages/public/ReservationsPage.jsx';
import CateringPage from './pages/public/CateringPage.jsx';
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
import AcceptInvitation from './pages/admin/AcceptInvitation.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminReservations from './pages/admin/AdminReservations.jsx';
import AdminCatering from './pages/admin/AdminCatering.jsx';
import AdminMenuReview from './pages/admin/AdminMenuReview.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminStaff from './pages/admin/AdminStaff.jsx';
import AdminInvitations from './pages/admin/AdminInvitations.jsx';
import AdminEmails from './pages/admin/AdminEmails.jsx';
import AdminAuditLog from './pages/admin/AdminAuditLog.jsx';
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
        <Route path="catering" element={<CateringPage />} />
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
              title="Password reset is currently unavailable."
              description="Password reset emails are not being sent yet."
              note="No password has been changed."
            />
          }
        />
        <Route
          path="verify-email"
          element={
            <AuthNoticePage
              eyebrow="Email verification"
              title="Email verification is not required."
              description="You can sign in without verifying an email address."
              note="No verification email has been sent."
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
      <Route path="/admin/accept-invitation" element={<AcceptInvitation />} />

      <Route
        path="/admin"
        element={
          <RequirePermission permissions={[PERMISSIONS.ADMIN_ACCESS]}>
            <AdminLayout />
          </RequirePermission>
        }
      >
        <Route index element={<AdminHome />} />
        <Route
          path="orders"
          element={
            <RequirePermission permissions={[PERMISSIONS.ORDERS_VIEW]}>
              <AdminOrders />
            </RequirePermission>
          }
        />
        <Route
          path="reservations"
          element={
            <RequirePermission permissions={[PERMISSIONS.RESERVATIONS_VIEW]}>
              <AdminReservations />
            </RequirePermission>
          }
        />
        <Route
          path="menu-review"
          element={
            <RequirePermission permissions={[PERMISSIONS.MENU_VIEW]}>
              <AdminMenuReview />
            </RequirePermission>
          }
        />
        <Route
          path="settings"
          element={
            <RequirePermission permissions={[PERMISSIONS.SETTINGS_VIEW]}>
              <AdminSettings />
            </RequirePermission>
          }
        />
        <Route
          path="staff"
          element={
            <RequirePermission permissions={[PERMISSIONS.STAFF_VIEW]}>
              <AdminStaff />
            </RequirePermission>
          }
        />
        <Route
          path="invitations"
          element={
            <RequirePermission permissions={[PERMISSIONS.STAFF_VIEW]}>
              <AdminInvitations />
            </RequirePermission>
          }
        />
        <Route
          path="emails"
          element={
            <RequirePermission permissions={[PERMISSIONS.EMAILS_VIEW]}>
              <AdminEmails />
            </RequirePermission>
          }
        />
        <Route
          path="catering"
          element={
            <RequirePermission permissions={[PERMISSIONS.EMAILS_VIEW]}>
              <AdminCatering />
            </RequirePermission>
          }
        />
        <Route
          path="audit"
          element={
            <RequirePermission permissions={[PERMISSIONS.AUDIT_VIEW]}>
              <AdminAuditLog />
            </RequirePermission>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
