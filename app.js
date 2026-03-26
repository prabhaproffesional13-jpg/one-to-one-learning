// --- Database / State ---
const DB_KEY = 'edu_learn_db';
const COURSES = [
    { id: 'fullstack', name: 'Full Stack Web Development', icon: 'fa-laptop-code', desc: 'Master HTML, CSS, JS, React, and Node.js with personalized guidance.' },
    { id: 'datascience', name: 'Data Science & AI', icon: 'fa-chart-pie', desc: 'Dive into Python, Machine Learning, and Neural Networks.' },
    { id: 'uiux', name: 'UI/UX Design Masterclass', icon: 'fa-pen-nib', desc: 'Design beautiful interfaces with Figma and modern design principles.' }
];

const TRAINERS = {
    'Beginner Trainer': {
        email: 'anbu@train.com',
        password: '1234',
        name: 'Anbu Sir',
        experience: '2 Years',
        specialization: 'Basics of HTML, CSS'
    },
    'Intermediate Trainer': {
        email: 'kavya@train.com',
        password: '1234',
        name: 'Kavya Mam',
        experience: '4 Years',
        specialization: 'JavaScript and Web Development'
    },
    'Advanced Trainer': {
        email: 'arjun@train.com',
        password: '1234',
        name: 'Arjun Sir',
        experience: '6 Years',
        specialization: 'Full Stack Development'
    }
};

let appState = {
    users: {},     // email -> user object
    currentUser: null, // email
    currentRole: 'student' // 'student' or 'trainer'
};

// --- Initialization ---
function init() {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
        appState = JSON.parse(saved);
        if (appState.currentUser && !appState.currentRole) {
            appState.currentRole = 'student';
        }
    }
    
    if (appState.currentUser) {
        if (appState.currentRole === 'trainer') {
            showTrainerDashboard();
        } else {
            showDashboard();
        }
    } else {
        navigateTo('auth-view');
        document.getElementById('navbar').classList.add('hidden');
    }
    
    attachEventListeners();
}

function saveState() {
    localStorage.setItem(DB_KEY, JSON.stringify(appState));
}

// --- Navigation ---
function navigateTo(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active', 'hidden'));
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
}

// --- Auth ---
function switchAuthTab(tab) {
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-signup').classList.remove('active');
    document.getElementById('tab-' + tab).classList.add('active');
    
    if (tab === 'login') {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('signup-form').classList.add('hidden');
    } else {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('signup-form').classList.remove('hidden');
    }
}

function attachEventListeners() {
    // Signup
    document.getElementById('signup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        if (appState.users[email]) {
            alert('Email already registered.');
            return;
        }
        
        appState.users[email] = {
            name, email, password,
            aptitudeScore: null,
            assignedTrainer: null,
            courses: {} // id -> { progress, quizScore, assignmentSubmitted, completed }
        };
        appState.currentUser = email;
        saveState();
        showDashboard();
    });

    // Login
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const roleInputs = document.querySelectorAll('input[name="loginRole"]');
        let selectedRole = 'student';
        roleInputs.forEach(input => { if (input.checked) selectedRole = input.value; });
        
        if (selectedRole === 'trainer') {
            const trainerEntry = Object.values(TRAINERS).find(t => t.email === email && t.password === password);
            if (trainerEntry) {
                appState.currentUser = email;
                appState.currentRole = 'trainer';
                saveState();
                showTrainerDashboard();
            } else {
                alert('Invalid trainer credentials.');
            }
        } else {
            const user = appState.users[email];
            if (user && user.password === password) {
                appState.currentUser = email;
                appState.currentRole = 'student';
                saveState();
                showDashboard();
            } else {
                alert('Invalid student credentials.');
            }
        }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        appState.currentUser = null;
        appState.currentRole = null;
        saveState();
        document.getElementById('navbar').classList.add('hidden');
        navigateTo('auth-view');
    });

    // Aptitude Test
    document.getElementById('aptitude-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        let score = 0;
        for (let value of formData.values()) {
            score += parseInt(value);
        }
        
        let trainerLevel = 'Beginner Trainer';
        if (score >= 40 && score < 70) trainerLevel = 'Intermediate Trainer';
        else if (score >= 70) trainerLevel = 'Advanced Trainer';
        
        const user = appState.users[appState.currentUser];
        user.aptitudeScore = score;
        user.assignedTrainer = trainerLevel;
        saveState();
        
        alert(`You scored ${score}/100. Assigned to: ${TRAINERS[trainerLevel].name} (${trainerLevel})`);
        showDashboard();
    });

    // Quiz
    document.getElementById('quiz-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        let score = 0;
        for (let value of formData.values()) {
            score += parseInt(value);
        }
        
        const user = appState.users[appState.currentUser];
        const courseId = document.getElementById('quiz-form').dataset.courseId;
        
        if (!user.courses[courseId]) initUserCourse(user, courseId);
        user.courses[courseId].quizScore = (score/2)*100;
        
        updateProgress(user, courseId);
        saveState();
        alert(`Quiz submitted successfully! Score: ${(score/2)*100}%`);
        showCourse(courseId);
    });

    // Assignment
    document.getElementById('assignment-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const user = appState.users[appState.currentUser];
        const courseId = document.getElementById('assignment-form').dataset.courseId;
        
        if (!user.courses[courseId]) initUserCourse(user, courseId);
        user.courses[courseId].assignmentSubmitted = true;
        
        updateProgress(user, courseId);
        saveState();
        alert('Assignment submitted successfully!');
        showCourse(courseId);
    });
}

function initUserCourse(user, courseId) {
    user.courses[courseId] = {
        progress: 0,
        quizScore: null,
        assignmentSubmitted: false,
        completed: false
    };
}

function updateProgress(user, courseId) {
    let progress = 0;
    const course = user.courses[courseId];
    if (course.quizScore !== null) progress += 50;
    if (course.assignmentSubmitted) progress += 50;
    
    course.progress = progress;
    if (progress === 100) {
        course.completed = true;
    }
}

// --- Trainer Dashboard ---
function showTrainerDashboard() {
    document.getElementById('navbar').classList.remove('hidden');
    
    // Find trainer
    const trainerLevel = Object.keys(TRAINERS).find(level => TRAINERS[level].email === appState.currentUser);
    const trainer = TRAINERS[trainerLevel];
    
    document.getElementById('nav-user-name').innerText = `Trainer - ${trainer.name}`;
    document.getElementById('trainer-dashboard-name').innerText = trainer.name;
    
    navigateTo('trainer-dashboard-view');
    
    const container = document.getElementById('trainer-students-container');
    container.innerHTML = '';
    
    let assignedStudents = Object.values(appState.users).filter(u => u.assignedTrainer === trainerLevel);
    
    if (assignedStudents.length === 0) {
        // Add default student as requested
        assignedStudents.push({
            name: 'Prabhavathi',
            email: 'prabhavathi@student.com',
            aptitudeScore: 85
        });
    }

    assignedStudents.forEach(student => {
            const card = document.createElement('div');
            card.className = 'course-card glass-panel';
            card.style = 'cursor: default;';
            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--secondary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #fff;">
                        ${student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 style="margin: 0; color: white;">${student.name}</h3>
                        <p style="margin: 0; font-size: 0.9em; color: var(--text-muted);">${student.email}</p>
                    </div>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
                    <div style="font-size: 0.9em; color: white;"><strong>Aptitude Score:</strong> ${student.aptitudeScore}/100</div>
                    <p style="font-size: 0.85em; color: var(--success); margin-top: 0.5rem;"><i class="fas fa-check-circle"></i> You are assigned to guide this student</p>
                </div>
                <button onclick="window.open('https://meet.google.com', '_blank')" class="btn-primary w-100" style="text-align: center; display: block; border: none; font-size: 1rem;"><i class="fas fa-video"></i> Start Class</button>
            `;
            container.appendChild(card);
        });
}

// --- Dashboard ---
function showDashboard() {
    const user = appState.users[appState.currentUser];
    document.getElementById('navbar').classList.remove('hidden');
    document.getElementById('nav-user-name').innerText = `Hi, ${user.name}`;
    
    navigateTo('dashboard-view');
    
    const banner = document.getElementById('trainer-info-banner');
    const aptitudePrompt = document.getElementById('aptitude-prompt');
    const coursesGrid = document.getElementById('courses-container');
    
    if (user.aptitudeScore === null) {
        banner.innerHTML = `<strong>Status:</strong> New Student. Please take the aptitude test.`;
        aptitudePrompt.classList.remove('hidden');
        coursesGrid.classList.add('hidden');
    } else {
        const t = TRAINERS[user.assignedTrainer] || { name: user.assignedTrainer, experience: 'N/A', specialization: 'N/A' };
        banner.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <strong style="font-size: 1.2rem;">Your Trainer: ${t.name}</strong> <span style="opacity:0.8; font-size: 0.9em;">(${user.assignedTrainer})</span><br>
                    <small>Based on Aptitude Score: ${user.aptitudeScore}/100</small>
                    <p style="margin-top: 0.8rem; font-size: 0.95rem; color: var(--success);"><i class="fas fa-check-circle"></i> You are assigned a personal trainer for one-to-one learning</p>
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.9rem; text-align: left; border: 1px solid rgba(255,255,255,0.2);">
                    <div style="margin-bottom: 0.4rem;"><i class="fas fa-briefcase" style="margin-right: 0.5rem; color: var(--primary);"></i><strong>Experience:</strong> ${t.experience}</div>
                    <div><i class="fas fa-star" style="margin-right: 0.5rem; color: #f1c40f;"></i><strong>Specialization:</strong> ${t.specialization}</div>
                </div>
            </div>
        `;
        aptitudePrompt.classList.add('hidden');
        coursesGrid.classList.remove('hidden');
        renderCourses(user);
    }
}

function renderCourses(user) {
    const container = document.getElementById('courses-container');
    container.innerHTML = '';
    
    COURSES.forEach(c => {
        const userCourse = user.courses[c.id] || { progress: 0 };
        
        const card = document.createElement('div');
        card.className = 'course-card glass-panel';
        card.innerHTML = `
            <div class="course-card-img"><i class="fas ${c.icon}"></i></div>
            <h3>${c.name}</h3>
            <p>${c.desc}</p>
            <div class="course-progress-bar">
                <div class="course-progress-fill" style="width: ${userCourse.progress}%"></div>
            </div>
            <p class="mt-2 text-right text-muted" style="font-size: 0.8rem">${userCourse.progress}% Completed</p>
        `;
        card.addEventListener('click', () => showCourse(c.id));
        container.appendChild(card);
    });
}

// --- Course View ---
function showCourse(courseId) {
    const user = appState.users[appState.currentUser];
    const course = COURSES.find(c => c.id === courseId);
    if (!user.courses[courseId]) initUserCourse(user, courseId);
    const userCourse = user.courses[courseId];
    
    navigateTo('course-view');
    document.getElementById('course-title').innerText = course.name;
    document.getElementById('course-desc').innerText = course.desc;
    document.getElementById('course-progress').style.width = `${userCourse.progress}%`;
    
    // Setup references
    document.getElementById('quiz-form').dataset.courseId = courseId;
    document.getElementById('assignment-form').dataset.courseId = courseId;
    
    // Quiz State
    const quizBadge = document.getElementById('quiz-status');
    const quizBtn = document.getElementById('btn-take-quiz');
    if (userCourse.quizScore !== null) {
        quizBadge.innerText = `Completed (${userCourse.quizScore}%)`;
        quizBadge.classList.add('completed');
        quizBtn.innerText = 'Retake Quiz';
    } else {
        quizBadge.innerText = 'Pending';
        quizBadge.classList.remove('completed');
        quizBtn.innerText = 'Take Quiz';
    }
    
    // Assignment State
    const assignBadge = document.getElementById('assignment-status');
    const assignBtn = document.getElementById('btn-do-assignment');
    if (userCourse.assignmentSubmitted) {
        assignBadge.innerText = 'Submitted';
        assignBadge.classList.add('completed');
        assignBtn.innerText = 'Update Assignment';
    } else {
        assignBadge.innerText = 'Pending';
        assignBadge.classList.remove('completed');
        assignBtn.innerText = 'Submit Assignment';
    }
    
    // Certificate State
    const certAction = document.getElementById('certificate-action');
    if (userCourse.completed) {
        certAction.classList.remove('hidden');
    } else {
        certAction.classList.add('hidden');
    }
}

function generateCertificate() {
    const user = appState.users[appState.currentUser];
    const courseTitle = document.getElementById('course-title').innerText;
    
    document.getElementById('cert-student-name').innerText = user.name;
    document.getElementById('cert-course-name').innerText = courseTitle;
    document.getElementById('cert-date-span').innerText = new Date().toLocaleDateString();
    
    navigateTo('certificate-view');
}

// Start App
init();
