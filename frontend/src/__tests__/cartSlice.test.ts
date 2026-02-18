import cartReducer, { addItem, updateQuantity, removeItem, clearCart, setCart } from '../store/slices/cartSlice';

const sampleItem = {
  id: 'item-1',
  productId: 'prod-1',
  name: 'Test Widget',
  price: 29.99,
  quantity: 1,
  image: '/img.jpg',
  variant: undefined as string | undefined,
};

const sampleItem2 = {
  id: 'item-2',
  productId: 'prod-2',
  name: 'Another Widget',
  price: 49.99,
  quantity: 2,
  image: '/img2.jpg',
  variant: 'blue',
};

describe('cartSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const emptyState = { items: [] as any[], total: 0 };

  describe('addItem', () => {
    it('should add a new item to an empty cart', () => {
      const state = cartReducer(emptyState, addItem(sampleItem as any));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('Test Widget');
      expect(state.total).toBeCloseTo(29.99);
    });

    it('should increment quantity of existing item with same productId', () => {
      const first = cartReducer(emptyState, addItem(sampleItem as any));
      const second = cartReducer(first, addItem({ ...sampleItem, quantity: 3 } as any));
      expect(second.items).toHaveLength(1);
      expect(second.items[0].quantity).toBe(4);
      expect(second.total).toBeCloseTo(4 * 29.99);
    });

    it('should treat different variants as separate items', () => {
      const first = cartReducer(emptyState, addItem(sampleItem as any));
      const second = cartReducer(first, addItem({ ...sampleItem, id: 'item-1b', variant: 'red' } as any));
      expect(second.items).toHaveLength(2);
    });

    it('should persist cart to localStorage', () => {
      cartReducer(emptyState, addItem(sampleItem as any));
      const stored = JSON.parse(localStorage.getItem('comspace_cart')!);
      expect(stored.items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity by id', () => {
      const withItem = cartReducer(emptyState, addItem(sampleItem as any));
      const updated = cartReducer(withItem, updateQuantity({ id: 'item-1', quantity: 5 }));
      expect(updated.items[0].quantity).toBe(5);
      expect(updated.total).toBeCloseTo(5 * 29.99);
    });

    it('should do nothing for unknown id', () => {
      const withItem = cartReducer(emptyState, addItem(sampleItem as any));
      const updated = cartReducer(withItem, updateQuantity({ id: 'unknown', quantity: 10 }));
      expect(updated.items[0].quantity).toBe(1);
    });
  });

  describe('removeItem', () => {
    it('should remove item by id', () => {
      let state = cartReducer(emptyState, addItem(sampleItem as any));
      state = cartReducer(state, addItem(sampleItem2 as any));
      const result = cartReducer(state, removeItem('item-1'));
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('item-2');
      expect(result.total).toBeCloseTo(2 * 49.99);
    });
  });

  describe('clearCart', () => {
    it('should remove all items and reset total', () => {
      let state = cartReducer(emptyState, addItem(sampleItem as any));
      state = cartReducer(state, addItem(sampleItem2 as any));
      const cleared = cartReducer(state, clearCart());
      expect(cleared.items).toHaveLength(0);
      expect(cleared.total).toBe(0);
    });
  });

  describe('setCart', () => {
    it('should replace entire cart with provided items', () => {
      const items = [sampleItem, sampleItem2];
      const state = cartReducer(emptyState, setCart(items as any));
      expect(state.items).toHaveLength(2);
      expect(state.total).toBeCloseTo(29.99 + 2 * 49.99);
    });
  });

  describe('total computation', () => {
    it('should correctly sum price * quantity for all items', () => {
      let state = cartReducer(emptyState, addItem({ ...sampleItem, quantity: 3 } as any));
      state = cartReducer(state, addItem(sampleItem2 as any));
      expect(state.total).toBeCloseTo(189.95);
    });
  });
});
