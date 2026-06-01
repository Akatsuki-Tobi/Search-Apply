# Renamed & Migrated Files Report: Search&Apply

This report lists every file that was renamed, moved, deleted, or created during the migration of AIHawk to **Search&Apply**.

---

## File Movements & Deletions

### 1. Prompt String Modules
To migrate from the original developer-specific naming conventions, the prompt module files were copied, rebranded, and migrated to a clean theme:

* **Resume Prompts**:
  - **Deleted**: `src/libs/resume_and_cover_builder/resume_prompt/strings_feder-cr.py`
  - **Created**: `src/libs/resume_and_cover_builder/resume_prompt/strings_search_apply.py`
* **Job Description Prompts**:
  - **Deleted**: `src/libs/resume_and_cover_builder/resume_job_description_prompt/strings_feder-cr.py`
  - **Created**: `src/libs/resume_and_cover_builder/resume_job_description_prompt/strings_search_apply.py`
* **Cover Letter Prompts**:
  - **Deleted**: `src/libs/resume_and_cover_builder/cover_letter_prompt/strings_feder-cr.py`
  - **Created**: `src/libs/resume_and_cover_builder/cover_letter_prompt/strings_search_apply.py`

### 2. Assets & Branding Logo
The old branding assets were completely removed and replaced with a newly generated, professional career logo:

* **Deleted**: `assets/AIHawk.png`
* **Created**: `assets/search_apply.png` (High-definition PNG)

### 3. Metadata Deletions
Developer-specific metadata files that are no longer relevant to this clean repository were removed:

* **Deleted**: `.github/FUNDING.yml` (Developer-specific donation details)

---

## File Reference Updates
The following configuration modules and scripts had their internal import routes and string paths updated to accommodate the renamed files:

1. **`src/libs/resume_and_cover_builder/resume_facade.py`**:
   - Updated path for `STRINGS_MODULE_RESUME_PATH` to `resume_prompt/strings_search_apply.py`.
   - Updated path for `STRINGS_MODULE_RESUME_JOB_DESCRIPTION_PATH` to `resume_job_description_prompt/strings_search_apply.py`.
   - Updated path for `STRINGS_MODULE_COVER_LETTER_JOB_DESCRIPTION_PATH` to `cover_letter_prompt/strings_search_apply.py`.
   - Updated `STRINGS_MODULE_NAME` to `"strings_search_apply"`.
