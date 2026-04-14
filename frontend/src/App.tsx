import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/dashboard/Overview';
import Payments from './pages/dashboard/Payments';
import Refunds from './pages/dashboard/Refunds';
import Developers from './pages/dashboard/Developers';
import Settings from './pages/dashboard/Settings';
import Checkout from './pages/checkout/Checkout';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Dashboard Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="payments" element={<Payments />} />
          <Route path="refunds" element={<Refunds />} />
          <Route path="developers" element={<Developers />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Hosted Checkout Route */}
        <Route path="/checkout/:paymentId" element={<Checkout />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
