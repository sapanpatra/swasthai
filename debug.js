
        // SUPABASE CONFIG
        const SB_URL = "https://sglswoouzatiktspopwe.supabase.co";
        const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbHN3b291emF0aWt0c3BvcHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1ODUxMzAsImV4cCI6MjA5MjE2MTEzMH0.vwWhzNKaCLCxtDTEbxXH72MUetAphJYxbHAH4hSzkoE";
        
        let supabase;
        try {
            supabase = window.supabase.createClient(SB_URL, SB_KEY);
            console.log("Supabase initialized");
        } catch (e) {
            console.error("Supabase Init Error:", e);
        }

        // GLOBAL DATA STORAGE
        let currentAiData = null;
        let currentUser = null;

        // UI ELEMENTS
        const loadingOverlay = document.getElementById('loadingOverlay');
        const voiceModal = document.getElementById('voiceModal');
        const voiceModalContent = document.getElementById('voiceModalContent');
        const micPulse = document.getElementById('micPulse');
        const voiceText = document.getElementById('voiceText');

        // UI View Switcher
        function showView(viewId) {
            console.log("Switching to view:", viewId);
            const views = ['viewHome', 'viewAnalysis', 'viewAuth', 'viewProfile'];
            views.forEach(v => {
                const el = document.getElementById(v);
                if (el) el.classList.add('hidden');
            });
            const target = document.getElementById(viewId);
            if (target) target.classList.remove('hidden');
            window.scrollTo(0,0);
        }

        // AUTH LOGIC
        async function checkUser() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                currentUser = session?.user || null;
                updateNavUI();
                if (currentUser) {
                    fetchProfile();
                    fetchHistory();
                }
            } catch (e) {
                console.error("CheckUser error:", e);
            }
        }

        function updateNavUI() {
            const profileBtn = document.getElementById('navProfileBtn');
            if (profileBtn) {
                if (currentUser) {
                    profileBtn.classList.remove('opacity-50');
                    const icon = profileBtn.querySelector('span');
                    if (icon) icon.innerText = "account_circle";
                } else {
                    profileBtn.classList.add('opacity-50');
                    const icon = profileBtn.querySelector('span');
                    if (icon) icon.innerText = "person_pin";
                }
            }
        }

        function handleProfileNav() {
            if (currentUser) showView('viewProfile');
            else showView('viewAuth');
        }

        async function loginWithGoogle() {
            try {
                const { error } = await supabase.auth.signInWithOAuth({ 
                    provider: 'google',
                    options: { redirectTo: window.location.href.split('#')[0].split('?')[0] }
                });
                if (error) throw error;
            } catch (e) {
                alert("Google Login Error: " + e.message);
            }
        }

        const btnAuthEmail = document.getElementById('btnAuthEmail');
        if (btnAuthEmail) {
            btnAuthEmail.onclick = async () => {
                const email = document.getElementById('authEmail').value;
                const password = document.getElementById('authPassword').value;
                if (!email || !password) return alert("Email and Password required");

                try {
                    let { data, error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) {
                        // Try signup
                        const { data: sData, error: sError } = await supabase.auth.signUp({ 
                            email, 
                            password,
                            options: { data: { full_name: "Swasth User" } }
                        });
                        if (sError) throw sError;
                        alert("Account created! Check email for verification.");
                    } else {
                        currentUser = data.user;
                        updateNavUI();
                        closeAuth(); // Assuming there's an auth modal closure
                    }
                } catch (e) {
                    alert("Auth Error: " + e.message);
                }
            };
        }

        async function logout() {
            await supabase.auth.signOut();
            currentUser = null;
            updateNavUI();
        }

        // PROFILE LOGIC
        async function fetchProfile() {
            try {
                const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
                if (data) {
                    document.getElementById('profileNameDisplay').innerText = data.full_name || "Swasth User";
                    document.getElementById('profileEmailDisplay').innerText = currentUser.email;
                    const initial = (data.full_name || 'U')[0].toUpperCase();
                    document.getElementById('userInitial').innerText = initial;
                    document.getElementById('profileAge').value = data.age || "";
                    document.getElementById('profileGender').value = data.gender || "Male";
                }
            } catch (e) {
                console.error("Profile fetch error:", e);
            }
        }

        const btnSaveProfile = document.getElementById('btnSaveProfile');
        if (btnSaveProfile) {
            btnSaveProfile.onclick = async () => {
                const age = document.getElementById('profileAge').value;
                const gender = document.getElementById('profileGender').value;
                try {
                    const { error } = await supabase.from('profiles').update({ age, gender }).eq('id', currentUser.id);
                    if (error) throw error;
                    alert("Profile updated!");
                } catch (e) {
                    alert("Error: " + e.message);
                }
            };
        }

        async function fetchHistory() {
            try {
                const { data, error } = await supabase.from('scans_history')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                const list = document.getElementById('historyList');
                if (data && data.length > 0) {
                    list.innerHTML = data.map(item => `
                        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                <span class="material-symbols-outlined text-primary">medical_services</span>
                            </div>
                            <div class="flex-1">
                                <h4 class="font-bold text-sm">${item.diagnosis?.diagnosis || "Scan Result"}</h4>
                                <p class="text-[10px] opacity-50">${new Date(item.created_at).toLocaleDateString()}</p>
                            </div>
                            <span class="material-symbols-outlined opacity-30">chevron_right</span>
                        </div>
                    `).join('');
                }
            } catch (e) {
                console.error("History fetch error:", e);
            }
        }

        // Logic to Render analysis
        function renderAnalysis(data, imageSrc) {
            currentAiData = data;
            
            document.getElementById('resImage').src = imageSrc || "https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=200&q=80";
            document.getElementById('resProblem').innerText = data.problem;
            document.getElementById('resDiagnosis').innerText = data.diagnosis;
            document.getElementById('resNote').innerText = "ℹ️ Note: " + (data.note || "Doctor se milna zaroori hai.");
            
            const sev = (data.severity || 'MEDIUM').toUpperCase();
            const sevCard = document.getElementById('resSeverityCard');
            const sevIcon = document.getElementById('resSeverityIcon');
            const sevLabel = document.getElementById('resSeverityLabel');
            
            if (sev === 'HIGH') {
                sevCard.className = "p-5 rounded-xl bg-error-container text-on-error-container border-error shadow-lg";
                sevIcon.innerText = "warning";
                sevLabel.innerText = "3. 📊 Severity: HIGH";
            } else if (sev === 'LOW') {
                sevCard.className = "p-5 rounded-xl bg-green-50 text-green-800 border-green-200";
                sevIcon.innerText = "check_circle";
                sevLabel.innerText = "3. 📊 Severity: LOW (Minor)";
            } else {
                sevCard.className = "p-5 rounded-xl bg-yellow-50 text-yellow-800 border-yellow-200";
                sevIcon.innerText = "info";
                sevLabel.innerText = "3. 📊 Severity: MEDIUM";
            }
            document.getElementById('resSeverityReason').innerText = data.severityReason;

            const populateList = (id, items, bullet) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.innerHTML = '';
                (items || []).forEach(it => {
                    const li = document.createElement('li');
                    li.innerText = (bullet ? bullet + " " : "") + it;
                    el.appendChild(li);
                });
            };
            populateList('resActionsList', data.actions, '✅');
            populateList('resWarningsList', data.warnings, '⚠️');

            const ayurWrap = document.getElementById('resAyurvedaWrapper');
            if (data.ayurvedaRemedies && data.ayurvedaRemedies.length > 0) {
                ayurWrap.classList.remove('hidden');
                populateList('resAyurvedaList', data.ayurvedaRemedies, '🍃');
            } else {
                ayurWrap.classList.add('hidden');
            }

            const reportWrap = document.getElementById('resReportWrapper');
            const reportList = document.getElementById('resReportList');
            if (data.report && data.report.length > 0) {
                reportWrap.classList.remove('hidden');
                reportList.innerHTML = '';
                data.report.forEach(item => {
                    const div = document.createElement('div');
                    div.className = "bg-white p-4 rounded-xl shadow-sm border border-blue-50";
                    div.innerHTML = `<h4 class="font-bold">${item.title}</h4><p class="text-sm opacity-80">${item.desc}</p>`;
                    reportList.appendChild(div);
                });
            } else {
                reportWrap.classList.add('hidden');
            }

            // Save to history if logged in
            if (currentUser) {
                supabase.from('scans_history').insert({
                    user_id: currentUser.id,
                    symptoms: "",
                    diagnosis: data,
                    image_url: ""
                }).then(() => fetchHistory());
            }

            showView('viewAnalysis');
            document.getElementById('openChatBtn').classList.remove('hidden');
        }

        // BACKEND FETCH
        async function callAnalysis(file, symptoms) {
            loadingOverlay.classList.remove('opacity-0', 'pointer-events-none');
            const formData = new FormData();
            if (file) formData.append('image', file);
            if (symptoms) formData.append('symptoms', symptoms);

            try {
                const response = await fetch("http://localhost:3000/api/analyze", {
                    method: "POST",
                    body: formData
                });
                if (!response.ok) throw new Error("Server Error");
                const result = await response.json();
                
                let imgData = "";
                if (file) {
                    imgData = await new Promise(r => {
                        const reader = new FileReader();
                        reader.onload = e => r(e.target.result);
                        reader.readAsDataURL(file);
                    });
                }
                renderAnalysis(result, imgData);
            } catch (err) {
                console.error(err);
                alert("Connection failed. Please check if server is running.");
            } finally {
                loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
                if (voiceModal) {
                    voiceModal.classList.add('opacity-0', 'pointer-events-none');
                    voiceModalContent.classList.add('translate-y-full');
                }
            }
        }

        // CHAT LOGIC
        const openChatBtn = document.getElementById('openChatBtn');
        const chatOverlay = document.getElementById('chatOverlay');
        const chatModal = document.getElementById('chatModal');
        const chatForm = document.getElementById('chatForm');
        const chatFeed = document.getElementById('chatFeed');
        const chatInput = document.getElementById('chatInput');

        if (openChatBtn) {
            openChatBtn.onclick = () => {
                chatOverlay.classList.remove('opacity-0', 'pointer-events-none');
                chatModal.classList.remove('translate-y-full');
                document.body.classList.add('no-scroll');
            };
        }
        const closeChatBtn = document.getElementById('closeChatBtn');
        if (closeChatBtn) {
            closeChatBtn.onclick = () => {
                chatOverlay.classList.add('opacity-0', 'pointer-events-none');
                chatModal.classList.add('translate-y-full');
                document.body.classList.remove('no-scroll');
            };
        }

        if (chatForm) {
            chatForm.onsubmit = async (e) => {
                e.preventDefault();
                const text = chatInput.value.trim();
                if (!text) return;

                chatFeed.innerHTML += `<div class="flex justify-end"><div class="bg-primary text-white px-4 py-2 rounded-2xl rounded-tr-none text-sm">${text}</div></div>`;
                chatInput.value = '';
                chatFeed.scrollTop = chatFeed.scrollHeight;

                try {
                    const res = await fetch("http://localhost:3000/api/chat", {
                        method: "POST",
                        headers: { "Content-Type" : "application/json" },
                        body: JSON.stringify({ message: text, context: currentAiData })
                    });
                    const data = await res.json();
                    chatFeed.innerHTML += `<div class="flex justify-start"><div class="bg-gray-100 px-4 py-2 rounded-2xl rounded-tl-none text-sm">${data.reply}</div></div>`;
                } catch (err) {
                    chatFeed.innerHTML += `<div class="text-xs text-red-500 text-center">Connection error</div>`;
                }
                chatFeed.scrollTop = chatFeed.scrollHeight;
            };
        }

        // UI BUTTONS
        const cameraInput = document.getElementById('cameraInput');
        const fileInput = document.getElementById('fileInput');
        const btnCamera = document.getElementById('btnCamera');
        const btnUpload = document.getElementById('btnUpload');
        const btnBackToHome = document.getElementById('btnBackToHome');

        if (btnCamera) btnCamera.onclick = () => cameraInput.click();
        if (btnUpload) btnUpload.onclick = () => fileInput.click();
        if (btnBackToHome) btnBackToHome.onclick = () => showView('viewHome');

        if (cameraInput) cameraInput.onchange = (e) => e.target.files[0] && callAnalysis(e.target.files[0], null);
        if (fileInput) fileInput.onchange = (e) => e.target.files[0] && callAnalysis(e.target.files[0], null);

        // SYMPTOMS / VOICE
        const btnSymptoms = document.getElementById('btnSymptoms');
        if (btnSymptoms) {
            btnSymptoms.onclick = () => {
                voiceModal.classList.remove('opacity-0', 'pointer-events-none');
                voiceModalContent.classList.remove('translate-y-full');
                
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                    const rec = new SpeechRecognition();
                    rec.lang = 'hi-IN';
                    rec.start();
                    if (micPulse) micPulse.classList.remove('opacity-0');
                    rec.onresult = (e) => voiceText.innerText = e.results[0][0].transcript;
                    rec.onspeechend = () => {
                        rec.stop();
                        if (micPulse) micPulse.classList.add('opacity-0');
                        document.getElementById('voiceStatus').innerText = "Analyzing...";
                        setTimeout(() => callAnalysis(null, voiceText.innerText), 1000);
                    };
                } else {
                    const symps = prompt("Aapko kya takleef hai (Hinglish mein likhein)?");
                    if (symps) callAnalysis(null, symps);
                    else {
                        voiceModal.classList.add('opacity-0', 'pointer-events-none');
                        voiceModalContent.classList.add('translate-y-full');
                    }
                }
            };
        }
        const closeVoice = document.getElementById('closeVoice');
        if (closeVoice) {
            closeVoice.onclick = () => {
                 voiceModal.classList.add('opacity-0', 'pointer-events-none');
                 voiceModalContent.classList.add('translate-y-full');
            };
        }

        // Initialize Everything
        try {
            console.log("App Initializing...");
            checkUser();
            supabase.auth.onAuthStateChange((event, session) => {
                console.log("Auth event:", event);
                currentUser = session?.user || null;
                updateNavUI();
                if (event === 'SIGNED_IN') {
                    fetchProfile();
                    fetchHistory();
                }
            });
        } catch (e) {
            console.error("Initialization failed:", e);
        }
    