// Global State
let logEventSource = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    fetchStyles();
    setupLogStream();
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

    try {
        const response = await fetch("/api/profile");
        if (!response.ok) throw new Error("Failed to load profile parameters.");
        const data = await response.json();

        document.getElementById("yaml-resume").value = data.resume_yaml;
        document.getElementById("yaml-preferences").value = data.preferences_yaml;
        document.getElementById("yaml-secrets").value = data.secrets_yaml;
    } catch (err) {
        alert("Error loading profile: " + err.message);
    }
}

function closeProfileModal() {
    document.getElementById("profile-modal").classList.add("hidden");
}

function switchTab(tabId) {
    // Hide all contents
    document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
    // Show selected content
    document.getElementById(tabId).classList.remove("hidden");

    // Update active tab buttons states
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    event.currentTarget.classList.add("active");
}

async function saveProfile() {
    const resumeYaml = document.getElementById("yaml-resume").value;
    const preferencesYaml = document.getElementById("yaml-preferences").value;
    const secretsYaml = document.getElementById("yaml-secrets").value;

    try {
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

        appendConsoleLine("System", "Configuration and secrets updated and validated successfully.", "info-line");
        closeProfileModal();
    } catch (err) {
        alert("Save Error: " + err.message);
    }
}
