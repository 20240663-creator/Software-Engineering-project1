import java.util.List;
import java.util.Scanner;

public class Main {

    static Store store = new Store();
    static Scanner sc  = new Scanner(System.in);

    public static void main(String[] args) {
        System.out.println("\n  Welcome to JavaShop!");
        while (true) {
            authMenu();
        }
    }

    // ─────────────────────────────────────────────────────
    //  AUTH MENU
    // ─────────────────────────────────────────────────────
    static void authMenu() {
        header("JavaShop - Online Store");
        System.out.println("  [1] Login");
        System.out.println("  [2] Register");
        System.out.println("  [0] Exit");
        String choice = prompt("Choose");

        switch (choice) {
            case "1" -> {
                String user = prompt("Username");
                String pass = prompt("Password");
                if (store.login(user, pass)) {
                    ok("Welcome, " + store.getCurrentUser().getUsername() + "!");
                    if (store.isAdmin()) adminMenu();
                    else customerMenu();
                } else {
                    err("Wrong username or password.");
                }
            }
            case "2" -> {
                String user = prompt("Username");
                String pass = prompt("Password");
                if (store.register(user, pass)) ok("Registered! You can now log in.");
                else err("Username already taken.");
            }
            case "0" -> {
                System.out.println("\n  Goodbye!\n");
                System.exit(0);
            }
            default -> err("Invalid option.");
        }
    }

    // ─────────────────────────────────────────────────────
    //  CUSTOMER MENU
    // ─────────────────────────────────────────────────────
    static void customerMenu() {
        while (true) {
            header("Customer Menu");
            System.out.println("  [1] Browse All Products");
            System.out.println("  [2] Browse by Category");
            System.out.println("  [3] Search Products");
            System.out.println("  [4] View Cart");
            System.out.println("  [5] Checkout");
            System.out.println("  [6] My Orders");
            System.out.println("  [0] Logout");
            String choice = prompt("Choose");

            switch (choice) {
                case "1" -> {
                    printProducts(store.getAllProducts());
                    cartAddPrompt();
                }
                case "2" -> browseByCategory();
                case "3" -> searchProducts();
                case "4" -> viewCart();
                case "5" -> checkout();
                case "6" -> myOrders();
                case "0" -> {
                    store.logout();
                    ok("Logged out.");
                    return;
                }
                default -> err("Invalid option.");
            }
        }
    }

    // ─────────────────────────────────────────────────────
    //  ADMIN MENU
    // ─────────────────────────────────────────────────────
    static void adminMenu() {
        while (true) {
            header("Admin Panel");
            System.out.println("  [1] View All Products");
            System.out.println("  [2] Add Product");
            System.out.println("  [3] Remove Product");
            System.out.println("  [4] View All Orders");
            System.out.println("  [0] Logout");
            String choice = prompt("Choose");

            switch (choice) {
                case "1" -> printProducts(store.getAllProducts());
                case "2" -> addProduct();
                case "3" -> removeProduct();
                case "4" -> {
                    header("All Orders");
                    store.printAllOrders();
                }
                case "0" -> {
                    store.logout();
                    ok("Logged out.");
                    return;
                }
                default -> err("Invalid option.");
            }
        }
    }

    // ─────────────────────────────────────────────────────
    //  CUSTOMER ACTIONS
    // ─────────────────────────────────────────────────────
    static void browseByCategory() {
        header("Categories");
        List<String> cats = store.getCategories();
        for (int i = 0; i < cats.size(); i++) {
            System.out.println("  [" + (i + 1) + "] " + cats.get(i));
        }
        try {
            int idx = Integer.parseInt(prompt("Pick category number")) - 1;
            if (idx < 0 || idx >= cats.size()) { err("Invalid choice."); return; }
            printProducts(store.getByCategory(cats.get(idx)));
            cartAddPrompt();
        } catch (NumberFormatException e) {
            err("Please enter a number.");
        }
    }

    static void searchProducts() {
        String kw = prompt("Enter keyword");
        List<Product> results = store.searchProducts(kw);
        if (results.isEmpty()) info("No results found.");
        else { printProducts(results); cartAddPrompt(); }
    }

    static void cartAddPrompt() {
        try {
            int id = Integer.parseInt(prompt("Add to cart? Enter Product ID (or 0 to skip)"));
            if (id == 0) return;
            int qty = Integer.parseInt(prompt("Quantity"));
            if (store.addToCart(id, qty)) ok("Added to cart!");
            else err("Failed. Check product ID, quantity, and stock.");
        } catch (NumberFormatException e) {
            err("Please enter a valid number.");
        }
    }

    static void viewCart() {
        header("Your Cart");
        store.getCart().print();
        if (!store.getCart().isEmpty()) {
            try {
                int id = Integer.parseInt(prompt("Remove item? Enter Product ID (or 0 to skip)"));
                if (id != 0) {
                    store.removeFromCart(id);
                    ok("Item removed.");
                }
            } catch (NumberFormatException e) {
                err("Invalid input.");
            }
        }
    }

    static void checkout() {
        header("Checkout");
        Cart cart = store.getCart();
        if (cart.isEmpty()) { err("Cart is empty!"); return; }
        cart.print();
        String confirm = prompt("Confirm order? (yes/no)");
        if (confirm.equalsIgnoreCase("yes") || confirm.equalsIgnoreCase("y")) {
            Order order = store.checkout();
            if (order != null) { ok("Order placed!"); order.print(); }
            else err("Something went wrong.");
        } else {
            info("Order cancelled.");
        }
    }

    static void myOrders() {
        header("My Orders");
        List<Order> orders = store.getMyOrders();
        if (orders.isEmpty()) info("No orders yet.");
        else for (Order o : orders) o.print();
    }

    // ─────────────────────────────────────────────────────
    //  ADMIN ACTIONS
    // ─────────────────────────────────────────────────────
    static void addProduct() {
        header("Add Product");
        try {
            String name  = prompt("Name");
            String cat   = prompt("Category");
            double price = Double.parseDouble(prompt("Price"));
            int stock    = Integer.parseInt(prompt("Stock"));
            store.addProduct(name, cat, price, stock);
            ok("Product added!");
        } catch (NumberFormatException e) {
            err("Invalid price or stock value.");
        }
    }

    static void removeProduct() {
        printProducts(store.getAllProducts());
        try {
            int id = Integer.parseInt(prompt("Enter Product ID to remove"));
            if (store.removeProduct(id)) ok("Product removed.");
            else err("Product not found.");
        } catch (NumberFormatException e) {
            err("Invalid input.");
        }
    }

    // ─────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────
    static void printProducts(List<Product> products) {
        System.out.println();
        if (products.isEmpty()) { info("No products found."); return; }
        System.out.println("  ID  | Name                   | Category        | Price     | Stock");
        System.out.println("  ----|------------------------|-----------------|-----------|------");
        for (Product p : products) System.out.println("  " + p);
        System.out.println();
    }

    static void header(String title) {
        System.out.println("\n  ======================================");
        System.out.println("   " + title);
        System.out.println("  ======================================");
    }

    static String prompt(String label) {
        System.out.print("  " + label + ": ");
        return sc.nextLine().trim();
    }

    static void ok(String msg)   { System.out.println("  >> " + msg); }
    static void err(String msg)  { System.out.println("  !! " + msg); }
    static void info(String msg) { System.out.println("  -- " + msg); }
}