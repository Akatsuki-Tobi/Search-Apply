// Global State
let logEventSource = null;
let activeProfileData = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    fetchStyles();
    setupLogStream();
    checkResumeStatus();
});

// 1. Fetch template styles list
async function fetchStyles() {
    try {
        const response = await fetch("/api/styles");
        if (!response.ok) throw new Error("Failed to load styles.");
        const styles = await response.json();
        
        const styleSelect = document.getElementById("style-select");
        styleSelect.innerHTML = ""; // clear loading
        
        if (styles.length === 0) {
            styleSelect.innerHTML = `<option value="">No styles found</option>`;
            return;
        }

        styles.forEach(style => {
            const option = document.createElement("option");
            option.value = style.id;
            option.textContent = style.name;
            styleSelect.appendChild(option);
        });
    } catch (err) {
        console.error(err);
        appendConsoleLine("System", `Error loading styles: ${err.message}`, "error-line");
    }
}

// 2. Setup Server-Sent Events (SSE) for Real-Time Logging Console
function setupLogStream() {
    if (logEventSource) {
        logEventSource.close();
    }

    logEventSource = new EventSource("/api/logs");

    logEventSource.onmessage = (event) => {
        const cleanMsg = stripAnsiTags(event.data);
        if (cleanMsg.includes("ERROR")) {
            appendConsoleLine("Search&Apply", cleanMsg, "error-line");
        } else if (cleanMsg.includes("INFO") || cleanMsg.includes("success")) {
            appendConsoleLine("Search&Apply", cleanMsg, "info-line");
        } else {
            appendConsoleLine("Search&Apply", cleanMsg);
        }
    };

    logEventSource.onerror = (err) => {
        console.error("SSE connection closed or failed.", err);
    };
}

// Helper to strip custom loguru XML-like tags
function stripAnsiTags(text) {
    return text
        .replace(/<green>/g, "").replace(/<\/green>/g, "")
        .replace(/<level>/g, "").replace(/<\/level>/g, "")
        .replace(/<cyan>/g, "").replace(/<\/cyan>/g, "");
}

// Helper to write lines to the console box
function appendConsoleLine(sender, message, cssClass = "") {
    const consoleBox = document.getElementById("console-box");
    const line = document.createElement("div");
    line.className = `console-line ${cssClass}`;
    
    // Auto-prepend timestamp if not included
    const timeStr = new Date().toLocaleTimeString();
    line.innerHTML = `<span style="color: #64748b;">[${timeStr}]</span> ${message}`;
    
    consoleBox.appendChild(line);
    consoleBox.scrollTop = consoleBox.scrollHeight; // Auto scroll to bottom
}

// 3. Synthesize Tailored Cover Letter
async function generateCoverLetter(event) {
    event.preventDefault();

    const jobUrl = document.getElementById("job-url").value;
    const styleName = document.getElementById("style-select").value;
    const btnSubmit = document.getElementById("btn-submit");
    const statusDot = document.getElementById("console-status");

    // UI Loading State
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Tailoring Cover Letter...`;
    statusDot.querySelector(".pulse-dot").style.backgroundColor = "#e11d48"; // Red/accent pulse
    statusDot.querySelector(".status-text").textContent = "Processing";

    appendConsoleLine("System", `Initiating Cover Letter Synthesis for: ${jobUrl}...`, "system-line");

    try {
        const response = await fetch("/api/generate-cover-letter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_url: jobUrl, style_name: styleName })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Synthesis failed.");
        }

        const data = await response.json();
        
        appendConsoleLine("System", "Document synthesized successfully! Rendering PDF...", "info-line");

        // Load PDF in iframe
        const pdfContainer = document.getElementById("pdf-container");
        pdfContainer.innerHTML = `<iframe class="pdf-iframe animate-fade-in" src="/api/download/${data.file_id}"></iframe>`;

        // Configure Download button
        const btnDownload = document.getElementById("btn-download");
        btnDownload.href = `/api/download/${data.file_id}`;
        document.getElementById("preview-actions").classList.remove("hidden");

        statusDot.querySelector(".pulse-dot").style.backgroundColor = "#0d9488"; // Back to green
        statusDot.querySelector(".status-text").textContent = "Engine Ready";

    } catch (err) {
        appendConsoleLine("System", `Synthesis Error: ${err.message}`, "error-line");
        statusDot.querySelector(".pulse-dot").style.backgroundColor = "#e11d48";
        statusDot.querySelector(".status-text").textContent = "Failed";
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Synthesize Cover Letter`;
    }
}

// 4. Modal Profile Configuration Management
async function openProfileModal() {
    const modal = document.getElementById("profile-modal");
    modal.classList.remove("hidden");
    
    switchTab('tab-general');

    try {
        const response = await fetch("/api/profile");
        if (!response.ok) throw new Error("Failed to load profile parameters.");
        const data = await response.json();
        
        activeProfileData = data;

        document.getElementById("yaml-resume").value = data.resume_yaml || "";
        document.getElementById("yaml-preferences").value = data.preferences_yaml || "";
        document.getElementById("yaml-secrets").value = data.secrets_yaml || "";

        // 1. Secrets
        document.getElementById("form-llm-api-key").value = data.secrets_json.llm_api_key || "";
        document.getElementById("form-llm-model-type").value = data.secrets_json.llm_model_type || "openai";
        document.getElementById("form-llm-model").value = data.secrets_json.llm_model || "gpt-4o-mini";

        // 2. Preferences
        document.getElementById("pref-remote").checked = !!data.preferences_json.remote;
        document.getElementById("pref-hybrid").checked = !!data.preferences_json.hybrid;
        document.getElementById("pref-onsite").checked = !!data.preferences_json.onsite;

        const jobTypes = data.preferences_json.job_types || {};
        document.getElementById("type-fulltime").checked = !!jobTypes.full_time;
        document.getElementById("type-contract").checked = !!jobTypes.contract;
        document.getElementById("type-parttime").checked = !!jobTypes.part_time;

        const expLvl = data.preferences_json.experience_level || {};
        document.getElementById("exp-internship").checked = !!expLvl.internship;
        document.getElementById("exp-entry").checked = !!expLvl.entry;
        document.getElementById("exp-associate").checked = !!expLvl.associate;
        document.getElementById("exp-mid").checked = !!expLvl.mid_senior_level;
        document.getElementById("exp-director").checked = !!expLvl.director;
        document.getElementById("exp-executive").checked = !!expLvl.executive;

        document.getElementById("pref-positions").value = (data.preferences_json.positions || []).join(", ");
        document.getElementById("pref-locations").value = (data.preferences_json.locations || []).join(", ");

        // 3. Resume Personal Info
        const pi = data.resume_json.personal_information || {};
        document.getElementById("resume-name").value = pi.name || "";
        document.getElementById("resume-surname").value = pi.surname || "";
        document.getElementById("resume-email").value = pi.email || "";
        document.getElementById("resume-dob").value = pi.date_of_birth || "";
        document.getElementById("resume-phone-prefix").value = pi.phone_prefix || "";
        document.getElementById("resume-phone").value = pi.phone || "";
        document.getElementById("resume-country").value = pi.country || "";
        document.getElementById("resume-city").value = pi.city || "";
        document.getElementById("resume-zip").value = pi.zip_code || "";
        document.getElementById("resume-address").value = pi.address || "";
        
        const formatUrl = (val) => (val && typeof val === 'object') ? (val.unicode || val.url || '') : (val || '');
        document.getElementById("resume-github").value = formatUrl(pi.github);
        document.getElementById("resume-linkedin").value = formatUrl(pi.linkedin);

    } catch (err) {
        alert("Error loading profile: " + err.message);
    }
}

function closeProfileModal() {
    document.getElementById("profile-modal").classList.add("hidden");
}

function switchTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
    document.getElementById(tabId).classList.remove("hidden");

    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    
    const targetBtn = document.getElementById("btn-" + tabId) || (event ? event.currentTarget : null);
    if (targetBtn) {
        targetBtn.classList.add("active");
    }
}

async function saveProfile() {
    const isAdvancedTabActive = !document.getElementById("tab-advanced").classList.contains("hidden");

    try {
        if (isAdvancedTabActive) {
            const resumeYaml = document.getElementById("yaml-resume").value;
            const preferencesYaml = document.getElementById("yaml-preferences").value;
            const secretsYaml = document.getElementById("yaml-secrets").value;

            const response = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resume_yaml: resumeYaml,
                    preferences_yaml: preferencesYaml,
                    secrets_yaml: secretsYaml
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Validation check failed.");
            }
        } else {
            if (!activeProfileData) throw new Error("No active profile data loaded.");

            // 1. Secrets
            activeProfileData.secrets_json.llm_api_key = document.getElementById("form-llm-api-key").value;
            activeProfileData.secrets_json.llm_model_type = document.getElementById("form-llm-model-type").value;
            activeProfileData.secrets_json.llm_model = document.getElementById("form-llm-model").value;

            // 2. Preferences
            activeProfileData.preferences_json.remote = document.getElementById("pref-remote").checked;
            activeProfileData.preferences_json.hybrid = document.getElementById("pref-hybrid").checked;
            activeProfileData.preferences_json.onsite = document.getElementById("pref-onsite").checked;

            if (!activeProfileData.preferences_json.experience_level) activeProfileData.preferences_json.experience_level = {};
            activeProfileData.preferences_json.experience_level.internship = document.getElementById("exp-internship").checked;
            activeProfileData.preferences_json.experience_level.entry = document.getElementById("exp-entry").checked;
            activeProfileData.preferences_json.experience_level.associate = document.getElementById("exp-associate").checked;
            activeProfileData.preferences_json.experience_level.mid_senior_level = document.getElementById("exp-mid").checked;
            activeProfileData.preferences_json.experience_level.director = document.getElementById("exp-director").checked;
            activeProfileData.preferences_json.experience_level.executive = document.getElementById("exp-executive").checked;

            if (!activeProfileData.preferences_json.job_types) activeProfileData.preferences_json.job_types = {};
            activeProfileData.preferences_json.job_types.full_time = document.getElementById("type-fulltime").checked;
            activeProfileData.preferences_json.job_types.contract = document.getElementById("type-contract").checked;
            activeProfileData.preferences_json.job_types.part_time = document.getElementById("type-parttime").checked;

            activeProfileData.preferences_json.positions = document.getElementById("pref-positions").value.split(",").map(s => s.trim()).filter(s => s);
            activeProfileData.preferences_json.locations = document.getElementById("pref-locations").value.split(",").map(s => s.trim()).filter(s => s);

            // 3. Resume Personal Info
            if (!activeProfileData.resume_json.personal_information) activeProfileData.resume_json.personal_information = {};
            const pi = activeProfileData.resume_json.personal_information;
            pi.name = document.getElementById("resume-name").value;
            pi.surname = document.getElementById("resume-surname").value;
            pi.email = document.getElementById("resume-email").value;
            pi.date_of_birth = document.getElementById("resume-dob").value;
            pi.phone_prefix = document.getElementById("resume-phone-prefix").value;
            pi.phone = document.getElementById("resume-phone").value;
            pi.country = document.getElementById("resume-country").value;
            pi.city = document.getElementById("resume-city").value;
            pi.zip_code = document.getElementById("resume-zip").value;
            pi.address = document.getElementById("resume-address").value;
            pi.github = document.getElementById("resume-github").value || null;
            pi.linkedin = document.getElementById("resume-linkedin").value || null;

            const response = await fetch("/api/profile-json", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resume_json: activeProfileData.resume_json,
                    preferences_json: activeProfileData.preferences_json,
                    secrets_json: activeProfileData.secrets_json
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Validation check failed.");
            }
        }

        appendConsoleLine("System", "Configuration parameters updated and validated successfully.", "info-line");
        closeProfileModal();
        await checkResumeStatus();
    } catch (err) {
        alert("Save Error: " + err.message);
    }
}

function toggleApiKeyPeek() {
    const keyInput = document.getElementById("form-llm-api-key");
    const peekIcon = document.getElementById("toggle-api-key-peek");
    if (keyInput.type === "password") {
        keyInput.type = "text";
        peekIcon.className = "fa-solid fa-eye-slash";
    } else {
        keyInput.type = "password";
        peekIcon.className = "fa-solid fa-eye";
    }
}

function updateDefaultModel() {
    const provider = document.getElementById("form-llm-model-type").value;
    const modelInput = document.getElementById("form-llm-model");
    if (provider === "openai") {
        modelInput.value = "gpt-4o-mini";
    } else if (provider === "gemini") {
        modelInput.value = "gemini-1.5-flash";
    } else if (provider === "claude") {
        modelInput.value = "claude-3-5-sonnet-20240620";
    }
}

function switchYamlEditor() {
    const selectorVal = document.getElementById("yaml-file-selector").value;
    document.getElementById("editor-resume-wrapper").classList.add("hidden");
    document.getElementById("editor-preferences-wrapper").classList.add("hidden");
    document.getElementById("editor-secrets-wrapper").classList.add("hidden");

    if (selectorVal === "resume") {
        document.getElementById("editor-resume-wrapper").classList.remove("hidden");
    } else if (selectorVal === "preferences") {
        document.getElementById("editor-preferences-wrapper").classList.remove("hidden");
    } else if (selectorVal === "secrets") {
        document.getElementById("editor-secrets-wrapper").classList.remove("hidden");
    }
}

// 5. Load demo resume yaml
async function triggerDemoResume() {
    if (!confirm("Are you sure you want to load the Demo Resume? This will replace your current resume tab content.")) return;
    
    const statusSpan = document.getElementById("upload-status");
    statusSpan.textContent = "Loading Demo...";
    statusSpan.style.color = "var(--text-secondary)";
    
    try {
        const response = await fetch("/api/load-demo-resume", {
            method: "POST"
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Failed to load demo resume.");
        }
        
        const data = await response.json();
        document.getElementById("yaml-resume").value = data.yaml;
        statusSpan.textContent = "Demo loaded successfully!";
        statusSpan.style.color = "#10b981";
        appendConsoleLine("System", "Demo resume loaded successfully.", "info-line");
        await checkResumeStatus();
    } catch (err) {
        statusSpan.textContent = "Load failed.";
        statusSpan.style.color = "var(--accent)";
        alert("Load Error: " + err.message);
    }
}

// 6. Upload PDF/TXT and parse using LLM
async function uploadAndParseResume() {
    const fileInput = document.getElementById("resume-file");
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    const statusSpan = document.getElementById("upload-status");
    
    statusSpan.textContent = "Parsing via LLM (takes a few seconds)...";
    statusSpan.style.color = "#38bdf8";
    appendConsoleLine("System", `Uploading and parsing resume: ${file.name} via LLM...`, "system-line");
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
        const response = await fetch("/api/parse-resume-file", {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Parsing failed.");
        }
        
        const data = await response.json();
        document.getElementById("yaml-resume").value = data.yaml;
        statusSpan.textContent = "Parsed successfully!";
        statusSpan.style.color = "#10b981";
        appendConsoleLine("System", `Successfully parsed and validated resume YAML.`, "info-line");
        await checkResumeStatus();
    } catch (err) {
        statusSpan.textContent = "Parsing failed.";
        statusSpan.style.color = "var(--accent)";
        appendConsoleLine("System", `Resume parsing error: ${err.message}`, "error-line");
        alert("Parsing Error: " + err.message);
    } finally {
        fileInput.value = "";
    }
}

// 7. Check current resume status
async function checkResumeStatus() {
    const badge = document.getElementById("action-center-resume-status-badge");
    const details = document.getElementById("action-center-resume-details");
    const card = document.getElementById("action-center-resume-status-card");
    
    if (!badge || !details) return;
    
    try {
        const response = await fetch("/api/resume-status");
        if (!response.ok) throw new Error("Failed to check resume status.");
        const data = await response.json();
        
        if (data.valid) {
            badge.textContent = "Active Resume";
            badge.style.backgroundColor = "#0d9488";
            details.innerHTML = `<strong>Candidate:</strong> ${data.name}<br><strong>Email:</strong> ${data.email || 'N/A'}`;
            if (card) card.style.borderColor = "rgba(13, 148, 136, 0.4)";
        } else {
            badge.textContent = "Action Required";
            badge.style.backgroundColor = "#e11d48";
            details.innerHTML = `<span style="color: #f43f5e;"><i class="fa-solid fa-triangle-exclamation"></i> ${data.reason || 'No valid resume loaded.'}</span>`;
            if (card) card.style.borderColor = "rgba(225, 29, 72, 0.3)";
        }
    } catch (err) {
        console.error(err);
        badge.textContent = "Error";
        badge.style.backgroundColor = "#ef4444";
        details.textContent = "Error loading resume status.";
    }
}

async function triggerDemoResumeActionCenter() {
    const details = document.getElementById("action-center-resume-details");
    if (details) details.textContent = "Loading Demo...";
    
    try {
        const response = await fetch("/api/load-demo-resume", {
            method: "POST"
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Failed to load demo resume.");
        }
        
        const data = await response.json();
        const modalTextarea = document.getElementById("yaml-resume");
        if (modalTextarea) {
            modalTextarea.value = data.yaml;
        }
        appendConsoleLine("System", "Demo resume loaded successfully.", "info-line");
        await checkResumeStatus();
    } catch (err) {
        alert("Load Error: " + err.message);
        await checkResumeStatus();
    }
}

async function uploadResumeActionCenter() {
    const fileInput = document.getElementById("action-center-resume-file");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    const details = document.getElementById("action-center-resume-details");
    
    if (details) details.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Parsing "${file.name}" via LLM...`;
    appendConsoleLine("System", `Uploading and parsing resume: ${file.name} via LLM...`, "system-line");
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
        const response = await fetch("/api/parse-resume-file", {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Parsing failed.");
        }
        
        const data = await response.json();
        const modalTextarea = document.getElementById("yaml-resume");
        if (modalTextarea) {
            modalTextarea.value = data.yaml;
        }
        appendConsoleLine("System", `Successfully parsed and validated resume YAML.`, "info-line");
        await checkResumeStatus();
    } catch (err) {
        appendConsoleLine("System", `Resume parsing error: ${err.message}`, "error-line");
        alert("Parsing Error: " + err.message);
        await checkResumeStatus();
    } finally {
        fileInput.value = "";
    }
}
