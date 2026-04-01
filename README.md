# RESUME CUSTOMIZATION AI


### Team Members

- Andrew Jerry V
- Visakh Vinod
- Aron Eapen Thomas
- Gouri B
- Steena Stephen
  
## Project Description

Students often struggle with creating tailored resumes for different job opportunities. Many submit generic resumes that are not optimized for the job description, leading to rejection by Applicant Tracking Systems (ATS) even before reaching recruiters. This AI-powered tool helps students instantly personalize their resumes based on specific job descriptions, improving match accuracy and increasing their chances of getting shortlisted.

Check it out: https://andrewjerryv.github.io/Hack-Net/homepage.html

## Use Case

Scenario: A college student is applying to multiple companies for internships or jobs. Each job has a slightly different requirement, but the student continues to use a single static resume.
Problem: Recruiters and ATS systems filter out resumes that don’t include relevant keywords or skills.
Solution: The Resume Customization AI allows students to:

Upload their base resume

Paste the job description

Automatically receive a tailored resume with suggestions, keyword highlights, and ATS optimization score

## Problem Statement

Students often submit one-size-fits-all resumes that do not align with specific job descriptions. Manually tailoring resumes for each application is time-consuming and tedious, and students are generally unaware of ATS (Applicant Tracking System) requirements.


## Solution

 A smart, web-based Resume Customization AI Tool that:

Analyzes the Job Description

Uses NLP to extract required skills, tools, keywords.

Parses and Evaluates the Student’s Resume

Highlights missing skills or weak phrasing.

Provides a Resume Match Score (ATS Score)

Shows how well the resume aligns with the JD.

Offers Enhancement Suggestions

Suggests strong action verbs, better phrasing, and keyword inclusions.

Displays a Visual Feedback Dashboard

Includes keyword match %, skill gap indicators, and ATS score chart.

Allows Export to PDF and Word

After customization, the user can download the resume in their preferred format.

## Deployment Note

The analyzer now runs fully in-browser using ONNX models via `@huggingface/transformers`.

- ATS semantic matching model: `onnx-community/all-MiniLM-L6-v2-ONNX`
- Enhanced resume generation is currently template-guided (section-based) and filled using lightweight local extraction and semantic relevance signals.
- The active flow does not require loading a large generative model.
- First analysis downloads model files in the browser and then uses browser cache for faster reuse.
- No Gemini or external paid LLM API calls are required.
- No API key or secret injection is needed for deployment.
- Compatible with static hosting platforms like GitHub Pages and Vercel.


