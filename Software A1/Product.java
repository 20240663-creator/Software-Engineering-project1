public class Product {
    private static int counter = 1;
    private final int id;
    private String name;
    private String category;
    private double price;
    private int stock;

    public Product(String name, String category, double price, int stock) {
        this.id = counter++;
        this.name = name;
        this.category = category;
        this.price = price;
        this.stock = stock;
    }

    public int getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public double getPrice() { return price; }
    public int getStock() { return stock; }
    
    public void setName(String name) { this.name = name; }
    public void setCategory(String cat) { this.category = cat; }
    public void setPrice(double price) { this.price = price; }
    public void setStock(int stock) { this.stock = stock; }
    public void reduceStock(int qty) { this.stock -= qty; }

    @Override
    public String toString() {
        return String.format("[%d] %-22s | %-15s | $%-8.2f | Stock: %d",
                id, name, category, price, stock);
    }
}
