# Testing Guide - Quiz Management System

## Pre-Testing Checklist

- [ ] MongoDB is running and connection verified
- [ ] `.env` file configured with valid MongoDB URI
- [ ] All dependencies installed: `npm install`
- [ ] No compilation errors: `npm run dev`
- [ ] Server running on http://localhost:3000

## Test Scenarios

### 1. User Registration & Authentication

**Step 1: Register as Student**
1. Navigate to http://localhost:3000
2. Click "Register"
3. Select "Student" role
4. Fill in details:
   - Name: Test Student
   - Email: student@test.com
   - Password: test123
5. Click Register
6. ✅ Verify: Redirected to student dashboard

**Step 2: Register as Teacher**
1. Navigate to http://localhost:3000/auth/register
2. Select "Teacher" role
3. Fill in details:
   - Name: Test Teacher
   - Email: teacher@test.com
   - Password: test123
4. Click Register
5. ✅ Verify: See "Pending Approval" message
6. ✅ Verify: Admin approval needed

**Step 3: Approve Teacher (as Admin)**
1. Login as Admin (or create admin via reset script)
2. Go to Admin Dashboard
3. Find pending teacher: "Test Teacher"
4. Click Approve
5. ✅ Verify: Teacher now can access /teacher/dashboard

### 2. Quiz Creation (Teacher)

**Step 1: Create MCQ Quiz**
1. Login as approved Teacher
2. Go to **Teacher Dashboard** → **Manage Quizzes**
3. Click **Create New Quiz**
4. Fill form:
   - Title: "JavaScript Basics Quiz"
   - Description: "Test your JS knowledge"
   - Category: "Programming"
   - Exam Type: "Quiz (Mixed / MCQ)" ← **Select this**
   - Difficulty: "Easy"
   - Duration: 10 minutes
   - Passing Marks: 60%
5. Click **Save Quiz**
6. ✅ Verify: Redirected to quiz edit page

**Step 2: Add Multiple Choice Question**
1. On quiz edit page, scroll to "Add Question"
2. Fill form:
   - Question Text: "What is JavaScript?"
   - Question Type: "Multiple Choice" ← **Select this**
   - Options:
     - Option 1: A programming language
     - Option 2: A design tool
     - Option 3: A database
     - Option 4: A server
   - Correct Answer: "A programming language"
   - Explanation: "JavaScript is a programming language used for web development"
   - Marks: 5
3. Click **Add Question**
4. ✅ Verify: Question appears in questions list

**Step 3: Add Coding Question**
1. Still on quiz edit page (or go back)
2. **Change Exam Type to "Coding Exam"**
   - Go back to quiz form
   - Change examType to "Coding Exam"
   - Save
   - Return to edit page
3. Scroll to "Add Question"
4. Fill form:
   - Question Text: "Write a function to add two numbers"
   - Question Type: "Coding" ← **Select this**
   - Programming Language: "JavaScript" ← **auto-appears**
   - Code Template:
     \`\`\`
     function add(a, b) {
       // Your code here
       return 0;
     }
     \`\`\`
   - Test Cases:
     - Input: "2 3" → Output: "5"
     - Input: "10 20" → Output: "30"
     - Input: "-5 5" → Output: "0"
   - Explanation: "This function accepts two parameters and returns their sum"
   - Marks: 10
5. Click **Add Question**
6. ✅ Verify: Coding question appears with language and test case badges

**Step 4: Publish Quiz**
1. On quiz edit page, find and click **Publish** button
2. ✅ Verify: Status changes to "Published"
3. ✅ Verify: Quiz now available for student enrollment

### 3. Quiz Enrollment & Taking (Student)

**Step 1: Enroll in Quiz**
1. Login as Test Student
2. Go to **Browse Exams**
3. See "JavaScript Basics Quiz" in list (if not visible, filter by category or type)
4. Click **Enroll**
5. ✅ Verify: Flash message "Enrolled in..."
6. ✅ Verify: Redirected to **My Exams** page

**Step 2: Take Regular Quiz**
1. On **My Exams** page, find "JavaScript Basics Quiz"
2. Click **Attempt**
3. ✅ Verify: See quiz title, category, timer
4. ✅ Verify: Timer counts down from 10:00
5. ✅ Verify: Warning message about auto-submit
6. Answer questions:
   - Select radio buttons for MCQ
   - Answer is automatically stored
7. Click **Submit Quiz**
8. ✅ Verify: Redirected to results page

**Step 3: View Results**
1. On results page, verify:
   - ✅ Percentage score shown
   - ✅ Pass/Fail status
   - ✅ Questions with your answers
   - ✅ Correct answers shown
   - ✅ Explanations displayed
   - ✅ Marks breakdown

**Step 4: Take Coding Quiz** (if created with coding exam type)
1. Enroll in coding quiz
2. Click **Attempt**
3. ✅ Verify: See test cases displayed
4. ✅ Verify: Code template shown (if set)
5. ✅ Verify: Code editor appears
6. Write code:
   \`\`\`javascript
   function add(a, b) {
     return a + b;
   }
   \`\`\`
7. Click **Submit Exam**
8. ✅ Verify: Submission successful
9. ✅ Verify: Status shows "Pending Review" (for teacher grading)

### 4. Auto-Submit Functionality

**Step 1: Test Tab Hidden Event**
1. Login as Student
2. Enroll in a new quiz
3. Click **Attempt**
4. Start answering (don't submit manually)
5. **Switch to another browser tab** ← TEST THIS
6. ✅ Verify: Quiz form auto-submits
7. ✅ Verify: Flash message mentions auto-submit
8. ✅ Verify: `autoSubmitted` = true in database

**Step 2: Test Window Blur Event**
1. Take a new quiz attempt
2. Start answering
3. **Click outside browser window** (e.g., on taskbar)
4. ✅ Verify: Quiz auto-submits
5. ✅ Verify: Auto-submit reason shows "window_blur"

**Step 3: Test Time Expiration**
1. Create quiz with 1 minute duration
2. Student takes it
3. **Wait 61 seconds**
4. ✅ Verify: Timer reaches 0:00 (turns red after 60 sec)
5. ✅ Verify: Quiz auto-submits
6. ✅ Verify: Auto-submit reason shows "time_up"

**Step 4: Test Developer Tools Block**
1. Take a new quiz
2. **Press F12** or Ctrl+Shift+I
3. ✅ Verify: Developer tools block attempt
4. ✅ Verify: Quiz auto-submits with reason "dev_tools_attempted"

### 5. Teacher Review (Short Answer / Coding)

**Step 1: Create Short Answer Quiz**
1. As Teacher, create new quiz with type "Short Question"
2. Add questions with type "Short Answer"
3. Publish quiz

**Step 2: Student Takes Short Answer Quiz**
1. As Student, enroll and take quiz
2. Write responses in textareas
3. Submit
4. ✅ Verify: Status shows "Pending Review"

**Step 3: Teacher Reviews**
1. As Teacher, go to quiz → **View Attempts**
2. See student attempt
3. Click **Review**
4. See student's answers
5. Award marks for each short answer
6. Click **Submit Review**
7. ✅ Verify: Status changes to "Reviewed"

**Step 4: Student Sees Final Grade**
1. As Student, view results again
2. ✅ Verify: Marks now shown (not pending)
3. ✅ Verify: Teacher's scores visible

### 6. Leaderboard & Progress

**Step 1: View Leaderboard**
1. As Student, complete 2-3 quizzes
2. Go to **Leaderboard**
3. ✅ Verify: See top performers
4. ✅ Verify: Your ranking shown
5. ✅ Verify: Scores sorted correctly

**Step 2: Check Progress**
1. As Student, go to **Progress**
2. ✅ Verify: See total quizzes taken
3. ✅ Verify: Category-wise breakdown
4. ✅ Verify: Statistics updated

### 7. Quiz Management (Teacher)

**Step 1: Edit Quiz**
1. As Teacher, go to quiz
2. Click **Edit**
3. Change title/description
4. Click Save
5. ✅ Verify: Changes saved
6. ✅ Can still delete/add questions

**Step 2: Delete Question**
1. On quiz edit page
2. Find a question you added
3. Click **Remove** button
4. ✅ Verify: Question removed
5. ✅ Verify: Total marks recalculated

**Step 3: Unpublish Quiz**
1. On quiz edit page
2. Click **Publish** (to unpublish)
3. ✅ Verify: Status changes to "Draft"
4. ✅ Verify: Students cannot enroll

**Step 4: View Analytics**
1. As Teacher, go to quiz
2. Click **Analytics**
3. ✅ Verify: See average score
4. ✅ Verify: Pass rate percentage
5. ✅ Verify: Question statistics

### 8. Role-Based Access Control

**Step 1: Test Student Cannot Access Teacher Routes**
1. As Student, try to access: http://localhost:3000/teacher/dashboard
2. ✅ Verify: Access denied message
3. ✅ Verify: Redirected to appropriate page

**Step 2: Test Teacher Cannot Access Admin Routes**
1. As Teacher, try to access: http://localhost:3000/admin/dashboard
2. ✅ Verify: Access denied
3. ✅ Verify: Proper error handling

**Step 3: Test Admin Full Access**
1. As Admin, access all dashboards
2. ✅ Verify: Can see all sections
3. ✅ Verify: User management works

## Performance Testing

### Test 1: Quiz Loading Time
- [ ] Create quiz with 50 questions
- [ ] Load take-quiz page
- [ ] Measure page load time
- ✅ Verify: Loads within 2 seconds

### Test 2: Results Page Performance
- [ ] View results with 50 questions
- [ ] Check page responsiveness
- ✅ Verify: Smooth interaction

### Test 3: Concurrent Users
- [ ] Have 5+ students take exams simultaneously
- [ ] Monitor server resource usage
- ✅ Verify: No crashes or timeouts

## Database Testing

### Check Collections

```bash
# Connect to MongoDB
mongo "mongodb+srv://username:password@cluster.mongodb.net/database"

# View collections
show collections

# Sample queries
db.quizzes.find().pretty()
db.attempts.find().pretty()
db.users.find().pretty()
```

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari
- [ ] Chrome Mobile

## Error Scenarios

### Test 1: Invalid Login
1. Try login with wrong email/password
2. ✅ Verify: Error message shown
3. ✅ Verify: Not redirected to dashboard

### Test 2: Session Expiry
1. Login as student
2. Wait 7+ days (or modify session expiry)
3. Refresh page
4. ✅ Verify: Redirected to login

### Test 3: Network Error During Submission
1. Take a quiz
2. Disable network before clicking submit
3. ✅ Verify: Appropriate error message
4. ✅ Verify: Can retry

### Test 4: Incomplete Form Submission
1. Try to create quiz without title
2. ✅ Verify: Form validation error
3. ✅ Verify: Required fields highlighted

## Final Verification Checklist

- [ ] All quiz types working (Quiz, True/False, Short Answer, Coding)
- [ ] Auto-submit on all triggers (tab, blur, time, dev tools)
- [ ] Teacher can create/edit/delete quizzes
- [ ] Students can enroll and take exams
- [ ] Results and scores calculated correctly
- [ ] Leaderboards show correct rankings
- [ ] Manual review works for short/coding questions
- [ ] Role-based access control enforced
- [ ] Flash messages shown appropriately
- [ ] No JavaScript errors in browser console
- [ ] Database shows all records correctly
- [ ] Timer counts down accurately
- [ ] Auto-submit metadata logged correctly
- [ ] Explanations shown to students
- [ ] Progress tracking updated
- [ ] All routes protected with authentication
- [ ] Mobile responsive design works
- [ ] Code editor accepts and stores code
- [ ] Test cases display properly
- [ ] Navigation between pages smooth

## Known Limitations

1. **Code Execution**: Currently placeholder (consider Judge0 API for production)
2. **File Uploads**: Not supported for code submissions
3. **Real-time Notifications**: Not implemented (can add Socket.io)
4. **Video Proctoring**: Not built-in (can integrate with existing services)
5. **Internationalization**: Not implemented

## Debugging Commands

```bash
# View server logs
npm run dev

# Check database connection
mongo "mongodb_uri"

# Clear all sessions
# (via MongoDB admin interface)

# Reset admin user
npm run reset-admin

# Check Node version
node --version

# Check npm version
npm --version
```

---

**Test Date**: _____________
**Tested By**: _____________
**Status**: ✅ PASSED / ❌ FAILED
