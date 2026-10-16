import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCatalog } from './components/ProductCatalog';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Footer } from './components/Footer';

import { Product, Order, Customer, PosTransaction, InventoryLog } from './types';
import { seedProductsIfEmpty, subscribeToProducts } from './services/productService';
import { subscribeToOrders, subscribeToCustomers } from './services/orderService';
import { subscribeToPosTransactions, subscribeToInventoryLogs } from './services/posService';
import { PosKasir } from './components/pos/PosKasir';
import { testConnection } from './firebase';
import { Flower2 } from 'lucide-react';

function FloristiqueApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [posTransactions, setPosTransactions] = useState<PosTransaction[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Views & Modals ('store' | 'pos' | 'admin')
  const [currentView, setCurrentView] = useState<'store' | 'pos' | 'admin'>('store');
  const [adminDefaultTab, setAdminDefaultTab] = useState<'orders' | 'pos' | 'products' | 'inventory' | 'pricing' | 'customers' | 'reports'>('orders');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [trackerSearchNumber, setTrackerSearchNumber] = useState<string>('');

  // Initial boot: Test Firestore connection & subscribe to real-time streams
  useEffect(() => {
    let unsubProducts: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;
    let unsubCustomers: (() => void) | undefined;
    let unsubPos: (() => void) | undefined;
    let unsubInventory: (() => void) | undefined;

    async function initApp() {
      try {
        // Validate connection to Firestore as required by skill
        await testConnection();

        // Seed 12 products if empty
        await seedProductsIfEmpty();

        // Real-time subscriptions
        unsubProducts = subscribeToProducts((prods) => {
          setProducts(prods);
          setIsLoading(false);
        });

        unsubOrders = subscribeToOrders((ords) => {
          setOrders(ords);
        });

        unsubCustomers = subscribeToCustomers((custs) => {
          setCustomers(custs);
        });

        unsubPos = subscribeToPosTransactions((txs) => {
          setPosTransactions(txs);
        });

        unsubInventory = subscribeToInventoryLogs((logs) => {
          setInventoryLogs(logs);
        });
      } catch (err) {
        console.error('Initialization error:', err);
        setIsLoading(false);
      }
    }

    initApp();

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubOrders) unsubOrders();
      if (unsubCustomers) unsubCustomers();
      if (unsubPos) unsubPos();
      if (unsubInventory) unsubInventory();
    };
  }, []);

  const handleOrderCreatedSuccess = (newOrder: Order) => {
    setIsCheckoutOpen(false);
    setConfirmedOrder(newOrder);
  };

  const handleOpenTrackerWithNumber = (orderNumber: string) => {
    setTrackerSearchNumber(orderNumber);
    setIsOrderTrackerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#faf8f7] text-[#283830] flex flex-col font-sans selection:bg-[#c97486] selection:text-white">
      {/* Global Navbar with direct 3-mode switcher (Toko, Kasir POS, Admin Panel) and no login button */}
      <Navbar
        onOpenOrderTracker={() => {
          setTrackerSearchNumber('');
          setIsOrderTrackerOpen(true);
        }}
        currentView={currentView}
        setCurrentView={setCurrentView}
        orders={orders}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {isLoading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#3f6351] via-[#527764] to-[#c76e80] text-white flex items-center justify-center animate-bounce shadow-md ring-4 ring-[#fae4e9]">
              <Flower2 className="w-8 h-8 animate-spin text-[#fdf2f4]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-[#283830]">Menghubungkan ke Floristique Database</h2>
              <p className="text-xs text-[#a84457] mt-1 font-medium">Memuat 12 koleksi bunga segar & sinkronisasi real-time Firestore...</p>
            </div>
          </div>
        ) : currentView === 'pos' ? (
          <PosKasir
            products={products}
            customers={customers}
            posTransactions={posTransactions}
            onReturnToStore={() => setCurrentView('store')}
            onOpenInventory={() => {
              setAdminDefaultTab('inventory');
              setCurrentView('admin');
            }}
            onOpenPricing={() => {
              setAdminDefaultTab('pricing');
              setCurrentView('admin');
            }}
          />
        ) : currentView === 'admin' ? (
          <AdminDashboard
            products={products}
            orders={orders}
            customers={customers}
            inventoryLogs={inventoryLogs}
            posTransactions={posTransactions}
            defaultTab={adminDefaultTab}
            onReturnToStore={() => setCurrentView('store')}
            onOpenPos={() => setCurrentView('pos')}
          />
        ) : (
          <div>
            {/* Hero Section */}
            <HeroBanner
              onCategoryClick={(cat) => {
                setSelectedCategory(cat);
                const el = document.getElementById('katalog-bunga');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Catalog Section */}
            <div id="katalog-bunga">
              <ProductCatalog
                products={products}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchQuery={searchQuery}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer without login button */}
      <Footer />

      {/* Slide-over Cart Drawer */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderCreatedSuccess}
      />

      {/* Order Confirmation & Payment Proof Upload Modal */}
      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        onViewOrderTracker={handleOpenTrackerWithNumber}
      />

      {/* Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        orders={orders}
        initialSearchNumber={trackerSearchNumber}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FloristiqueApp />
      </CartProvider>
    </AuthProvider>
  );
}
