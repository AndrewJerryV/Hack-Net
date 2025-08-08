class ResumeAnalyzer {
    GEMINI_API_KEY = "GEMINI_KEY_PLACEHOLDER";
    constructor() {
        // --- STATE ---
        this.resumeText = '';
        this.jobDescription = '';
        this.analysis = null;
        this.isLoading = false;
        // --- GEMINI API DETAILS ---
        // The execution environment will automatically provide it.
        this.apiKey = "${GEMINI_API_KEY}"; 
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
                this.switchTab('enhanced');
                this.initializeChatbot(); // Add this line
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
            Provide a detailed analysis and an enhanced, structured version of the resume.
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
                "enhancedResume": {
                    "type": "OBJECT",
                    "description": "A structured, enhanced version of the resume, optimized for the job description.",
                    "properties": {
                        "name": { "type": "STRING", "description": "The candidate's full name." },
                        "contact": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "An array of contact details like phone, email, LinkedIn URL, and location." },
                        "summary": { "type": "STRING", "description": "A professional summary." },
                        "sections": {
                            "type": "ARRAY",
                            "description": "An array of resume sections like 'Work Experience', 'Education', 'Skills'.",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "title": { "type": "STRING", "description": "The title of the section (e.g., 'Work Experience')." },
                                    "items": {
                                        "type": "ARRAY",
                                        "description": "An array of entries within the section.",
                                        "items": {
                                            "type": "OBJECT",
                                            "properties": {
                                                "header": { "type": "STRING", "description": "The main line for an entry, e.g., 'Software Engineer | Google | 2020-Present' or 'B.S. in Computer Science'." },
                                                "subheader": { "type": "STRING", "description": "An optional secondary line, e.g., 'Mountain View, CA' or 'University of California, Berkeley'." },
                                                "points": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "An array of bullet points describing responsibilities and achievements." }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
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
        const container = document.getElementById('enhanced-resume-content');
        const resume = this.analysis.enhancedResume;
        if (!resume) {
            container.innerHTML = '<p>Could not generate enhanced resume.</p>';
            return;
        }

        let html = '';

        // Name and Contact
        if (resume.name) {
            html += `<h1 class="text-4xl font-bold text-center text-gray-900">${resume.name}</h1>`;
        }
        if (resume.contact && resume.contact.length > 0) {
            html += `<div class="text-center text-sm text-gray-600 mt-2 pb-4 border-b">${resume.contact.join(' &bull; ')}</div>`;
        }

        // Summary
        if (resume.summary) {
            html += `<div class="mt-6"><p>${resume.summary}</p></div>`;
        }
        
        // Sections (Experience, Education, etc.)
        if (resume.sections && resume.sections.length > 0) {
            resume.sections.forEach(section => {
                html += `
                    <div class="mt-6">
                        <h2 class="text-xl font-bold text-blue-600 uppercase border-b-2 border-blue-600 pb-1 mb-3">${section.title}</h2>
                        <div class="space-y-4">
                `;
                if (section.items && section.items.length > 0) {
                    section.items.forEach(item => {
                        html += '<div>';
                        if(item.header) {
                            html += `<h3 class="text-lg font-semibold text-gray-800">${item.header}</h3>`;
                        }
                        if(item.subheader) {
                             html += `<p class="text-sm font-medium text-gray-600 italic">${item.subheader}</p>`;
                        }
                        if (item.points && item.points.length > 0) {
                            html += '<ul class="list-disc list-inside mt-1 space-y-1 text-gray-700">';
                            item.points.forEach(point => {
                                html += `<li>${point}</li>`;
                            });
                            html += '</ul>';
                        }
                        html += '</div>';
                    });
                }
                html += '</div></div>';
            });
        }

        container.innerHTML = html;
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
        
        // Get docx from window object since we're using CDN
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;

        const createSection = (title, items, isList = true) => {
            const children = [
                new Paragraph({
                    text: title,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 200 },
                })
            ];

            if (isList) {
                items.forEach(item => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun("• "),
                                new TextRun(item)
                            ],
                            spacing: { before: 100, after: 100 }
                        })
                    );
                });
            } else {
                children.push(
                    new Paragraph({
                        text: items.join(', '),
                        spacing: { before: 100, after: 100 }
                    })
                );
            }
            return children;
        };

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: "Resume Analysis Report",
                        heading: HeadingLevel.TITLE,
                        spacing: { before: 200, after: 200 }
                    }),
                    new Paragraph({
                        text: `ATS Score: ${this.analysis.atsScore}%`,
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 200 }
                    }),
                    ...createSection("Matched Keywords", this.analysis.matchedKeywords, false),
                    ...createSection("Missing Keywords", this.analysis.missingKeywords, false),
                    ...createSection("Skill Gaps", this.analysis.skillGaps),
                    ...createSection("Improvement Suggestions", this.analysis.suggestions)
                ]
            }]
        });

        // Generate and save document
        Packer.toBlob(doc).then(blob => {
            window.saveAs(blob, "resume-analysis-report.docx");
        });
    }

    exportEnhancedResumeToPDF() {
        if (!this.analysis || !this.analysis.enhancedResume) return;
        const { jsPDF } = window.jspdf;
        const resume = this.analysis.enhancedResume;
        const doc = new jsPDF('p', 'pt', 'a4');
        const margin = 40;
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = margin;

        const checkPageBreak = (spaceNeeded) => {
            if (y + spaceNeeded > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }
        };

        // Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor('#111827');
        doc.text(resume.name, pageWidth / 2, y, { align: 'center' });
        y += 20;

        // Contact
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor('#4B5563');
        doc.text(resume.contact.join(' | '), pageWidth / 2, y, { align: 'center' });
        y += 20;
        doc.setDrawColor('#E5E7EB');
        doc.line(margin, y, pageWidth - margin, y);
        y += 25;

        // Summary
        doc.setFontSize(11);
        const summaryLines = doc.splitTextToSize(resume.summary, pageWidth - margin * 2);
        doc.text(summaryLines, margin, y);
        y += summaryLines.length * 14;

        // Sections
        resume.sections.forEach(section => {
            checkPageBreak(50);
            y += 20;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor('#2563EB');
            doc.text(section.title.toUpperCase(), margin, y);
            y += 8;
            doc.setDrawColor('#2563EB');
            doc.setLineWidth(1.5);
            doc.line(margin, y, margin + 80, y);
            y += 20;

            section.items.forEach(item => {
                checkPageBreak(30);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor('#1F2937');
                doc.text(item.header, margin, y);
                y += 15;

                if (item.subheader) {
                    checkPageBreak(15);
                    doc.setFont('helvetica', 'normal_italic');
                    doc.setFontSize(10);
                    doc.setTextColor('#4B5563');
                    doc.text(item.subheader, margin, y);
                    y += 15;
                }

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.setTextColor('#374151');
                item.points.forEach(point => {
                    const pointLines = doc.splitTextToSize(point, pageWidth - margin * 2 - 15);
                    checkPageBreak(pointLines.length * 14);
                    doc.text(`•`, margin, y, { align: 'left' });
                    doc.text(pointLines, margin + 10, y);
                    y += pointLines.length * 14;
                });
                y += 10;
            });
        });

        doc.save('enhanced-resume.pdf');
    }

    exportEnhancedResumeToWord() {
        if (!this.analysis?.enhancedResume) return;

        // Get docx from window object since we're using CDN
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = window.docx;
        const resume = this.analysis.enhancedResume;

        const children = [
            // Name
            new Paragraph({
                text: resume.name,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),

            // Contact Info
            new Paragraph({
                text: resume.contact.join(' | '),
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),

            // Summary
            new Paragraph({
                text: resume.summary,
                spacing: { before: 200, after: 400 }
            })
        ];

        // Sections
        resume.sections.forEach(section => {
            // Section Title
            children.push(
                new Paragraph({
                    text: section.title.toUpperCase(),
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                })
            );

            // Section Items
            section.items.forEach(item => {
                children.push(
                    new Paragraph({
                        text: item.header,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 }
                    })
                );

                if (item.subheader) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: item.subheader,
                                    italics: true
                                })
                            ],
                            spacing: { before: 100, after: 200 }
                        })
                    );
                }

                // Bullet Points
                item.points.forEach(point => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun("• "),
                                new TextRun(point)
                            ],
                            spacing: { before: 100, after: 100 }
                        })
                    );
                });
            });
        });

        const doc = new Document({
            sections: [{ children }]
        });

        // Generate and save document
        Packer.toBlob(doc).then(blob => {
            window.saveAs(blob, "enhanced-resume.docx");
        });
    }

    initializeChatbot() {
        const chatbot = document.getElementById('chatbot');
        const chatIcon = document.getElementById('chat-icon');
        const chatWindow = document.getElementById('chat-window');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        const chatMessages = document.getElementById('chat-messages');

        // Show chatbot after analysis
        chatbot.classList.remove('hidden');

        // Toggle chat window
        chatIcon.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
            if (!chatWindow.classList.contains('hidden')) {
                chatInput.focus();
            }
        });

        // Handle chat form submission
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;

            // Add user message to chat
            this.addChatMessage(message, true);
            chatInput.value = '';

            // Create context-aware prompt
            const prompt = `
                You are an AI resume assistant. Use the following context to answer questions about the resume and job description.
                Be concise and specific in your answers.

                Resume:
                ${this.resumeText}

                Job Description:
                ${this.jobDescription}

                Analysis Results:
                - ATS Score: ${this.analysis.atsScore}%
                - Matched Keywords: ${this.analysis.matchedKeywords.join(', ')}
                - Missing Keywords: ${this.analysis.missingKeywords.join(', ')}
                - Skill Gaps: ${this.analysis.skillGaps.join(', ')}

                User Question: ${message}
            `;

            try {
                const payload = {
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                    }
                };

                const response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error('Failed to get response');
                }

                const result = await response.json();
                const answer = result.candidates[0].content.parts[0].text;
                this.addChatMessage(answer, false);
            } catch (error) {
                console.error('Chat error:', error);
                this.addChatMessage('Sorry, I encountered an error. Please try again.', false);
            }
        });
    }

    addChatMessage(message, isUser) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ResumeAnalyzer();
});
