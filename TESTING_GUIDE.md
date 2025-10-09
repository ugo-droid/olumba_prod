# Olumba Testing Guide

## 🧪 Quick Testing Steps

### 1. Start the Server
```bash
cd /Users/ugo_mbelu/Documents/GitHub/olumba_prod
npm start
```

Expected output:
```
🚀 Olumba Server Started

📍 Server running on: http://localhost:3000
📚 API available at: http://localhost:3000/api

Environment: development
```

---

### 2. Test Desktop View

#### A. Home Page
1. Open: `http://localhost:3000`
2. **Check**: Logo displays
3. **Check**: Navigation menu visible (Why Olumba, Features, Testimonials, Log In, Start Free Trial)
4. **Check**: Hero section displays
5. **Check**: Dashboard demo section shows
6. **Check**: Features cards display
7. **Check**: Footer displays

#### B. Login Page
1. Open: `http://localhost:3000/login-clerk.html`
2. **Check**: Clerk sign-in component loads
3. **Check**: Logo displays
4. **Check**: "Sign in" button visible
5. **Check**: Link to register page works

#### C. Dashboard (After Login)
1. Login with test account
2. **Check**: Sidebar appears on left
3. **Check**: User info shows in sidebar
4. **Check**: Navigation links visible (Dashboard, Projects, Tasks, etc.)
5. **Check**: Header with search bar displays
6. **Check**: Main content area shows "Welcome back"
7. **Check**: Stats cards display (Total Projects, Active Tasks, etc.)
8. **Check**: Recent Projects table displays
9. **Check**: My Tasks table displays

#### D. Projects Page
1. Click "Projects" in sidebar
2. **Check**: Projects grid displays
3. **Check**: "New Project" button visible
4. **Check**: Project cards show (or "No projects yet" message)
5. **Check**: Click "New Project" opens modal
6. **Check**: Can create new project

#### E. Tasks Page
1. Click "My Tasks" in sidebar
2. **Check**: Filter tabs display (All, Pending, In Progress, Completed)
3. **Check**: Tasks list displays
4. **Check**: Can filter tasks by status
5. **Check**: Task status dropdown works

---

### 3. Test Mobile View

#### Open Chrome DevTools
1. Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
2. Click "Toggle device toolbar" icon or press `Ctrl+Shift+M`
3. Select device: **iPhone 12 Pro** or **Pixel 5**

#### A. Home Page Mobile
1. Open: `http://localhost:3000`
2. **Check**: Hamburger menu button visible (☰)
3. **Check**: Logo displays
4. **Check**: Desktop nav menu hidden
5. **Click**: Hamburger menu
6. **Check**: Mobile menu slides down
7. **Check**: All nav links visible in mobile menu
8. **Click**: Outside menu to close

#### B. Dashboard Mobile
1. Login and go to dashboard
2. **Check**: Hamburger menu button visible in header
3. **Check**: Sidebar hidden by default
4. **Click**: Hamburger menu
5. **Check**: Sidebar slides in from left
6. **Check**: Dark overlay appears
7. **Check**: Can navigate using sidebar
8. **Click**: Overlay or outside sidebar
9. **Check**: Sidebar closes smoothly
10. **Check**: Mobile search button visible
11. **Click**: Mobile search button
12. **Check**: Search bar expands below header
13. **Check**: Mobile notification button visible

#### C. Tables on Mobile
1. Go to Projects or Dashboard
2. **Check**: Tables are scrollable horizontally
3. **Swipe**: Left and right on table
4. **Check**: All columns accessible
5. **Check**: Text is readable (not too small)

#### D. Forms on Mobile
1. Click "New Project"
2. **Check**: Modal displays properly
3. **Check**: Form fields are touch-friendly
4. **Check**: Keyboard doesn't cover inputs
5. **Check**: Can submit form

---

### 4. Test Onboarding Flow

#### New User (First Time)
1. **Clear browser data** (localStorage)
   - Open DevTools → Application → Local Storage
   - Clear all items
2. Go to: `http://localhost:3000/register-clerk.html`
3. Sign up with new account
4. **Expected**: Redirected to `/onboarding.html?new=true`
5. **Check**: Onboarding page displays
6. **Check**: Progress bar shows "Step 1 of 4"
7. **Click**: "Next" button
8. **Check**: Progresses through all 4 steps
9. **Click**: "Go to Dashboard" on final step
10. **Expected**: Redirected to `/dashboard.html`
11. **Check**: Dashboard displays normally

#### Returning User (Should Skip Onboarding)
1. **Logout** from dashboard
2. Go to: `http://localhost:3000/login-clerk.html`
3. Login with same account
4. **Expected**: Redirected directly to `/dashboard.html`
5. **Check**: NO onboarding page shown
6. **Check**: Dashboard displays immediately

#### Test Onboarding Skip
1. While logged in, try to visit: `http://localhost:3000/onboarding.html`
2. **Expected**: Immediately redirected to `/dashboard.html`
3. **Check**: Cannot access onboarding after completion

---

### 5. Test Navigation

#### Sidebar Navigation
1. From dashboard, click each nav item:
   - ✅ Dashboard
   - ✅ Projects
   - ✅ My Tasks
   - ✅ City Plan Check
   - ✅ Communication Hub
   - ✅ Notifications
   - ✅ Settings
2. **Check**: Each page loads correctly
3. **Check**: Active page is highlighted in sidebar

#### Mobile Navigation
1. Switch to mobile view
2. Open sidebar with hamburger menu
3. Click each nav item
4. **Check**: Sidebar closes after navigation
5. **Check**: New page loads correctly

---

### 6. Test Search Functionality

#### Desktop Search
1. Click in search bar
2. Type: "project"
3. **Check**: Search results dropdown appears
4. **Check**: Results are categorized (Projects, Tasks, Documents)
5. **Click**: A result
6. **Check**: Navigates to correct page

#### Mobile Search
1. Switch to mobile view
2. Click mobile search button
3. **Check**: Search bar expands
4. Type search query
5. **Check**: Results appear
6. **Check**: Can click results

---

### 7. Test Responsive Breakpoints

#### Test at Different Widths
1. Resize browser window or use DevTools
2. Test at these widths:
   - **320px** (Small mobile)
   - **375px** (iPhone)
   - **768px** (Tablet)
   - **1024px** (Small desktop)
   - **1440px** (Large desktop)

#### Check at Each Breakpoint
- ✅ Navigation works
- ✅ Content is readable
- ✅ No horizontal scrolling (except tables)
- ✅ Buttons are clickable
- ✅ Forms are usable
- ✅ Images scale properly

---

### 8. Test Authentication

#### Login Flow
1. Go to login page
2. Enter credentials
3. **Check**: Redirects to dashboard
4. **Check**: User info displays in sidebar

#### Logout Flow
1. Click "Logout" in sidebar
2. **Check**: Redirected to login page
3. **Check**: Cannot access protected pages
4. Try to visit: `http://localhost:3000/dashboard.html`
5. **Expected**: Redirected to login page

#### Protected Pages
1. Without logging in, try to access:
   - `/dashboard.html`
   - `/projects.html`
   - `/tasks.html`
2. **Expected**: All redirect to login page

---

## ✅ Success Criteria

### All Tests Pass When:
- ✅ Server starts without errors
- ✅ All pages display correctly
- ✅ Navigation works on desktop and mobile
- ✅ Onboarding shows once for new users
- ✅ Returning users skip onboarding
- ✅ Mobile menu opens and closes smoothly
- ✅ Tables scroll on mobile
- ✅ Search works on desktop and mobile
- ✅ Authentication flow works correctly
- ✅ No console errors
- ✅ No infinite redirect loops

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find package 'express'"
**Solution**: Run `npm install`

### Issue: Pages not displaying
**Solution**: Check browser console for errors, ensure server is running

### Issue: Onboarding loops
**Solution**: Clear localStorage and test again with fresh signup

### Issue: Mobile menu not working
**Solution**: Check that JavaScript loaded, refresh page

### Issue: Sidebar doesn't close on mobile
**Solution**: Click the overlay or hamburger menu again

---

## 📊 Testing Checklist

Print this and check off as you test:

### Desktop
- [ ] Home page loads
- [ ] Login page works
- [ ] Dashboard displays
- [ ] Projects page works
- [ ] Tasks page works
- [ ] Sidebar navigation works
- [ ] Search works
- [ ] Logout works

### Mobile
- [ ] Hamburger menu appears
- [ ] Sidebar slides in/out
- [ ] Overlay works
- [ ] Mobile search works
- [ ] Tables scroll
- [ ] Forms work
- [ ] All pages accessible

### Onboarding
- [ ] New users see onboarding
- [ ] Onboarding completes
- [ ] Returning users skip onboarding
- [ ] No infinite loops

### Responsive
- [ ] Works at 320px
- [ ] Works at 768px
- [ ] Works at 1024px
- [ ] Works at 1440px

---

## 🎉 You're Done!

If all tests pass, your Olumba app is fully functional and ready for production! 🚀

