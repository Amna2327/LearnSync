/**/

#include <iostream>
#include <vector>
#include <string>
using namespace std;

class User;
class Student;
class Instructor;
class Session;
class OnlineMeeting;

class User {
protected:
    int userID;
    string name;
    string email;
    string password;
    string timeZone;
    vector<int> futureSessions;
    vector<int> pastSessions;

public:
    User(int id, string n, string e, string p, string tz)
        : userID(id), name(n), email(e), password(p), timeZone(tz) {}

    virtual ~User() {}

    void login() { cout << name << " logged in.\n"; }
    void signup() { cout << name << " signed up.\n"; }
    void logout() { cout << name << " logged out.\n"; }
    void deleteAccount() { cout << name << "'s account deleted.\n"; }

    void viewPastSessions() {
        if (pastSessions.empty()) {
            cout << "\nNo History!\n";
            return;
        }
        for (int i : pastSessions)
            cout << "Past Session ID: " << i << " (Fetched from DB)\n";
    //fetch past session JSON Object ARR from MYSQL and render it into view 
                
    }

    int getID() const { return userID; }
    string getName() const { return name; }
};

class Student : public User {
private:
    string eduLevel;// level student wants mentorship for (e.g., Highschool)

public:
    Student(int id, string name, string email, string password, string timezone, string level)
        : User(id, name, email, password, timezone), eduLevel(level) {}

    void setSession() {
        cout << name << " created a new session request.\n";
    }

    void sendSessionRequest() { //send request button clicked, session is broadcast into instructors view
        cout << name << " sent a session request (" << eduLevel << " level).\n";
    }

    void joinSession(int sessionID) { //button that lets the student join the session
        cout << name << " joined session ID " << sessionID << ".\n";
        pastSessions.push_back(sessionID);
    }
};

class Instructor : public User {
private:
    vector<string> certifications;
    vector<string> subjectTags;
    vector<string> educationLevelTags;
    vector<string> demoMaterial;
    float rating;

public:
    Instructor(int id, string name, string email, string password, string timezone)
        : User(id, name, email, password, timezone), rating(4.0) {}
    //initial rating starts from 4

    void acceptSession(int sessionID) {//accepts student session request when it comes into view gets 
    //session info when accept button clicked, that info (Session Id) is used to change the status
    // of request, schedule meeting and create a link that ensures no expiry in due time.
        cout << name << " accepted session ID " << sessionID << ". Payment process started.\n";
    }

    void joinSession(int sessionID) { //button that lets them join the session when time starts
        cout << name << " joined session ID " << sessionID << ".\n";
        //joinMeeting() automatically called within this
    }

    void addSubjectTag(const string &tag) { subjectTags.push_back(tag); }
};

class Session{
private:
    int sessionID;
    string description;
    vector<string> subjectTags;
    int studentID;
    int instructorID;
    string dateTime;
    int durationMins;
    string status; //pending, accepted, done

public:
    Session(int id, string desc, int sID, string dt, int dur)
        : sessionID(id), description(desc), studentID(sID),
          instructorID(-1), dateTime(dt), durationMins(dur), status("Pending") {}
 
    void setSession() { //when session info fields are filled by student.sendSessionRequest(), 
    //this function is called which sets up the broadcast to others (button added later, 
    //This object can be saved in the memory for future resuse by students, when they click on setSession())
        cout << "Session #" << sessionID << " created by Student ID " << studentID << ".\n";
    }

    void sendRequest() {
        cout << "Session #" << sessionID << " request sent to instructors.\n";
        status = "Pending";
    }

    void acceptSession(int instID) {
        instructorID = instID;
        status = "Accepted";
        cout << "Session #" << sessionID << " accepted by Instructor ID " << instID << ".\n";
    }

    int getID() const { return sessionID; }
    int getStudentID() const { return studentID; }
    int getInstructorID() const { return instructorID; }
};

class OnlineMeeting { //deals with the meeting API
private:
    int meetingID;
    string link;
    int durationMins;
    int studentID;
    int instructorID;

public:
    OnlineMeeting(int id, int sID, int iID, int dur)
        : meetingID(id), studentID(sID), instructorID(iID), durationMins(dur) {
        link = "https://meetapp.com/session/" + to_string(meetingID);
    }

    void scheduleMeeting() {
        cout << "Meeting #" << meetingID << " scheduled. Link: " << link << "\n";
    }

    void joinMeeting(const string &name) {
        cout << name << " joined meeting via " << link << "\n";
    }
};


int main() {
    
    int mainChoice, subChoice;
    bool exitProgram = false;
    
    cout << "\n========== ONLINE MEETING SYSTEM ==========\n";
    Student s1(1, "Ali", "ali@email.com", "1234", "GMT+5", "University");
    Instructor i1(2, "Dr. Khan", "khan@uni.com", "abcd", "GMT+5");
    
    s1.signup();
    s1.login();
    s1.sendSessionRequest();
    
    Session sess1(101, "Help with Data Structures", s1.getID(), "2025-10-25 17:00", 60);
    sess1.setSession();
    sess1.sendRequest();
    
    i1.acceptSession(sess1.getID());
    sess1.acceptSession(i1.getID());
    
    OnlineMeeting meet1(sess1.getID(), s1.getID(), i1.getID(), 60);
    meet1.scheduleMeeting();
    
    s1.joinSession(sess1.getID());
    i1.joinSession(sess1.getID());
    meet1.joinMeeting(s1.getName()); //functions will be automatically called when student/instructor click sthe join button  
    meet1.joinMeeting(i1.getName());
    
    while (!exitProgram) {
        cout << "\nMain Menu:\n";
        cout << "1. Student Portal\n";
        bool exitProgram = false;
        cout << "2. Instructor Portal\n";
        cout << "3. Exit\n";
        cout << "Enter your choice: ";
        cin >> mainChoice;

        switch (mainChoice) {
        case 1: { // STUDENT PORTAL
            bool exitStudent = false;
            while (!exitStudent) {
                cout << "\n--- Student Menu ---\n";
                cout << "1. Sign Up\n";
                cout << "2. Login\n";
                cout << "3. Create Session\n";
                cout << "4. Send Session Request\n";
                cout << "5. Join Session\n";
                cout << "6. View Past Sessions\n";
                cout << "7. Logout to Main Menu\n";
                cout << "Enter your choice: ";
                cin >> subChoice;

                switch (subChoice) {
                case 1: s1.signup(); break;
                case 2: s1.login(); break;
                case 3: s1.setSession(); sess1.setSession(); break;
                case 4: s1.sendSessionRequest(); sess1.sendRequest(); break;
                case 5: s1.joinSession(sess1.getID()); meet1.joinMeeting(s1.getName()); break;
                case 6: s1.viewPastSessions(); break;
                case 7: s1.logout(); exitStudent = true; break;
                default: cout << "Invalid option!\n";
                }
            }
            break;
        }

        case 2: { // INSTRUCTOR PORTAL
            bool exitInstructor = false;
            while (!exitInstructor) {
                cout << "\n--- Instructor Menu ---\n";
                cout << "1. Sign Up\n";
                cout << "2. Login\n";
                cout << "3. Accept Session Request\n";
                cout << "4. Join Session\n";
                cout << "5. View Past Sessions\n";
                cout << "6. Logout to Main Menu\n";
                cout << "Enter your choice: ";
                cin >> subChoice;

                switch (subChoice) {
                case 1: i1.signup(); break;
                case 2: i1.login(); break;
                case 3:
                i1.acceptSession(sess1.getID());
                    sess1.acceptSession(i1.getID());
                    meet1.scheduleMeeting();
                    break;
                case 4:
                    i1.joinSession(sess1.getID());
                    meet1.joinMeeting(i1.getName());
                    break;
                case 5: i1.viewPastSessions(); break;
                case 6:
                    i1.logout();
                    exitInstructor = true;
                    break;
                default:
                    cout << "Invalid option!\n";
                }
            }
            break;
        }

        case 3:
            cout << "Exiting program...\n";
            exitProgram = true;
            break;

        default:
        cout << "Invalid option! Try again.\n";
        }
    }

    return 0;
}
