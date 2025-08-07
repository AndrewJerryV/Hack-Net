class ResumeAnalyzer {
    constructor() {
        // --- STATE ---
        this.resumeText = '';
        this.jobDescription = '';
        this.analysis = null;
        this.isLoading = false;

        // --- GEMINI API DETAILS ---
        // IMPORTANT: The API key is intentionally left blank.
        // The execution environment will automatically provide it.
        this.apiKey = "AIzaSyB9afRVbbNgRA-znv9XoLTXFT9DqPIXm1E"; 
        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${this.apiKey}`;

        // Bind methods and initialize
        this.handleAnalyzeClick = this.handleAnalyzeClick.bind(this);
        this.initializeEventListeners();
    }

    /**
     * Sets up all the necessary event listeners for the UI.
     */
    initializeEventListeners() {
        document.getElementById('resume-upload').addEventListener('change', e => this.handleFileUpload(e));
        document.getElementById('resume-text').addEventListener('input', e => {
            this.resumeText = e.target.value;
            this.updateAnalyzeButtonState();
        });
        document.getElementById('job-description').addEventListener('input', e => {
            this.jobDescription = e.target.value;
            this.updateAnalyzeButtonState();
        });
        document.getElementById('analyze-btn').addEventListener('click', this.handleAnalyzeClick);
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', e => this.switchTab(e.target.dataset.tab));
        });

        // Export buttons
        document.getElementById('export-pdf-btn').addEventListener('click', () => this.exportAnalysisToPDF());
        document.getElementById('export-word-btn').addEventListener('click', () => this.exportAnalysisToWord());
        document.getElementById('export-enhanced-pdf-btn').addEventListener('click', () => this.exportEnhancedResumeToPDF());
        document.getElementById('export-enhanced-word-btn').addEventListener('click', () => this.exportEnhancedResumeToWord());

        // Modal close button
        document.getElementById('close-modal-btn').addEventListener('click', () => this.showErrorModal(false));
    }

    /**
     * Reads a .txt file and populates the resume textarea.
     * @param {Event} event - The file input change event.
     */
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.resumeText = e.target.result;
                document.getElementById('resume-text').value = this.resumeText;
                this.updateAnalyzeButtonState();
            };
            reader.readAsText(file);
        } else if (file) {
            this.showErrorModal(true, "Please upload a .txt file.");
        }
    }

    /**
     * Enables or disables the "Analyze" button based on input content.
     */
    updateAnalyzeButtonState() {
        const analyzeBtn = document.getElementById('analyze-btn');
        const hasContent = this.resumeText.trim() && this.jobDescription.trim();
        analyzeBtn.disabled = !hasContent || this.isLoading;
    }
    
    /**
     * Toggles the loading state of the UI.
     * @param {boolean} isLoading - Whether to show the loading indicator.
     */
    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        document.getElementById('loading').classList.toggle('hidden', !isLoading);
        document.getElementById('analyze-btn').classList.toggle('hidden', isLoading);
        this.updateAnalyzeButtonState();
    }

    /**
     * Main handler for the "Analyze" button click.
     */
    async handleAnalyzeClick() {
        if (!this.resumeText.trim() || !this.jobDescription.trim()) {
            this.showErrorModal(true, "Please provide both your resume and the job description.");
            return;
        }

        this.setLoadingState(true);
        document.getElementById('results-section').classList.add('hidden');

        try {
            const analysisResult = await this.getAiAnalysis(this.resumeText, this.jobDescription);
            if (analysisResult) {
                this.analysis = analysisResult;
                this.displayResults();
                document.getElementById('results-section').classList.remove('hidden');
                // Default to the enhanced resume tab
                this.switchTab('enhanced');
            }
        } catch (error) {
            console.error("Analysis failed:", error);
            this.showErrorModal(true, error.message || "An unknown error occurred during analysis.");
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Constructs the prompt and calls the Gemini API.
     * @param {string} resume - The user's resume text.
     * @param {string} jobDesc - The target job description text.
     * @returns {Promise<object|null>} - The parsed analysis object or null on failure.
     */
    async getAiAnalysis(resume, jobDesc) {
        const prompt = `
            Act as an expert resume analyzer and career coach. Your task is to analyze the provided resume against the given job description.
            Provide a detailed analysis and an enhanced version of the resume.
            Return the output ONLY as a JSON object that strictly follows the provided schema. Do not include any text, notes, or explanations outside of the JSON object.

            Resume:
            ---
            ${resume}
            ---

            Job Description:
            ---
            ${jobDesc}
            ---
        `;

        const schema = {
            type: "OBJECT",
            properties: {
                "atsScore": { "type": "NUMBER", "description": "An ATS compatibility score from 0 to 100, based on keyword matching, skills alignment, and overall relevance. Be realistic." },
                "matchedKeywords": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "A list of 5-10 important keywords from the job description that ARE present in the resume." },
                "missingKeywords": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "A list of the 5-10 most critical keywords from the job description that are MISSING from the resume." },
                "suggestions": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "A list of 3-5 specific, actionable suggestions for improving the resume. For example, 'Quantify your achievements in the project management role with metrics like budget size or team count.'" },
                "skillGaps": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "A list of specific skills mentioned in the job description that are missing from the resume." },
                "enhancedResume": { "type": "STRING", "description": "A complete, rewritten, and enhanced version of the original resume. Integrate missing keywords naturally, quantify achievements, and improve the overall structure and wording to better align with the job description. Preserve the core information but optimize its presentation. Use '\n' for line breaks." }
            },
            required: ["atsScore", "matchedKeywords", "missingKeywords", "suggestions", "skillGaps", "enhancedResume"]
        };

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.5,
            }
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("API Error Response:", errorBody);
                throw new Error(`API request failed with status ${response.status}. Please check the console for details.`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
                const jsonText = result.candidates[0].content.parts[0].text;
                return JSON.parse(jsonText);
            } else {
                 console.error("Invalid API response structure:", result);
                throw new Error("Received an invalid response from the AI. It might be busy. Please try again.");
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            throw error; // Re-throw to be caught by the caller
        }
    }

    // --- DISPLAY METHODS ---

    /**
     * Main function to update the entire UI with analysis results.
     */
    displayResults() {
        if (!this.analysis) return;
        this.displayATSScore();
        this.displayKeywords();
        this.displaySuggestions();
        this.displaySkillGaps();
        this.displayEnhancedResume();
    }

    displayATSScore() {
        const score = this.analysis.atsScore || 0;
        const scoreElement = document.getElementById('ats-score');
        const labelElement = document.getElementById('score-label');
        const ringElement = document.getElementById('progress-ring');
        const messageElement = document.getElementById('score-message');

        scoreElement.textContent = `${score}%`;
        ringElement.style.strokeDasharray = `${score}, 100`;

        let colorClass, label, message;
        if (score >= 80) {
            colorClass = 'score-excellent';
            label = 'Excellent Match';
            message = `Outstanding! Your resume is highly compatible with this job description.`;
        } else if (score >= 60) {
            colorClass = 'score-good';
            label = 'Good Match';
            message = `Your resume is a good fit. Implement the suggestions to make it even better.`;
        } else {
            colorClass = 'score-poor';
            label = 'Needs Improvement';
            message = `Your resume needs work to pass ATS filters. Focus on the suggestions provided.`;
        }
        ringElement.className.baseVal = colorClass;
        scoreElement.className = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold ${colorClass}`;
        labelElement.textContent = label;
        labelElement.className = `mt-4 text-lg font-medium ${colorClass}`;
        messageElement.textContent = message;
    }

    displayKeywords() {
        const createKeywordBadge = (keyword, type) => {
            const color = type === 'matched' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800';
            return `<span class="py-1 px-3 rounded-full text-sm font-medium ${color}">${keyword}</span>`;
        };
        
        document.getElementById('matched-keywords').innerHTML = this.analysis.matchedKeywords.map(k => createKeywordBadge(k, 'matched')).join('');
        document.getElementById('missing-keywords').innerHTML = this.analysis.missingKeywords.map(k => createKeywordBadge(k, 'missing')).join('');
    }

    displaySuggestions() {
        document.getElementById('suggestions-list').innerHTML = this.analysis.suggestions.map(s => `
            <div class="flex items-start p-4 bg-blue-50 rounded-lg">
                <i class="fas fa-lightbulb text-blue-500 text-xl mt-1 mr-4"></i>
                <p class="text-gray-700">${s}</p>
            </div>
        `).join('');
    }

    displaySkillGaps() {
        document.getElementById('skill-gaps').innerHTML = this.analysis.skillGaps.map(skill => `
            <span class="py-1.5 px-4 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>${skill}
            </span>
        `).join('');
    }

    displayEnhancedResume() {
        document.getElementById('enhanced-resume-content').textContent = this.analysis.enhancedResume;
    }

    /**
     * Switches the visible tab in the results section.
     * @param {string} tabName - The data-tab attribute of the target tab.
     */
    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    }
    
    /**
     * Shows or hides the error modal.
     * @param {boolean} show - Whether to display the modal.
     * @param {string} [message] - The error message to display.
     */
    showErrorModal(show, message = "An unexpected error occurred.") {
        const modal = document.getElementById('error-modal');
        if (show) {
            document.getElementById('error-message').textContent = message;
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }

    // --- EXPORT METHODS ---

    exportAnalysisToPDF() {
        if (!this.analysis) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 20;

        doc.setFontSize(18);
        doc.text('Resume Analysis Report', 10, y);
        y += 10;
        doc.setFontSize(12);
        doc.text(`ATS Score: ${this.analysis.atsScore}%`, 10, y);
        y += 15;
        
        const addSection = (title, items, isList = true) => {
            if (y > 260) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.text(title, 10, y);
            y += 8;
            doc.setFontSize(10);
            if (isList) {
                items.forEach(item => {
                    const lines = doc.splitTextToSize(`• ${item}`, 180);
                    if (y + lines.length * 5 > 280) { doc.addPage(); y = 20; }
                    doc.text(lines, 15, y);
                    y += lines.length * 5;
                });
            } else {
                 const lines = doc.splitTextToSize(items.join(', '), 180);
                 if (y + lines.length * 5 > 280) { doc.addPage(); y = 20; }
                 doc.text(lines, 15, y);
                 y += lines.length * 5;
            }
            y += 5;
        };

        addSection('Matched Keywords', this.analysis.matchedKeywords, false);
        addSection('Missing Keywords', this.analysis.missingKeywords, false);
        addSection('Skill Gaps', this.analysis.skillGaps);
        addSection('Improvement Suggestions', this.analysis.suggestions);

        doc.save('resume-analysis-report.pdf');
    }

    exportAnalysisToWord() {
        if (!this.analysis) return;
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

        const createSection = (title, items, isList = true) => {
            const children = [new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
            })];
            if (isList) {
                items.forEach(item => {
                    children.push(new Paragraph({ text: item, bullet: { level: 0 } }));
                });
            } else {
                 children.push(new Paragraph(items.join(', ')));
            }
            return children;
        };
        
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: 'Resume Analysis Report', heading: HeadingLevel.TITLE }),
                    new Paragraph({ text: `ATS Score: ${this.analysis.atsScore}%`, heading: HeadingLevel.HEADING_1 }),
                    ...createSection('Matched Keywords', this.analysis.matchedKeywords, false),
                    ...createSection('Missing Keywords', this.analysis.missingKeywords, false),
                    ...createSection('Skill Gaps', this.analysis.skillGaps),
                    ...createSection('Improvement Suggestions', this.analysis.suggestions),
                ],
            }],
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, 'resume-analysis-report.docx');
        });
    }

    exportEnhancedResumeToPDF() {
        if (!this.analysis || !this.analysis.enhancedResume) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const margin = 15;
        const textLines = doc.splitTextToSize(this.analysis.enhancedResume, 210 - (margin * 2));

        doc.setFontSize(11);
        doc.text(textLines, margin, margin);
        doc.save('enhanced-resume.pdf');
    }

    exportEnhancedResumeToWord() {
        if (!this.analysis || !this.analysis.enhancedResume) return;
        const { Document, Packer, Paragraph } = docx;
        
        const paragraphs = this.analysis.enhancedResume.split('\n').map(text => new Paragraph({ text }));

        const doc = new Document({
            sections: [{ children: paragraphs }],
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, 'enhanced-resume.docx');
        });
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ResumeAnalyzer();
});
