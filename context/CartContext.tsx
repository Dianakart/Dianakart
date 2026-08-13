"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type CartItem = {
  id: string | number;
  name: string;
  price: number;
  image: string;
  quantity: number;

  // Selected product size
  size?: string;
};

type CartContextType = {
  cart: CartItem[];

  addToCart: (
    product: Omit<CartItem, "quantity">
  ) => void;

  removeFromCart: (
    id: string | number,
    size?: string
  ) => void;

  increaseQty: (
    id: string | number,
    size?: string
  ) => void;

  decreaseQty: (
    id: string | number,
    size?: string
  ) => void;

  clearCart: () => void;

  totalItems: number;
};

const CartContext =
  createContext<CartContextType | undefined>(
    undefined
  );

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [isLoaded, setIsLoaded] =
    useState(false);

  /* ========================================
     LOAD CART
  ======================================== */

  useEffect(() => {
    try {
      const savedCart =
        localStorage.getItem(
          "dianakart-cart"
        );

      if (savedCart) {
        const parsedCart =
          JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load cart:",
        error
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  /* ========================================
     SAVE CART
  ======================================== */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        "dianakart-cart",
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error(
        "Failed to save cart:",
        error
      );
    }
  }, [cart, isLoaded]);

  /* ========================================
     ITEM MATCH
     Product + Size = unique cart item
  ======================================== */

  const isSameCartItem = (
    item: CartItem,
    id: string | number,
    size?: string
  ) => {
    return (
      String(item.id) === String(id) &&
      (item.size || "") === (size || "")
    );
  };

  /* ========================================
     ADD TO CART
  ======================================== */

  const addToCart = (
    product: Omit<CartItem, "quantity">
  ) => {
    setCart((previousCart) => {
      const existingProduct =
        previousCart.find((item) =>
          isSameCartItem(
            item,
            product.id,
            product.size
          )
        );

      if (existingProduct) {
        return previousCart.map(
          (item) =>
            isSameCartItem(
              item,
              product.id,
              product.size
            )
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
                }
              : item
        );
      }

      return [
        ...previousCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  /* ========================================
     REMOVE
  ======================================== */

  const removeFromCart = (
    id: string | number,
    size?: string
  ) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) =>
          !isSameCartItem(
            item,
            id,
            size
          )
      )
    );
  };

  /* ========================================
     INCREASE QUANTITY
  ======================================== */

  const increaseQty = (
    id: string | number,
    size?: string
  ) => {
    setCart((previousCart) =>
      previousCart.map((item) =>
        isSameCartItem(
          item,
          id,
          size
        )
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      )
    );
  };

  /* ========================================
     DECREASE QUANTITY
  ======================================== */

  const decreaseQty = (
    id: string | number,
    size?: string
  ) => {
    setCart((previousCart) =>
      previousCart
        .map((item) =>
          isSameCartItem(
            item,
            id,
            size
          )
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  };

  /* ========================================
     CLEAR CART
  ======================================== */

  const clearCart = () => {
    setCart([]);
  };

  /* ========================================
     TOTAL ITEMS
  ======================================== */

  const totalItems = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}