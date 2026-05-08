import java.util.*;
import java.util.Vector;




class subject{
    private String name = "";
    private String appreciation = "No-info";
    private final int grade;
    private int hours = 0;

    public subject(String nm, int g, int h){
        name = nm;
        grade = g;
        hours = h;

        if (grade >= 96) appreciation = "A+";
        else if (grade >= 92) appreciation = "A";
        else if (grade >= 88) appreciation = "A-";
        else if (grade >= 84) appreciation = "B+";
        else if (grade >= 80) appreciation = "B";
        else if (grade >= 76) appreciation = "B-";
        else if (grade >= 72) appreciation = "C+";
        else if (grade >= 68) appreciation = "C";
        else if (grade >= 64) appreciation = "C-";
        else if (grade >= 60) appreciation = "D+";
        else if (grade >= 55) appreciation = "D";
        else if (grade >= 50) appreciation = "D-";
        else appreciation = "F";
    }

    public double get_gpa(){
        if (Objects.equals(appreciation, "A+")) return  4;
        else if (Objects.equals(appreciation, "A")) return  3.7;
        else if (Objects.equals(appreciation, "A-")) return  3.4;
        else if (Objects.equals(appreciation, "B+")) return  3.2;
        else if (Objects.equals(appreciation, "B")) return  3;
        else if (Objects.equals(appreciation, "B-")) return  2.8;
        else if (Objects.equals(appreciation, "C+")) return  2.6;
        else if (Objects.equals(appreciation, "C")) return  2.4;
        else if (Objects.equals(appreciation, "C-")) return  2.2;
        else if (Objects.equals(appreciation, "D+")) return  2;
        else if (Objects.equals(appreciation, "D")) return  1.5;
        else if (Objects.equals(appreciation, "D-")) return  1;
        else return 0;
    }

    public String getAppreciation() {
        return appreciation;
    }

    public int getHours() {
        return hours;
    }

    public int getGrade() {
        return grade;
    }

    public String getName(){
        return name;
    }

}

class Student{
    private String name;
    private int ID = 0;
    private float gpa = 0;
    private int num_of_subjects = 0;
    private int num_of_hours = 0;
    private Vector<subject> subs = new Vector<>();
    private int pre_hours = 0;
    private double CPA;

    public Student(String nm,int id, float g, Vector<subject> s, int ph){
        name = nm;
        gpa = g;
        ID = id;
        subs = s;
        pre_hours = ph;
        num_of_subjects = s.size();
        for (subject sub : s){
            num_of_hours += sub.getHours();
        }
    }

    public void setCPA(double gpa) {
        this.CPA = gpa;
    }

    public double getCPA() {
        return CPA;
    }

    public float getGpa() {
        return gpa;
    }

    public int getNum_of_hours() {
        return num_of_hours;
    }


    public String getName() {
        return name;
    }

    public int getID() {
        return ID;
    }

    public Vector<subject> getSubs() {
        return subs;
    }

    public int getPre_hours() {
        return pre_hours;
    }
}

class calculate_gpa{
    private Vector<Student> studs;

    calculate_gpa(Vector<Student> st){
        studs = st;
    }

    public double set_current_gpa(Vector<subject> subs) {
        if (subs.isEmpty()){
            return 0;
        }
        int total_hours = 0;
        double total_gpa = 0;

        for (subject s : subs) {
            total_hours += s.getHours();
            total_gpa += s.get_gpa() * s.getHours();
        }

        return total_gpa / total_hours;
    }

    public double CPA(double pre_gpa, double cur_gpa, int pre_hours, int cur_hours){
        return ((pre_gpa * pre_hours) + (cur_gpa * cur_hours)) / (pre_hours + cur_hours);
    }

    public void display_info(){
        for (Student stud : studs){
            System.out.println("-------------------------");
            System.out.println("Student " + stud.getName());
            System.out.println("ID : " + stud.getID());
            for (subject sub : stud.getSubs()){
                System.out.println("----" + sub.getName() + "----");
                System.out.println("Your grade : " + sub.getGrade());
                System.out.println("Subject GPA : " + sub.get_gpa());
                System.out.println("Subject appreciation : " + sub.getAppreciation());
            }
            System.out.println("GPA for this semester : " + set_current_gpa(stud.getSubs()));
            System.out.println("Cumulative GPA : " + CPA(stud.getGpa(),set_current_gpa(stud.getSubs())
            ,stud.getPre_hours(),stud.getNum_of_hours()));
            stud.setCPA(CPA(stud.getGpa(),set_current_gpa(stud.getSubs())
                    ,stud.getPre_hours(),stud.getNum_of_hours()));
        }
    }

    public void dis_ranked(){
        for (int i = 0; i < studs.size() - 1; i++){
            for (int j = i + 1; j < studs.size(); j++){
                if (studs.get(i).getCPA() < studs.get(j).getCPA()){
                    Student t = studs.get(i);
                    studs.set(i, studs.get(j));
                    studs.set(j, t);
                }
            }
        }
        System.out.println(" ======================================  ");
        System.out.println("Rank of students : ");
        int count = 1;
        for (Student s : studs){
            System.out.println("Student " + s.getName() + " in place " + count + " with CPA " + s.getCPA());
            count++;
        }
    }
}




public class Main {

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Vector<Student> studs = new Vector<>();

        System.out.println("Hello in our program.");
        System.out.println("Enter the number of students");
        int num_of_students = in.nextInt();
        in.nextLine();

        for (int i = 0; i < num_of_students; i++){
            Vector<subject> subs = new Vector<>();
            System.out.println("Enter the name of student " + (i + 1));
            String name = in.nextLine();

            System.out.println("Enter ID : ");
            int ID = in.nextInt();

            System.out.println("Enter the current gpa : ");
            float gpa = in.nextFloat();

            System.out.println("Enter number of pre hours : ");
            int pre_hours = in.nextInt();

            System.out.println("Enter the number of subjects :");
            int num_of_subjects = in.nextInt();
            in.nextLine();

            for (int j = 0; j < num_of_subjects; j++){
                System.out.println("Enter the name of subject " + (j + 1));
                String sub_name = in.nextLine();
                System.out.println("Enter the grade : ");
                int grade = in.nextInt();
                in.nextLine();
                System.out.println("Enter num of hours : ");
                int hours = in.nextInt();
                in.nextLine();
                subject subj = new subject(sub_name,grade,hours);
                subs.add(subj);
            }
            Student s = new Student(name,ID,gpa,subs,pre_hours);
            studs.add(s);
        }

        calculate_gpa process = new calculate_gpa(studs);
        process.display_info();
        process.dis_ranked();
    }
}
