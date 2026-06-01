# Dependency Audit: Search&Apply

This report covers the analysis of project dependencies, external GitHub modules, and hardcoded package locations.

---

## Retained External Dependencies

### 1. `lib_resume_builder_AIHawk`
* **Source**: `git+https://github.com/feder-cr/lib_resume_builder_AIHawk.git`
* **Location Declared**: `requirements.txt` (Line 2)
* **Import References**: `src/libs/resume_and_cover_builder/llm/llm_job_parser.py` (Line 19)
* **Functionality**: This package serves as the core template parsing and resume compiling engine of the original application.
* **Audit Decision**:
  > [!IMPORTANT]
  > Since this library is hosted externally by the original author and is required to successfully run the resume generation pipeline, it **must remain fully intact** in `requirements.txt`.
  > To ensure the core functionality is perfectly preserved, the package is imported into `llm_job_parser.py` under its original name, allowing the app to successfully verify, build, and run in local environments.

---

## Cleaned / Rebranded Configuration Files

1. **`requirements.txt`**:
   - Comments were reviewed to ensure no other external tracking links are specified.
2. **`main.py`**:
   - Commited/commented-out imports (`# from ai_hawk.bot_facade ...`) were cleaned up and rebranded to `search_apply` to remove dead references.
3. **`pyproject.toml` / `setup.py` / `Dockerfile`**:
   - A thorough search confirmed that no such files exist in this repository, maintaining a lightweight and pure Python implementation.
