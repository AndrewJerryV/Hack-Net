# RESUME CUSTOMIZATION AI

## Team Members

- Andrew Jerry V
- Visakh Vinod
- Aron Eapen Thomas
- Gouri B
- Steena Stephen

## Project Description

An interactive, browser-based resume tailor and builder designed to help students and job-seekers match their resumes to specific job descriptions, optimize ATS relevance, and export polished, professional resumes.

Live demo: https://andrewjerryv.github.io/Hack-Net/

## Problem Statement

Manual resume customization is time-consuming, and many applicants are unaware of ATS (Applicant Tracking System) filtering patterns, such as keyword match rates, hard skills coverage, and layout readability.

## Key Features

1. **ATS Match Analysis**: Calculates a composite match score based on keyword overlap, hard skills coverage, and text readability.
2. **Missing Keyword Extraction**: Surfaced in real-time to allow candidates to cover critical gaps.
3. **Interactive Builder**: Edit fields, experiences, education, and projects directly with real-time A4 page-break rendering.
4. **Curated Style Templates**: 10 distinct, professional, ATS-friendly templates (Modern, Classic, Minimal, Executive, Two-Column, Technical, Elegant, Compact, Bold, Accent) with zoom slider controls.
5. **Accent Color Variation Picker**: Instantly customize design accents across templates using a curated palette (Teal, Blue, Purple, Red, Orange, Slate, Gold, Black) that persists locally.
6. **A4 Print / PDF Export**: Print or save directly to PDF with pixel-perfect page splitting and color variables intact.

## How the System Works

1. **Upload / Paste**: Input your current resume and target Job Description.
2. **Analyze**: The local NLP engine extracts terms and provides action-oriented recommendations.
3. **Customize**: Send the parsed text to the Builder, select templates, tweak styling accents, and edit the copy.
4. **Export**: Save your customized draft as a print-ready PDF.

## Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Properties & Flexbox), JavaScript (ES6 Modules)
- **UI Utilities**: Tailwind CSS (for dashboard components), Font Awesome (Solid Icons)
- **NLP Semantic Matching**: Transformers.js with WebGPU/WASM ONNX models running locally in-browser (`all-MiniLM-L6-v2`)
- **Document Export**: In-browser Print Spooling & PDF rendering
