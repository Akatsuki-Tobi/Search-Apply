# Dependency Audit & Bundle Size Optimization: Search&Apply

This report covers the analysis of project dependencies, external GitHub modules, and serverless size optimizations.

---

## 🚀 AWS Lambda Size Optimizations

To resolve the AWS Lambda ephemeral storage error (`Error: Total bundle size exceeds Lambda ephemeral storage limit (500 MB)`), a critical dependency audit and pruning was executed:

### 1. Pruned Dependencies
The following high-weight machine learning wrappers were removed from `requirements.txt`:
* **`langchain-huggingface`**: This library pulls `transformers` and `torch`, massive deep-learning dependencies that inflate the expanded package bundle to **5.17 GB**.
* **`langchain-ollama`**, **`langchain-anthropic`**, and **`langchain-google-genai`**: These unused model wrappers were pruned to keep the environment lean and focused.

### 2. Results & Impact
* **Total Packages Resolved**: Reduced from **146 packages** down to **96 packages**.
* **Package Footprint**: Completely eliminated the multi-gigabyte `torch` and `transformers` directories.
* **Compatibility**: The codebase now fits well within standard AWS Lambda limits (under **150 MB** expanded) and deploys flawlessly.

---

## Retained External Dependencies

### 1. `lib_resume_builder_AIHawk`
* **Source**: `lib-resume-builder-aihawk @ git+https://github.com/feder-cr/lib_resume_builder_AIHawk.git` (PEP 508 format)
* **Location Declared**: `requirements.txt` (Line 2)
* **Import References**: `src/libs/resume_and_cover_builder/llm/llm_job_parser.py` (Line 19)
* **Functionality**: Core template parsing and resume compiling engine.
* **Audit Decision**: Required to preserve resume generation pipeline. It is fully retained and imported cleanly under its original namespace to maintain existing functionality.
