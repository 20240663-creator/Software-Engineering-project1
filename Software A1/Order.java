import java.util.ArrayList;
import java.util.List;

public class Order {
    private static int counter = 1;
    private final int id;
    private final int userId;
    private final List<CartItem> items;
    private final double total;
    private final String date;

    public Order(int userId, List<CartItem> items, double total) {
        this.id = counter++;
        this.userId = userId;
        this.items = new ArrayList<>(items);
        this.total = total;
        this.date = java.time.LocalDate.now().toString();
    }

    public int getUserId() { return userId; }

    public void print() {
        System.out.println("  ------------------------------------------");
        System.out.printf("  Order #%d | Date: %s | Status: Confirmed%n", id, date);
        System.out.println("  ------------------------------------------");
        for (CartItem item : items) System.out.println(item);
        System.out.printf("  TOTAL: $%.2f%n", total);
        System.out.println("  ------------------------------------------");
    }
}
