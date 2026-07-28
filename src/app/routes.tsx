import { Navigate, createBrowserRouter } from "react-router";
import { CartPage } from "./components/CartPage";
import { Home } from "./components/Home";
import { ReadyMadeCatalog } from "./components/ReadyMadeCatalog";
import { AddItemForm } from "./components/AddItemForm";
import { OrderGarmentPage } from "./components/OrderGarmentPage";
import { ProductDetail } from "./components/ProductDetail";
import { GarmentsArchive } from "./components/GarmentsArchive";
import { CustomMaterial } from "./components/CustomMaterial";
import { AddMaterialPage } from "./components/AddMaterialPage";
import { MaterialsArchive } from "./components/MaterialsArchive";
import { CreatePurchaseOrder } from "./components/CreatePurchaseOrder";
import { ProfilePage } from "./components/ProfilePage";
import { SettingsPage } from "./components/SettingsPage";
import { OrdersDashboard } from "./components/OrdersDashboard";
import { OrderDetails } from "./components/OrderDetails";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/store" replace />,
  },
  {
    path: "/store",
    Component: Home,
  },
  {
    path: "/cart",
    Component: CartPage,
  },
  {
    path: "/ready-made",
    Component: ReadyMadeCatalog,
  },
  {
    path: "/ready-made/add",
    Component: AddItemForm,
  },
  {
    path: "/ready-made/archive",
    Component: GarmentsArchive,
  },
  {
    path: "/product/:id",
    Component: ProductDetail,
  },
  {
    path: "/ready-made/order/:id",
    Component: OrderGarmentPage,
  },
  {
    path: "/custom-material",
    Component: CustomMaterial,
  },
  {
    path: "/custom-material/add",
    Component: AddMaterialPage,
  },
  {
    path: "/custom-material/archive",
    Component: MaterialsArchive,
  },
  {
    path: "/purchase-order/create",
    Component: CreatePurchaseOrder,
  },
  {
    path: "/profile",
    Component: ProfilePage,
  },
  {
    path: "/settings",
    Component: SettingsPage,
  },
  {
    path: "/orders",
    Component: OrdersDashboard,
  },
  {
    path: "/orders/:id",
    Component: OrderDetails,
  }
]);
