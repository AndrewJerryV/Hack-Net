# RESUME CUSTOMIZATION AI

## Team Members

- Andrew Jerry V
- Visakh Vinod
- Aron Eapen Thomas
- Gouri B
- Steena Stephen

## Project Description

Students often submit one generic resume for many jobs. This project helps users tailor resumes to a specific job description, improve ATS relevance, and generate a cleaner, targeted resume draft.

Live demo: https://andrewjerryv.github.io/Hack-Net/homepage.html

## Problem Statement

Manual resume customization is time-consuming, and many students are not aware of ATS filtering patterns (keyword match, role relevance, formatting quality).

## Solution Overview

Resume Customization AI is a browser-based system that:

- Accepts a source resume and job description.
- Extracts role keywords and skills from the job description.
- Compares them against resume content using local NLP.
- Calculates an ATS-style match score.
- Produces targeted suggestions and an enhanced resume draft.
- Allows export to PDF and Word.

## How the System Works

The user submits a resume and job description, and the app compares them to measure ATS relevance.
It returns a match score, key improvement suggestions, and an enhanced resume draft for the target role.

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- UI Utilities: Tailwind CSS, Font Awesome
- NLP Inference (browser): Transformers.js with ONNX models
- Document export: FileSaver.js and docx
