import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  async function getProduct(productId: number) {
    return await api.get(`products/${productId}`)
  }

  async function getStockProduct(productId: number) {
    return await api.get(`stock/${productId}`)
  }

  function updateCart(products: Product[]) {
    setCart(products)
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))
  }

  const addProduct = async (productId: number) => {
    try {
      const productFromCart = cart.find(product => product.id == productId)

      if (productFromCart) {
        updateProductAmount({productId: productId, amount: productFromCart.amount + 1})
      } else {
        const product = (await getProduct(productId)).data as Product
        product.amount = 1
        updateCart([...cart, product])
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const hasProduct = cart.find(product => productId == product.id)

      if (hasProduct) {
        const newCart = cart.filter(product => product.id != productId)
        updateCart(newCart)
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  function updateProductAmountInCart(product: Product) {
    updateCart(cart.map(prod => {
      if (prod.id == product.id) {
        return product
      }
      return prod
    }))
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productFromCart = cart.find(product => product.id == productId)

      if (productFromCart) {
        if (productFromCart.amount > amount) {
          if (amount > 0) {
            productFromCart.amount = amount
            updateProductAmountInCart(productFromCart)
          }
        } else {
          const stock = (await getStockProduct(productId)).data as Stock
  
          if (stock.amount > productFromCart.amount) {
            productFromCart.amount = amount
            updateProductAmountInCart(productFromCart)
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        }
      } else {
        toast.error('Erro na alteração de quantidade do produto')
      }      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
