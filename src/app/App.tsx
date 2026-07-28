import { RouterProvider } from 'react-router';
import { router } from './routes';
import { MaterialsProvider } from './context/MaterialsContext';
import { GarmentsProvider } from './context/GarmentsContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { OrdersProvider } from './context/OrdersContext';

export default function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <GarmentsProvider>
          <MaterialsProvider>
            <OrdersProvider>
              <RouterProvider router={router} />
            </OrdersProvider>
          </MaterialsProvider>
        </GarmentsProvider>
      </CartProvider>
    </ThemeProvider>
  );
}