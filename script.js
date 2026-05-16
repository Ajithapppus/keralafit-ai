// --- Theme Management ---
const themeToggle = document.getElementById('themeToggle');
const htmlEl = document.documentElement;
let isDark = true;

themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    htmlEl.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    if(window.weightChartInstance) {
        window.weightChartInstance.options.scales.x.grid.color = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        window.weightChartInstance.options.scales.y.grid.color = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        window.weightChartInstance.options.plugins.legend.labels.color = isDark ? '#fff' : '#000';
        window.weightChartInstance.update();
    }
});

// --- State Management ---
let userData = {
    name: '', gender: '', age: 0, height: 0, currentWeight: 0, 
    targetWeight: 0, activityLevel: '', sleepHours: 0, 
    workType: '', healthConditions: '',
    bmi: 0, dailyCalories: 0, waterGoal: 0, timelineWeeks: 0
};
let waterConsumed = 0;

// --- Onboarding Logic ---
const steps = document.querySelectorAll('.form-step');
const nextBtns = document.querySelectorAll('.next-btn');
const prevBtns = document.querySelectorAll('.prev-btn');
const onboardingForm = document.getElementById('onboardingForm');
const progressBar = document.getElementById('onboardingProgress');
let currentStep = 1;

function updateStep() {
    steps.forEach(step => {
        if(parseInt(step.dataset.step) === currentStep) {
            step.classList.add('active-step');
        } else {
            step.classList.remove('active-step');
        }
    });
    progressBar.style.width = `${(currentStep / 3) * 100}%`;
}

nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Simple validation
        const inputs = steps[currentStep-1].querySelectorAll('input[required], select[required]');
        let valid = true;
        inputs.forEach(input => {
            if(!input.value) { valid = false; input.style.borderColor = 'red'; }
            else { input.style.borderColor = ''; }
        });
        if(valid && currentStep < 3) {
            currentStep++;
            updateStep();
        }
    });
});

prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if(currentStep > 1) {
            currentStep--;
            updateStep();
        }
    });
});

// --- Calculations ---
function calculateMetrics() {
    // Collect data
    userData.name = document.getElementById('userName').value;
    userData.gender = document.getElementById('userGender').value;
    userData.age = parseInt(document.getElementById('userAge').value);
    userData.height = parseInt(document.getElementById('userHeight').value);
    userData.currentWeight = parseInt(document.getElementById('userWeight').value);
    userData.targetWeight = parseInt(document.getElementById('targetWeight').value);
    userData.activityLevel = document.getElementById('activityLevel').value;
    userData.sleepHours = parseInt(document.getElementById('sleepHours').value);
    
    // BMI
    const heightM = userData.height / 100;
    userData.bmi = (userData.currentWeight / (heightM * heightM)).toFixed(1);
    
    // BMR (Mifflin-St Jeor)
    let bmr = (10 * userData.currentWeight) + (6.25 * userData.height) - (5 * userData.age);
    bmr += (userData.gender === 'male') ? 5 : -161;
    
    // Activity Multiplier
    const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
    const tdee = bmr * multipliers[userData.activityLevel];
    
    // Weight Loss Calories (Deficit of 500)
    userData.dailyCalories = Math.round(tdee - 500);
    if(userData.gender === 'female' && userData.dailyCalories < 1200) userData.dailyCalories = 1200;
    if(userData.gender === 'male' && userData.dailyCalories < 1500) userData.dailyCalories = 1500;
    
    // Water (ml) - 35ml per kg + extra for activity
    userData.waterGoal = Math.round(userData.currentWeight * 35);
    if(userData.activityLevel === 'moderate' || userData.activityLevel === 'active') userData.waterGoal += 500;
    
    // Timeline (0.5kg per week safe loss)
    const weightToLose = userData.currentWeight - userData.targetWeight;
    userData.timelineWeeks = Math.max(1, Math.round(weightToLose / 0.5));
}

// --- Dashboard Population ---
function populateDashboard() {
    // Header
    document.getElementById('welcomeName').textContent = `Hello, ${userData.name.split(' ')[0]}`;
    document.getElementById('welcomeDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    // AI Analysis
    document.getElementById('calcBMI').textContent = userData.bmi;
    let bmiStatus = '';
    if(userData.bmi < 18.5) bmiStatus = 'Underweight';
    else if(userData.bmi < 25) bmiStatus = 'Normal';
    else if(userData.bmi < 30) bmiStatus = 'Overweight';
    else bmiStatus = 'Obese';
    document.getElementById('bmiStatus').textContent = bmiStatus;
    
    document.getElementById('calcCalories').textContent = userData.dailyCalories;
    document.getElementById('calcTimeline').textContent = userData.timelineWeeks;
    document.getElementById('calcLoss').textContent = (userData.currentWeight - userData.targetWeight).toFixed(1);
    
    // Water
    document.getElementById('waterGoal').textContent = userData.waterGoal;
    updateWaterUI();
    
    // Generate Plans
    generateKeralaDiet();
    generateWorkout();
    initChart();
}

// --- Form Submit ---
onboardingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateMetrics();
    document.getElementById('onboardingView').classList.remove('active-view');
    document.getElementById('dashboardView').classList.add('active-view');
    populateDashboard();
});

// --- Water Tracker ---
const waterBtns = document.querySelectorAll('.water-btn');
const waterCurrentEl = document.getElementById('waterCurrent');
const waterFill = document.getElementById('waterFill');

function updateWaterUI() {
    waterCurrentEl.textContent = waterConsumed;
    let percentage = (waterConsumed / userData.waterGoal) * 100;
    if(percentage > 100) percentage = 100;
    waterFill.style.height = `${percentage}%`;
}

waterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const amount = parseInt(btn.dataset.amount);
        waterConsumed += amount;
        updateWaterUI();
    });
});

// --- Dashboard Navigation ---
const navLinks = document.querySelectorAll('.nav-links li');
const dashSections = document.querySelectorAll('.dash-section');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        dashSections.forEach(s => s.classList.remove('active-section'));
        
        link.classList.add('active');
        document.getElementById(link.dataset.target).classList.add('active-section');
    });
});

// --- Kerala Diet Database & Generation ---
const dietDB = {
    breakfast: [
        { items: "2 Appam or Puttu with Kadala Curry, 1 cup Green Tea", cals: 350, protein: 12, badFor: [] },
        { items: "3 Idiyappam with Egg Roast", cals: 320, protein: 18, badFor: ["veg"] },
        { items: "2 Dosa with Sambar and Coconut Chutney", cals: 300, protein: 8, badFor: [] },
        { items: "Oats Upma with mixed vegetables (Carrot, Beans)", cals: 250, protein: 7, badFor: [] },
        { items: "2 slices Whole Wheat Bread with Peanut Butter & Banana", cals: 300, protein: 10, badFor: ["diabetes"] }
    ],
    midMorning: [
        { items: "1 glass Tender Coconut Water", cals: 50, protein: 1, badFor: [] },
        { items: "1 glass Spiced Buttermilk (Sambharam)", cals: 40, protein: 3, badFor: [] },
        { items: "1 small Apple or Papaya bowl", cals: 60, protein: 1, badFor: [] },
        { items: "A handful of Almonds & Walnuts", cals: 150, protein: 5, badFor: [] }
    ],
    lunch: [
        { items: "1 cup Kerala Red Rice, Fish Curry, Avial, Thoran", cals: 450, protein: 25, badFor: ["veg"] },
        { items: "1 cup Kerala Red Rice, Sambar, Cabbage Thoran, Pulissery", cals: 400, protein: 12, badFor: [] },
        { items: "2 Chapathi with Chicken Curry (less coconut) and Salad", cals: 420, protein: 28, badFor: ["veg"] },
        { items: "1 cup Brown Rice, Green Gram (Cherupayar) Curry, Mezhukkupuratti", cals: 380, protein: 15, badFor: [] }
    ],
    eveningSnack: [
        { items: "1 Black Tea (Kattan Chaya), 1 boiled Nendran Banana", cals: 150, protein: 2, badFor: ["diabetes"] },
        { items: "1 Green Tea, Sundal (Boiled Chickpeas)", cals: 120, protein: 6, badFor: [] },
        { items: "1 Filter Coffee (no sugar), 2 Rusk", cals: 90, protein: 2, badFor: [] },
        { items: "Makhana (Fox nuts) roasted in ghee", cals: 100, protein: 3, badFor: [] }
    ],
    dinner: [
        { items: "2 Wheat Dosa with Tomato Chutney", cals: 200, protein: 6, badFor: [] },
        { items: "1 large bowl of Vegetable Soup and 1 Appam", cals: 180, protein: 4, badFor: [] },
        { items: "2 Chapathi with Dal (Parippu) Curry", cals: 250, protein: 10, badFor: [] },
        { items: "Grilled Fish / Chicken breast with steamed veggies", cals: 300, protein: 35, badFor: ["veg"] }
    ]
};

let currentDietPlan = {};

function getRandomMeal(mealType, conditions) {
    const options = dietDB[mealType];
    const conditionStr = conditions.toLowerCase();
    
    // Filter out bad foods based on conditions
    let validOptions = options.filter(meal => {
        if(conditionStr.includes('diabet') && meal.badFor.includes('diabetes')) return false;
        if((conditionStr.includes('veg') || conditionStr.includes('vegetarian')) && meal.badFor.includes('veg')) return false;
        return true;
    });
    
    // Fallback if filtering removes everything
    if(validOptions.length === 0) validOptions = options; 
    
    return validOptions[Math.floor(Math.random() * validOptions.length)];
}

function generateKeralaDiet() {
    const dietTimeline = document.getElementById('dietTimeline');
    const conditions = userData.healthConditions || '';
    
    // Generate initial random diet
    const mealStructure = [
        { key: 'breakfast', time: "08:00 AM", name: "Breakfast" },
        { key: 'midMorning', time: "11:00 AM", name: "Mid-Morning" },
        { key: 'lunch', time: "01:30 PM", name: "Lunch" },
        { key: 'eveningSnack', time: "04:30 PM", name: "Evening Snack" },
        { key: 'dinner', time: "08:00 PM", name: "Dinner" }
    ];

    if(Object.keys(currentDietPlan).length === 0) {
        mealStructure.forEach(meal => {
            currentDietPlan[meal.key] = getRandomMeal(meal.key, conditions);
        });
    }

    renderDietPlan(mealStructure);
}

function renderDietPlan(mealStructure) {
    const dietTimeline = document.getElementById('dietTimeline');
    let html = '';
    
    mealStructure.forEach(meal => {
        const selectedFood = currentDietPlan[meal.key];
        html += `
            <div class="glass-panel meal-card fade-in">
                <div class="meal-time">${meal.time}</div>
                <div class="meal-details">
                    <h4>${meal.name}</h4>
                    <p>${selectedFood.items}</p>
                    <div class="meal-macros">
                        <span><i class="fas fa-fire"></i> ${selectedFood.cals} kcal</span>
                        <span><i class="fas fa-drumstick-bite"></i> ${selectedFood.protein}g</span>
                    </div>
                </div>
                <button class="btn btn-outline btn-sm swap-meal-btn" data-mealkey="${meal.key}" title="Swap Food">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        `;
    });
    dietTimeline.innerHTML = html;

    // Attach Swap Event Listeners
    document.querySelectorAll('.swap-meal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const key = btn.dataset.mealkey;
            const conditions = userData.healthConditions || '';
            const currentFoodItems = currentDietPlan[key].items;
            
            // Get a new random meal that is DIFFERENT from the current one
            let newMeal = getRandomMeal(key, conditions);
            let attempts = 0;
            while(newMeal.items === currentFoodItems && attempts < 5) {
                newMeal = getRandomMeal(key, conditions);
                attempts++;
            }
            
            currentDietPlan[key] = newMeal;
            renderDietPlan(mealStructure); // Re-render
        });
    });
}


// --- Workout Generation ---
function generateWorkout() {
    const workoutGrid = document.getElementById('workoutGrid');
    const isBeginner = userData.activityLevel === 'sedentary';
    
    const workouts = [
        { icon: "fa-walking", name: "Brisk Walking", desc: "Start your day with a brisk walk.", duration: "30 mins", cals: "150 kcal" },
        { icon: "fa-child", name: "Surya Namaskar", desc: "Traditional yoga for full body stretch.", duration: "15 mins", cals: "100 kcal" },
        { icon: "fa-dumbbell", name: "Bodyweight Squats", desc: "3 sets of 15 reps.", duration: "10 mins", cals: "80 kcal" },
        { icon: "fa-running", name: isBeginner ? "Knee Pushups" : "Standard Pushups", desc: "3 sets of 10-15 reps.", duration: "10 mins", cals: "90 kcal" },
        { icon: "fa-bed", name: "Plank Hold", desc: isBeginner ? "3 sets of 20 seconds" : "3 sets of 60 seconds", duration: "5 mins", cals: "50 kcal" }
    ];

    let html = '';
    workouts.forEach(w => {
        html += `
            <div class="glass-panel workout-card fade-in">
                <div class="workout-icon"><i class="fas ${w.icon} fa-2x"></i></div>
                <div class="workout-details">
                    <h4>${w.name}</h4>
                    <p>${w.desc}</p>
                    <div class="workout-stats">
                        <span><i class="fas fa-clock"></i> ${w.duration}</span>
                        <span><i class="fas fa-fire-alt"></i> ${w.cals}</span>
                    </div>
                </div>
                <button class="btn btn-outline btn-sm"><i class="fas fa-check"></i></button>
            </div>
        `;
    });
    workoutGrid.innerHTML = html;
}

// --- Chart.js Setup ---
function initChart() {
    const ctx = document.getElementById('weightChart').getContext('2d');
    
    // Generate mock data for the graph based on user goals
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
    const current = userData.currentWeight;
    const target = userData.targetWeight;
    const diff = (current - target) / 6;
    const data = [current, current - diff, current - diff*2, current - diff*3, current - diff*4, current - diff*5];

    window.weightChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Projected Weight (kg)',
                data: data,
                borderColor: '#00d2ff',
                backgroundColor: 'rgba(0, 210, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#1dd1a1',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: isDark ? '#fff' : '#000', font: { family: 'Outfit' } } }
            },
            scales: {
                x: { grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }, ticks: { color: isDark ? '#94a3b8' : '#636e72' } },
                y: { grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }, ticks: { color: isDark ? '#94a3b8' : '#636e72' } }
            }
        }
    });
}

// --- Chatbot Logic ---
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatMessages = document.getElementById('chatMessages');

const botResponses = [
    "Drinking tender coconut water daily is excellent for hydration and replenishing electrolytes!",
    "For weight loss, try substituting white rice with Kerala Red Rice (Matta rice) - it's high in fiber.",
    "Make sure to include protein in your diet. Kadala curry and Green gram are great vegetarian options.",
    "A brisk 30-minute walk every morning can do wonders for your metabolism.",
    "Limit the amount of coconut in your curries if you are strictly tracking calories.",
    "Don't skip breakfast! Puttu with cherupayar is a highly nutritious start to your day."
];

function addMessage(text, isBot) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
    msgDiv.innerHTML = `<p>${text}</p>`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendChatBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if(text) {
        addMessage(text, false);
        chatInput.value = '';
        
        // Mock bot delay
        setTimeout(() => {
            const randomReply = botResponses[Math.floor(Math.random() * botResponses.length)];
            addMessage(randomReply, true);
        }, 1000);
    }
});

chatInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendChatBtn.click();
});

// --- PDF Download Logic ---
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('dashboardView');
        const opt = {
            margin:       10,
            filename:     'KeralaFit_Plan.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Hide sidebar temporarily for cleaner PDF
        const sidebar = document.querySelector('.sidebar');
        sidebar.style.display = 'none';
        
        html2pdf().set(opt).from(element).save().then(() => {
            // Restore sidebar
            sidebar.style.display = 'flex';
        });
    });
}

// --- Photo Upload Logic ---
const photoUpload = document.getElementById('photoUpload');
const photoGallery = document.getElementById('photoGallery');

if (photoUpload) {
    photoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'photo-item fade-in';
                imgDiv.innerHTML = `<img src="${event.target.result}" alt="Progress Photo">`;
                photoGallery.appendChild(imgDiv);
            }
            reader.readAsDataURL(file);
        }
    });
}

// --- Language Toggle Logic ---
const langToggle = document.getElementById('langToggle');
let isMalayalam = false;

const translations = {
    en: {
        welcome: "Hello,",
        dietTitle: "Kerala Diet Plan",
        workoutTitle: "Your Workouts",
        remindersTitle: "Reminders",
        photosTitle: "Progress Photos",
        quote: `"A year from now you may wish you had started today."`
    },
    ml: {
        welcome: "നമസ്കാരം,",
        dietTitle: "കേരള ഡയറ്റ് പ്ലാൻ",
        workoutTitle: "നിങ്ങളുടെ വർക്ക്ഔട്ടുകൾ",
        remindersTitle: "ഓർമ്മപ്പെടുത്തലുകൾ",
        photosTitle: "പ്രോഗ്രസ് ഫോട്ടോകൾ",
        quote: `"ഇന്ന് തുടങ്ങിയിരുന്നെങ്കിൽ എന്ന് ഒരു വർഷത്തിന് ശേഷം നിങ്ങൾ ആഗ്രഹിച്ചേക്കാം."`
    }
};

if (langToggle) {
    langToggle.addEventListener('click', () => {
        isMalayalam = !isMalayalam;
        langToggle.textContent = isMalayalam ? 'ML' : 'EN';
        
        const lang = isMalayalam ? 'ml' : 'en';
        
        // Update basic UI elements
        const welcomeEl = document.getElementById('welcomeName');
        if (welcomeEl && userData.name) {
            welcomeEl.textContent = `${translations[lang].welcome} ${userData.name.split(' ')[0]}`;
        }
        
        const dietH2 = document.querySelector('#dash-diet .section-header h2');
        if(dietH2) dietH2.textContent = translations[lang].dietTitle;
        
        const workoutH2 = document.querySelector('#dash-workout .section-header h2');
        if(workoutH2) workoutH2.textContent = translations[lang].workoutTitle;
        
        const quoteEl = document.getElementById('motivationalQuote');
        if(quoteEl) quoteEl.textContent = translations[lang].quote;
    });
}

