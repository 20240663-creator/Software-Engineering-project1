import java.util.ArrayList;
import java.util.List;

public class Cart {
    private final List<CartItem> items = new ArrayList<>();

    public void addItem(Product p, int qty) {
        for (CartItem item : items) {
            if (item.getProduct().getId() == p.getId()) {
                item.setQuantity(item.getQuantity() + qty);
                return;
            }
        }
        items.add(new CartItem(p, qty));
    }

    public void removeItem(int productId) {
        for (int i = 0; i < items.size(); i++) {
            if (items.get(i).getProduct().getId() == productId) {
                items.remove(i);
                return;
            }
        }
    }

    public List<CartItem> getItems() { return items; }
    public boolean isEmpty() { return items.isEmpty(); }
    public void clear() { items.clear(); }

    public double getTotal() {
        double total = 0;
        for (CartItem item : items) total += item.getSubtotal();
        return total;
    }

    public void print() {
        if (items.isEmpty()) {
            System.out.println("  Cart is empty.");
            return;
        }
        System.out.println("  ------------------------------------------");
        for (CartItem item : items) System.out.println(item);
        System.out.println("  ------------------------------------------");
        System.out.printf("  TOTAL: $%.2f%n", getTotal());
    }
}
