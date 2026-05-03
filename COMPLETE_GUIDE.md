# Quiz Management System - Complete Implementation Guide

## Project Overview

This is a comprehensive **Online Quiz Management System** with support for multiple exam types including traditional quizzes, true/false tests, short-answer questions, and **Coding Exams** with auto-submit functionality.

## Features

### 1. **Quiz Types**
- **Quiz (MCQ)**: Multiple choice questions
- **True/False Exam**: Binary choice questions
- **Short Answer**: Student-written answers requiring teacher review
- **Coding Exam**: Code-based problems with test cases and auto-submit

### 2. **Auto-Submit Functionality**
The system automatically submits exams when:
- ❌ Student leaves the quiz tab/window (tab hidden event)
- ❌ Student loses focus from the browser window (blur event)
- ⏱️ Time expires
- 🔔 Notification arrives (if permissions granted)
- ❌ Developer tools attempted to be opened
- ← Back button pressed

**Auto-submit is recorded with reason** for transparency and auditing.

### 3. **Coding Exam Features**
- Multiple programming languages support (JavaScript, Python, Java, C++, C#)
- Code template for students to start with
- Test case showcase before exam
- Code submission and storage
- Test case validation

### 4. **Teacher Features**
- Create and manage multiple exam types
- Set difficulty levels and passing marks
- Create questions with explanations
- For coding exams: Add test cases and code templates
- Review student submissions
- Manually grade short-answer questions
- View analytics and leaderboards
- Publish/Unpublish exams

### 5. **Student Features**
- Browse and enroll in exams
- Take exams with timer
- View explanations after submission
- Check results and leaderboards
- View attempt history
- Track progress

### 6. **Admin Features**
- User management
- System administration
- Teacher approval/rejection
- User role management

## System Architecture

### Models
- **Quiz**: Main exam entity with metadata
- **Question**: Individual exam questions (supports multiple types)
- **Attempt**: Student exam attempts with answers
- **CodingSubmission**: Code submissions and test results
- **Enrollment**: Student-Quiz relationship
- **User**: Student, Teacher, Admin accounts
- **Leaderboard**: Student rankings
- **Progress**: Student progress tracking

### Database
- **MongoDB**: Primary database
- Connection via Mongoose ORM
- Sessions stored in MongoDB

### Authentication
- **Passport.js**: Authentication framework
- Local strategy with bcryptjs password hashing
- Google OAuth 2.0 support
- Role-based access control (Admin, Teacher, Student)

## Installation & Setup

### Prerequisites
- **Node.js** (v14+)
- **npm** or **yarn**
- **MongoDB** (local or cloud - MongoDB Atlas)

### 1. Clone & Install Dependencies
\`\`\`bash
cd Online-quiz-management-system
npm install
\`\`\`

### 2. Environment Configuration
Create `.env` file with:
\`\`\`env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Session
SESSION_SECRET=your_secret_key_here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Server
PORT=3000
NODE_ENV=development
\`\`\`

### 3. Initialize Database
\`\`\`bash
# Optional: Run reset script to initialize admin user
npm run reset-admin
\`\`\`

### 4. Start Server
\`\`\`bash
# Development
npm run dev

# Production
npm start
\`\`\`

Server runs on: **http://localhost:3000**

## How to Use

### For Teachers

#### 1. Create a Quiz
1. Login as Teacher (or request approval from admin)
2. Go to **Teacher Dashboard** → **Manage Quizzes**
3. Click **Create New Quiz**
4. Select exam type:
   - **Quiz (Mixed/MCQ)**: For multiple choice questions
   - **True/False**: Only true/false questions
   - **Short Question**: Requires manual teacher review
   - **Coding Exam**: For programming tasks
5. Fill in quiz details:
   - Title, Description, Category
   - Duration (minutes)
   - Passing Marks (%)
6. Click **Save Quiz**

#### 2. Add Questions

**For Regular Quizzes:**
1. In quiz edit page, scroll to "Add Question"
2. Enter question text
3. Select question type (Multiple Choice, True/False, Short Answer, Coding)
4. Add options for multiple choice
5. Specify correct answer
6. Add explanation (shown to students after submission)
7. Set marks for the question
8. Click **Add Question**

**For Coding Exams:**
1. Follow same steps but select **Coding** type
2. Select programming language
3. (Optional) Add code template for students
4. Add test cases:
   - Enter test input
   - Enter expected output
   - Click "+ Add Test Case" for more
5. Set marks (usually per test case)
6. Click **Add Question**

#### 3. Publish Quiz
1. Once all questions added, click **Publish** button
2. Quiz becomes available for student enrollment
3. Can unpublish anytime to edit

#### 4. Review Submissions
1. Go to **Quiz** → **View Attempts**
2. See list of student submissions
3. For manual-review questions, click **Review**
4. Award marks for short-answer questions
5. Submit review

#### 5. View Analytics
1. Go to **Quiz** → **Analytics**
2. See average score, pass rate
3. View detailed question statistics
4. Check leaderboard

### For Students

#### 1. Enroll in Exams
1. Login as Student
2. Go to **Browse Exams**
3. Filter by category, difficulty, or type
4. Click **Enroll** on desired exam
5. Exam appears in **My Exams**

#### 2. Take Exam
1. Go to **My Exams** → Select exam
2. Click **Attempt**
3. Read the alert about auto-submit behavior
4. Answer questions:
   - **Multiple Choice**: Select radio button
   - **True/False**: Select radio button
   - **Short Answer**: Type in textarea
   - **Coding**: Write code in editor
5. Watch timer (turns red in last minute)
6. Click **Submit** when done

**⚠️ Important:**
- Leaving tab/window = Auto-submit
- Any notification = Auto-submit
- Developer tools = Auto-submit
- Time up = Auto-submit

#### 3. View Results
1. After submission, automatically redirected to results
2. See:
   - Overall percentage score
   - Pass/Fail status
   - Marks for each question
   - Explanations
   - For pending questions: "Waiting for teacher review"

#### 4. Check History
1. Go to **History**
2. See all attempted exams
3. Click to review any attempt
4. Compare performance over time

#### 5. View Leaderboards
1. Go to **Leaderboard**
2. See top performers
3. Check your ranking
4. View your recent scores

## API Endpoints

### Authentication
- `POST /auth/register` - Student registration
- `POST /auth/login` - User login
- `GET /auth/logout` - Logout
- `POST /auth/teacher-request` - Request teacher role
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset/:token` - Reset password

### Teacher Routes
- `GET /teacher/dashboard` - Teacher dashboard
- `GET /teacher/quizzes` - List quizzes
- `POST /teacher/quizzes` - Create quiz
- `PUT /teacher/quizzes/:quizId` - Update quiz
- `DELETE /teacher/quizzes/:quizId` - Delete quiz
- `PATCH /teacher/quizzes/:quizId/publish` - Publish/unpublish
- `POST /teacher/quizzes/:quizId/questions` - Add question
- `DELETE /teacher/quizzes/:quizId/questions/:questionId` - Delete question
- `GET /teacher/quizzes/:quizId/attempts` - View attempts
- `GET /teacher/attempts/:attemptId/review` - Review attempt
- `PATCH /teacher/attempts/:attemptId/review` - Update review

### Student Routes
- `GET /student/dashboard` - Student dashboard
- `GET /student/quizzes/:quizId/take` - Take exam
- `POST /student/quizzes/:quizId/submit` - Submit exam
- `GET /student/results/:attemptId` - View result
- `GET /student/history` - View all attempts
- `GET /student/quizzes/:quizId/leaderboard` - View leaderboard

### Enrollment Routes
- `GET /enrollments/browse` - Browse exams
- `POST /enrollments/:quizId/enroll` - Enroll in exam
- `GET /enrollments/my-quizzes` - View enrolled exams
- `GET /enrollments/progress` - View progress

## Exam Types Explained

### 1. Quiz (Multiple Choice)
- Students select from multiple options
- Auto-graded immediately
- Results instant
- Supports mixed question types

### 2. True/False
- Binary choice (True/False)
- All options are consistent
- Auto-graded instantly
- Good for quick assessments

### 3. Short Answer
- Students write answers
- Requires teacher review
- Status: "Pending Review"
- Teacher awards marks
- Visible in results after review

### 4. Coding Exam (NEW)
- Students write code
- Multiple test cases provided
- Marked for review (teacher validates)
- Shows code in results
- Language-specific
- Optional code template

## Scoring & Grading

### Auto-Grading (Instant)
- Multiple Choice
- True/False
- Coding (placeholder - shows full marks if code submitted)

### Manual Grading (Teacher Review)
- Short Answer
- Coding (teacher validates against test cases)
- Status: "Pending Review" → "Reviewed"

### Score Calculation
\`\`\`
Total Marks = Sum of all question marks
Student Score = Sum of marks obtained
Percentage = (Student Score / Total Marks) × 100
Pass = Percentage >= Passing Marks %
\`\`\`

## Auto-Submit Behavior

### Triggers
1. **Tab Hidden** (visibilitychange event)
   - Student switches to another tab
   - Browser window hidden

2. **Window Blur** (blur event)
   - Student clicks outside browser
   - Alt+Tab to different app

3. **Time Expired**
   - Countdown reaches 0:00
   - Auto-submission happens

4. **Developer Tools** (Ctrl+Shift+I, F12, etc.)
   - Attempt to open developer console
   - Prevents cheating via console

5. **Back Button** (popstate event)
   - Prevents navigation away
   - Blocks back button clicks

### Result Metadata
Each submission records:
- `autoSubmitted`: boolean (true if auto-submitted)
- `autoSubmitReason`: string (why it was auto-submitted)
- `timeSpent`: number (seconds spent)
- `submittedAt`: timestamp

### Flash Message
Students see message indicating if auto-submitted:
- Normal: "Quiz submitted successfully"
- Auto: "Quiz auto-submitted because you left the quiz tab"

## File Structure

\`\`\`
Online-quiz-management-system/
├── models/
│   ├── Quiz.js
│   ├── Question.js
│   ├── Attempt.js
│   ├── CodingSubmission.js
│   ├── User.js
│   ├── Enrollment.js
│   └── ...
├── controllers/
│   ├── teacherController.js
│   ├── studentController.js
│   ├── enrollmentController.js
│   └── ...
├── routes/
│   ├── teacherRoutes.js
│   ├── studentRoutes.js
│   ├── enrollmentRoutes.js
│   └── ...
├── views/
│   ├── teacher/
│   │   ├── quiz-form.ejs
│   │   ├── attempts.ejs
│   │   └── ...
│   ├── student/
│   │   ├── take-quiz.ejs
│   │   ├── result.ejs
│   │   └── ...
│   └── layouts/
│       └── main.ejs
├── middleware/
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── config/
│   └── passport.js
├── utils/
│   ├── codeValidator.js
│   ├── quizProgress.js
│   └── asyncHandler.js
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── quizTimer.js
│       └── app.js
├── app.js
├── package.json
└── .env
\`\`\`

## Troubleshooting

### Issue: MongoDB Connection Failed
**Solution:**
- Check MongoDB URI in `.env`
- Verify database is running
- Check firewall/security groups
- Verify IP whitelist in MongoDB Atlas

### Issue: Auto-submit Not Working
**Solution:**
- Ensure JavaScript is enabled
- Check browser console for errors
- Clear browser cache
- Test in different browser

### Issue: Coding Questions Not Saving
**Solution:**
- Ensure test cases are filled
- Check server logs for validation errors
- Verify question type is set to "coding"
- Ensure language is selected

### Issue: Student Can't Enroll
**Solution:**
- Quiz must be "Published"
- Student must be logged in
- Quiz must be available for their role

### Issue: Teacher Can't Create Exams
**Solution:**
- Teacher must be "Approved" by admin
- Check teacher status in user profile
- Admin approval required for new teachers

## Security Considerations

### Implemented
✅ Session-based authentication
✅ Password hashing with bcryptjs
✅ CSRF protection via method-override
✅ SQL/NoSQL injection prevention (Mongoose)
✅ Developer tools blocking during exams
✅ Auto-submit on suspicious activity
✅ Role-based access control

### Recommended for Production
- HTTPS/SSL certificates
- Rate limiting on API endpoints
- API key authentication
- Code execution sandboxing
- Proper logging and monitoring
- Regular security audits
- Backup strategies

## Performance Tips

1. **Indexing**: Database indexes on frequently queried fields
2. **Caching**: Cache quiz metadata for students
3. **Pagination**: Paginate large result sets
4. **Image Optimization**: Compress profile pictures
5. **CDN**: Serve static assets from CDN
6. **Database Sharding**: For large scale

## Future Enhancements

- [ ] Code execution with Judge0 API
- [ ] Real-time collaboration features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered question generation
- [ ] Video-proctored exams
- [ ] Question bank management
- [ ] Exam templates and duplication
- [ ] Integration with learning platforms (LMS)
- [ ] Certificate generation

## Support & Documentation

For issues or questions:
1. Check this documentation
2. Review server console logs
3. Check MongoDB for data issues
4. Review browser console for client-side errors

## License

MIT License - See LICENSE file

---

**Last Updated**: May 2026
**Version**: 1.0.0
