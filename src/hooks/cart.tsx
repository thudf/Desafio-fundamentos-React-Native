import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
// import { Product } from 'src/pages/Dashboard/styles';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem('@GoMarket:products');

      if (productsStorage) {
        setProducts(JSON.parse(productsStorage));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function saveProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem('@GoMarket:products');
      const parseStorage = productsStorage ? JSON.parse(productsStorage) : '';

      if (products !== parseStorage && products.length > 0) {
        await AsyncStorage.setItem(
          '@GoMarket:products',
          JSON.stringify(products),
        );
      }
    }

    saveProducts();
  }, [products]);

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);
      const productIncrement = products[productIndex];
      productIncrement.quantity += 1;

      setProducts([
        ...products.slice(0, productIndex),
        productIncrement,
        ...products.slice(productIndex + 1, products.length),
      ]);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);
      const productDecrement = products[productIndex];

      if (productDecrement.quantity > 1) {
        productDecrement.quantity -= 1;

        setProducts([
          ...products.slice(0, productIndex),
          productDecrement,
          ...products.slice(productIndex + 1, products.length),
        ]);
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productAddedInCart = products.find(
        productState => productState.id === product.id,
      );

      if (productAddedInCart && productAddedInCart.quantity > 0) {
        increment(productAddedInCart.id);
      } else {
        const newProduct = {
          ...product,
          quantity: 1,
        };

        setProducts([...products, newProduct]);
      }
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
