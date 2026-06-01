# Search&Apply: The Premium AI Job Application Assistant

<div align="center">
  <img src="assets/search_apply.png" alt="Search&Apply Logo" width="200"/>
  <br>
  <strong>Automate and elevate your career search using advanced AI agent reasoning.</strong>
</div>

---

**Search&Apply** is an intelligent AI-powered job application assistant designed to automate the process of finding, parsing, tailoring, and preparing job applications. Using modern Language Models (LLMs) and intelligent browser orchestration, it helps job seekers efficiently tailor resumes and cover letters specifically to job descriptions.

---

## Key Features

* **AI-Assisted Profiling & Parsing**: Automatically extracts critical role requirements, responsibilities, and skill demands from any job description.
* **Resume & Cover Letter Tailoring**: Seamlessly aligns your educational background, work experience, side projects, and skills to target job descriptions to produce ATS-optimized documents.
* **CLI Interface**: Provides a premium, interactive command-line experience using modern terminals and menus.
* **Automated PDF Generation**: Converts customized HTML resumes and cover letters into professional PDF files on the fly.
* **Custom Style Support**: Built-in support for different styling sheets, formatting guides, and layout templates.

---

## Directory Structure

```
Search&Apply/
├── assets/                  # Project assets and branding logos
├── data_folder/             # Active application settings, secrets, and resume files
├── data_folder_example/     # Example configurations and templates
├── src/                     # Core application codebase
│   ├── libs/                # LLM connectors and facade managers
│   ├── resume_schemas/      # Job profile and resume schema models
│   └── utils/               # Browser utilities and global constants
├── main.py                  # CLI entry point
└── requirements.txt         # Core dependencies
```

---

## Installation

### Prerequisites
- Python 3.10+
- Google Chrome installed on your machine

### Setup
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Akatsuki-Tobi/Search-Apply.git
   cd Search-Apply
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

## Configuration

The application reads its credentials and preferences from the `data_folder` directory. An example configuration is provided in `data_folder_example`.

1. Copy the example templates to `data_folder`:
   ```bash
   # Create a data_folder and populate with plain_text_resume.yaml, secrets.yaml, and work_preferences.yaml
   ```

2. **Configure Secrets (`secrets.yaml`)**:
   Add your OpenAI API key for AI-assisted tailoring:
   ```yaml
   llm_api_key: "YOUR_OPENAI_API_KEY"
   ```

3. **Provide Your Resume (`plain_text_resume.yaml`)**:
   Fill in your background details (personal info, education, work experience, projects, skills).

4. **Set Preferences (`work_preferences.yaml`)**:
   Define search positions, experience levels, locations, job types, and blacklists.

---

## Usage

Start the interactive CLI menu:
```bash
python main.py
```

### Menu Options
1. **Generate Resume**: Generates a standard base resume PDF from your plain text profile.
2. **Generate Resume Tailored for Job Description**: Prompts for a job URL, parses the requirements using an LLM, and generates an optimized PDF tailored to that specific job.
3. **Generate Tailored Cover Letter for Job Description**: Prompts for a job URL and writes a bespoke, high-impact 3-paragraph cover letter formatted as a PDF.

---

## Architecture Overview

* **`main.py`**: The central entry point orchestrating data folder validation, preference reading, and user inputs.
* **`ResumeFacade`**: Coordinates interaction between the LLM parser, resume builder, and browser-driven PDF generator.
* **`LLMParser`**: Employs LangChain and OpenAI models to parse, extract, and index key job information.
* **`Chrome Driver / Selenium`**: Automates HTML retrieval and manages headless PDF conversion.

---

## Troubleshooting

- **API Errors**: Ensure that your `llm_api_key` in `data_folder/secrets.yaml` is valid and has sufficient credits.
- **Selenium/Chrome Drivers**: Make sure you have a standard Chrome browser installed. The system automatically initializes the correct chromedriver via `webdriver-manager`.
- **Missing Configuration Files**: Ensure that `plain_text_resume.yaml`, `secrets.yaml`, and `work_preferences.yaml` are all present in the `data_folder` directory.

---

## License

This project is licensed under the **GNU Affero General Public License (AGPL-3.0)**. See the `LICENSE` file for details.
