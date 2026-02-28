public class CartItem {
    private final Product product;
    private int quantity;

    public CartItem(Product product, int quantity) {
        this.product = product;
        this.quantity = quantity;
    }

    public Product getProduct() { return product; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int qty) { this.quantity = qty; }
    public double getSubtotal() { return product.getPrice() * quantity; }

    @Override
    public String toString() {
        return String.format("  %-22s | Qty: %-3d | $%.2f",
                product.getName(), quantity, getSubtotal());
    }
}
