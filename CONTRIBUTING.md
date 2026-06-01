# Contributing to Search&Apply

Thank you for your interest in contributing to **Search&Apply**! This document provides guidelines for contributing to the project.

## Table of Contents

- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)

---

## Bug Reports

When submitting a bug report, please include:

- A clear, descriptive title prefixed with `[BUG]`
- Detailed steps to reproduce the issue
- Expected behavior vs. actual behavior
- Any error messages, logs, or screenshots
- Your environment details (OS, Python version, etc.)

---

## Feature Requests

For feature requests, please:

- Prefix the title with `[FEATURE]`
- Include a clear feature summary
- Provide a detailed description of the proposed enhancement
- Explain your motivation for the feature

---

## Development Setup

1. Clone the rebranded repository:
   ```bash
   git clone https://github.com/Akatsuki-Tobi/Search-Apply.git
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your environment credentials and API keys in your local `data_folder`.

---

## Pull Request Process

1. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Write clean, self-documenting code.
3. Write descriptive commit messages.
4. Ensure all changes are well-tested.
5. Submit a pull request to the main branch with a detailed explanation of your changes.

---

## Code Style Guidelines

- Follow PEP 8 standards for Python code.
- Include clear docstrings for new functions, classes, and modules.
- Add comments for complex logical blocks.
- Maintain consistent naming conventions.

---

## Testing

Before submitting a PR:
- Test your changes thoroughly in your local environment.
- Verify functionality under different configurations.
- Ensure that the main CLI entry point (`python main.py`) starts up and runs without syntax or configuration errors.
