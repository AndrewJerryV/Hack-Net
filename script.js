class ResumeAnalyzer {
    constructor() {
        this.resumeText = '';
        this.jobDescription = '';
        this.analysis = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File upload
        document.getElementById('resume-upload').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // Text inputs
        document.getElementById('resume-text').addEventListener('input', (e) => {
            this.resumeText = e.target.value;
            this.updateAnalyzeButton();
        });

        document.getElementById('job-description').addEventListener('input', (e) => {
            this.jobDescription = e.target.value;
            this.updateAnalyzeButton();
        });

        // Analyze button
        document.getElementById('analyze-btn').addEventListener('click', () => {
            this.analyzeResume();
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Export buttons
        document.getElementById('export-pdf-btn').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('export-word-btn').addEventListener('click', () => {
            this.exportToWord();
        });

        // Add these new event listeners after the existing export button listeners
        document.getElementById('export-enhanced-pdf-btn').addEventListener('click', () => {
            this.exportEnhancedResumeToPDF();
        });

        document.getElementById('export-enhanced-word-btn').addEventListener('click', () => {
            this.exportEnhancedResumeToWord();
        });
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.resumeText = e.target.result;
                document.getElementById('resume-text').value = this.resumeText;
                this.updateAnalyzeButton();
            };
            reader.readAsText(file);
        }
    }

    updateAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyze-btn');
        const hasContent = this.resumeText.trim() && this.jobDescription.trim();
        analyzeBtn.disabled = !hasContent;
    }

    async analyzeResume() {
        if (!this.resumeText || !this.jobDescription) return;

        // Show loading state
        document.getElementById('analyze-btn').style.display = 'none';
        document.getElementById('loading').classList.remove('hidden');

        // Simulate AI analysis with realistic delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate mock analysis
        this.analysis = this.generateMockAnalysis();

        // Hide loading and show results
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('analyze-btn').style.display = 'inline-flex';
        document.getElementById('results-section').classList.remove('hidden');

        // Populate results
        this.displayResults();

        // Show export section after displaying results
        document.getElementById('export-section').classList.remove('hidden');
    }

    generateMockAnalysis() {
        // Extract keywords from job description for more realistic analysis
        const jobKeywords = this.extractKeywords(this.jobDescription);
        const resumeKeywords = this.extractKeywords(this.resumeText);
        
        const matchedKeywords = jobKeywords.filter(keyword => 
            resumeKeywords.some(rKeyword => 
                rKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
                keyword.toLowerCase().includes(rKeyword.toLowerCase())
            )
        );

        const missingKeywords = jobKeywords.filter(keyword => 
            !matchedKeywords.some(matched => 
                matched.toLowerCase() === keyword.toLowerCase()
            )
        ).slice(0, 8); // Limit to 8 missing keywords

        // Calculate ATS score based on keyword matching
        const matchPercentage = jobKeywords.length > 0 ? 
            (matchedKeywords.length / jobKeywords.length) * 100 : 0;
        const atsScore = Math.min(Math.max(Math.round(matchPercentage + Math.random() * 20), 45), 95);

        return {
            atsScore: atsScore,
            matchedKeywords: matchedKeywords.slice(0, 10),
            missingKeywords: missingKeywords,
            suggestions: [
                "Add more quantifiable achievements with specific metrics and numbers",
                "Include relevant certifications, courses, or professional development",
                "Optimize section headers and formatting for ATS scanning compatibility",
                "Incorporate more industry-specific keywords naturally throughout your resume",
                "Highlight transferable skills that align with the job requirements"
            ],
            skillGaps: this.generateSkillGaps(missingKeywords),
            enhancedSections: this.generateEnhancedSections()
        };
    }

    extractKeywords(text) {
        // Simple keyword extraction - in a real app, this would be more sophisticated
        const commonWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would',
            'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that', 'these',
            'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
        ]);

        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !commonWords.has(word))
            .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
            .slice(0, 20); // Limit to top 20 keywords
    }

    generateSkillGaps(missingKeywords) {
        const skillCategories = [
            'Technical Skills', 'Programming Languages', 'Software Tools', 
            'Project Management', 'Communication', 'Leadership'
        ];
        
        return missingKeywords.slice(0, 6).map((keyword, index) => 
            skillCategories[index % skillCategories.length] + ': ' + keyword
        );
    }

    generateEnhancedSections() {
        return [
            {
                section: "Professional Summary",
                original: "Experienced professional with background in the field.",
                enhanced: "Results-driven professional with 5+ years of experience delivering high-impact solutions. Proven track record of improving efficiency by 30% and leading cross-functional teams to exceed project goals."
            },
            {
                section: "Work Experience",
                original: "Worked on various projects and tasks.",
                enhanced: "Led development of 3 major projects resulting in $500K cost savings. Collaborated with 15+ stakeholders to implement solutions that improved customer satisfaction by 25%."
            }
        ];
    }

    displayResults() {
        this.displayATSScore();
        this.displayKeywords();
        this.displaySuggestions();
        this.displaySkillGaps();
        this.displayEnhancedSections();
    }

    displayATSScore() {
        const score = this.analysis.atsScore;
        const scoreElement = document.getElementById('ats-score');
        const labelElement = document.getElementById('score-label');
        const progressElement = document.getElementById('progress-fill');
        const messageElement = document.getElementById('score-message');

        // Update score display
        scoreElement.textContent = `${score}%`;
        progressElement.style.width = `${score}%`;

        // Update colors and labels based on score
        let colorClass, label, message;
        if (score >= 80) {
            colorClass = 'score-excellent';
            label = 'Excellent';
            message = `Your resume has a ${score}% ATS compatibility score. Excellent work!`;
            progressElement.className = 'progress-fill progress-excellent';
        } else if (score >= 60) {
            colorClass = 'score-good';
            label = 'Good';
            message = `Your resume has a ${score}% ATS compatibility score. Good, but there's room for improvement.`;
            progressElement.className = 'progress-fill progress-good';
        } else {
            colorClass = 'score-poor';
            label = 'Needs Improvement';
            message = `Your resume has a ${score}% ATS compatibility score. Consider implementing the suggestions below.`;
            progressElement.className = 'progress-fill progress-poor';
        }

        scoreElement.className = `score-number ${colorClass}`;
        labelElement.textContent = label;
        messageElement.textContent = message;
    }

    displayKeywords() {
        const matchedContainer = document.getElementById('matched-keywords');
        const missingContainer = document.getElementById('missing-keywords');

        // Display matched keywords
        matchedContainer.innerHTML = this.analysis.matchedKeywords
            .map(keyword => `<span class="keyword-badge keyword-matched">${keyword}</span>`)
            .join('');

        // Display missing keywords
        missingContainer.innerHTML = this.analysis.missingKeywords
            .map(keyword => `<span class="keyword-badge keyword-missing">${keyword}</span>`)
            .join('');
    }

    displaySuggestions() {
        const container = document.getElementById('suggestions-list');
        container.innerHTML = this.analysis.suggestions
            .map((suggestion, index) => `
                <div class="suggestion-item">
                    <div class="suggestion-number">${index + 1}</div>
                    <div class="suggestion-text">${suggestion}</div>
                </div>
            `).join('');
    }

    displaySkillGaps() {
        const container = document.getElementById('skill-gaps');
        container.innerHTML = this.analysis.skillGaps
            .map(skill => `
                <div class="skill-gap-item">
                    <span class="skill-gap-name">${skill}</span>
                    <span class="skill-gap-badge">Missing</span>
                </div>
            `).join('');
    }

    displayEnhancedSections() {
        const container = document.getElementById('enhanced-sections');
        container.innerHTML = this.analysis.enhancedSections
            .map(section => `
                <div class="enhanced-section">
                    <div class="card-header">
                        <h3>${section.section}</h3>
                        <p>AI-enhanced version of your content</p>
                    </div>
                    <div class="card-content">
                        <div class="section-comparison">
                            <div class="comparison-item original-content">
                                <div class="comparison-label">Original:</div>
                                <div class="comparison-text">${section.original}</div>
                            </div>
                            <div class="separator"></div>
                            <div class="comparison-item enhanced-content">
                                <div class="comparison-label">Enhanced:</div>
                                <div class="comparison-text">${section.enhanced}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    exportToPDF() {
        if (!this.analysis) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set up fonts and colors
        doc.setFont('helvetica');
        
        // Title
        doc.setFontSize(20);
        doc.setTextColor(59, 130, 246);
        doc.text('Resume Analysis Report', 20, 25);
        
        // Date
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
        
        let yPosition = 50;
        
        // ATS Score Section
        doc.setFontSize(16);
        doc.setTextColor(17, 24, 39);
        doc.text('ATS Compatibility Score', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(24);
        const scoreColor = this.analysis.atsScore >= 80 ? [5, 150, 105] : 
                          this.analysis.atsScore >= 60 ? [217, 119, 6] : [220, 38, 38];
        doc.setTextColor(...scoreColor);
        doc.text(`${this.analysis.atsScore}%`, 20, yPosition);
        yPosition += 15;
        
        // Matched Keywords
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text('Matched Keywords:', 20, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setTextColor(22, 101, 52);
        const matchedText = this.analysis.matchedKeywords.join(', ');
        const matchedLines = doc.splitTextToSize(matchedText, 170);
        doc.text(matchedLines, 20, yPosition);
        yPosition += matchedLines.length * 5 + 10;
        
        // Missing Keywords
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text('Missing Keywords:', 20, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setTextColor(153, 27, 27);
        const missingText = this.analysis.missingKeywords.join(', ');
        const missingLines = doc.splitTextToSize(missingText, 170);
        doc.text(missingLines, 20, yPosition);
        yPosition += missingLines.length * 5 + 15;
        
        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Suggestions
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text('Enhancement Suggestions:', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81);
        this.analysis.suggestions.forEach((suggestion, index) => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            const suggestionText = `${index + 1}. ${suggestion}`;
            const suggestionLines = doc.splitTextToSize(suggestionText, 170);
            doc.text(suggestionLines, 20, yPosition);
            yPosition += suggestionLines.length * 5 + 5;
        });
        
        // Skill Gaps
        if (yPosition > 220) {
            doc.addPage();
            yPosition = 20;
        }
        
        yPosition += 10;
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text('Skill Gaps:', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(234, 88, 12);
        this.analysis.skillGaps.forEach((skill, index) => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.text(`• ${skill}`, 25, yPosition);
            yPosition += 6;
        });
        
        // Enhanced Sections
        if (this.analysis.enhancedSections.length > 0) {
            doc.addPage();
            yPosition = 20;
            
            doc.setFontSize(16);
            doc.setTextColor(17, 24, 39);
            doc.text('Enhanced Content Suggestions', 20, yPosition);
            yPosition += 15;
            
            this.analysis.enhancedSections.forEach((section, index) => {
                if (yPosition > 200) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                // Section title
                doc.setFontSize(12);
                doc.setTextColor(17, 24, 39);
                doc.text(section.section, 20, yPosition);
                yPosition += 10;
                
                // Original
                doc.setFontSize(10);
                doc.setTextColor(220, 38, 38);
                doc.text('Original:', 20, yPosition);
                yPosition += 5;
                
                doc.setTextColor(55, 65, 81);
                const originalLines = doc.splitTextToSize(section.original, 170);
                doc.text(originalLines, 20, yPosition);
                yPosition += originalLines.length * 5 + 5;
                
                // Enhanced
                doc.setTextColor(22, 163, 74);
                doc.text('Enhanced:', 20, yPosition);
                yPosition += 5;
                
                doc.setTextColor(55, 65, 81);
                const enhancedLines = doc.splitTextToSize(section.enhanced, 170);
                doc.text(enhancedLines, 20, yPosition);
                yPosition += enhancedLines.length * 5 + 15;
            });
        }
        
        // Save the PDF
        doc.save('resume-analysis-report.pdf');
    }

    exportToWord() {
        if (!this.analysis) return;

        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;
        
        // Create document sections
        const children = [];
        
        // Title
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Resume Analysis Report",
                        bold: true,
                        size: 32,
                        color: "3B82F6"
                    })
                ],
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        );
        
        // Date
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Generated on: ${new Date().toLocaleDateString()}`,
                        italics: true,
                        size: 20,
                        color: "6B7280"
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 }
            })
        );
        
        // ATS Score
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "ATS Compatibility Score",
                        bold: true,
                        size: 24
                    })
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            })
        );
        
        const scoreColor = this.analysis.atsScore >= 80 ? "059669" : 
                          this.analysis.atsScore >= 60 ? "D97706" : "DC2626";
        
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${this.analysis.atsScore}%`,
                        bold: true,
                        size: 36,
                        color: scoreColor
                    }),
                    new TextRun({
                        text: ` - ${this.analysis.atsScore >= 80 ? 'Excellent' : 
                                  this.analysis.atsScore >= 60 ? 'Good' : 'Needs Improvement'}`,
                        size: 20,
                        color: "6B7280"
                    })
                ],
                spacing: { after: 400 }
            })
        );
        
        // Matched Keywords
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Matched Keywords",
                        bold: true,
                        size: 20
                    })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            })
        );
        
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: this.analysis.matchedKeywords.join(', '),
                        color: "166534"
                    })
                ],
                spacing: { after: 300 }
            })
        );
        
        // Missing Keywords
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Missing Keywords",
                        bold: true,
                        size: 20
                    })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            })
        );
        
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: this.analysis.missingKeywords.join(', '),
                        color: "991B1B"
                    })
                ],
                spacing: { after: 400 }
            })
        );
        
        // Suggestions
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Enhancement Suggestions",
                        bold: true,
                        size: 20
                    })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            })
        );
        
        this.analysis.suggestions.forEach((suggestion, index) => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${index + 1}. ${suggestion}`,
                        })
                    ],
                    spacing: { after: 200 }
                })
            );
        });
        
        // Skill Gaps
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Skill Gaps",
                        bold: true,
                        size: 20
                    })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
            })
        );
        
        this.analysis.skillGaps.forEach((skill) => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `• ${skill}`,
                            color: "EA580C"
                        })
                    ],
                    spacing: { after: 100 }
                })
            );
        });
        
        // Enhanced Sections
        if (this.analysis.enhancedSections.length > 0) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Enhanced Content Suggestions",
                            bold: true,
                            size: 20
                        })
                    ],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 200 }
                })
            );
            
            this.analysis.enhancedSections.forEach((section) => {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: section.section,
                                bold: true,
                                size: 16
                            })
                        ],
                        spacing: { before: 300, after: 100 }
                    })
                );
                
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Original: ",
                                bold: true,
                                color: "DC2626"
                            }),
                            new TextRun({
                                text: section.original
                            })
                        ],
                        spacing: { after: 200 }
                    })
                );
                
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Enhanced: ",
                                bold: true,
                                color: "16A34A"
                            }),
                            new TextRun({
                                text: section.enhanced
                            })
                        ],
                        spacing: { after: 300 }
                    })
                );
            });
        }
        
        // Create document
        const doc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });
        
        // Generate and save
        Packer.toBlob(doc).then(blob => {
            saveAs(blob, "resume-analysis-report.docx");
        });
    }

exportEnhancedResumeToPDF() {
    if (!this.analysis || !this.resumeText) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set up fonts and colors
    doc.setFont('helvetica');
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text('Enhanced Resume', 20, 25);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text('Optimized based on AI analysis', 20, 35);
    doc.text(`ATS Score: ${this.analysis.atsScore}%`, 20, 42);
    
    let yPosition = 55;
    
    // Generate enhanced resume content
    const enhancedResume = this.generateEnhancedResumeContent();
    
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    
    // Split content into sections and format
    const sections = enhancedResume.split('\n\n');
    
    sections.forEach((section, index) => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
        
        const lines = section.split('\n');
        const isHeader = lines[0].toUpperCase() === lines[0] && lines[0].length < 50;
        
        if (isHeader) {
            // Section header
            doc.setFontSize(14);
            doc.setTextColor(59, 130, 246);
            doc.text(lines[0], 20, yPosition);
            yPosition += 8;
            
            // Add underline
            doc.setLineWidth(0.5);
            doc.setDrawColor(59, 130, 246);
            doc.line(20, yPosition, 190, yPosition);
            yPosition += 5;
            
            // Section content
            doc.setFontSize(10);
            doc.setTextColor(17, 24, 39);
            
            for (let i = 1; i < lines.length; i++) {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                const contentLines = doc.splitTextToSize(lines[i], 170);
                doc.text(contentLines, 20, yPosition);
                yPosition += contentLines.length * 5 + 2;
            }
        } else {
            // Regular content
            doc.setFontSize(10);
            doc.setTextColor(17, 24, 39);
            const contentLines = doc.splitTextToSize(section, 170);
            doc.text(contentLines, 20, yPosition);
            yPosition += contentLines.length * 5;
        }
        
        yPosition += 8; // Space between sections
    });
    
    // Save the PDF
    doc.save('enhanced-resume.pdf');
}

exportEnhancedResumeToWord() {
    if (!this.analysis || !this.resumeText) return;

    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;
    
    const children = [];
    
    // Header
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "Enhanced Resume",
                    bold: true,
                    size: 32,
                    color: "3B82F6"
                })
            ],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        })
    );
    
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Optimized based on AI analysis | ATS Score: ${this.analysis.atsScore}%`,
                    italics: true,
                    size: 20,
                    color: "6B7280"
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );
    
    // Generate enhanced resume content
    const enhancedResume = this.generateEnhancedResumeContent();
    const sections = enhancedResume.split('\n\n');
    
    sections.forEach((section) => {
        const lines = section.split('\n');
        const isHeader = lines[0].toUpperCase() === lines[0] && lines[0].length < 50;
        
        if (isHeader) {
            // Section header
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: lines[0],
                            bold: true,
                            size: 24,
                            color: "3B82F6"
                        })
                    ],
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                })
            );
            
            // Section content
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: lines[i],
                                    size: 22
                                })
                            ],
                            spacing: { after: 100 }
                        })
                    );
                }
            }
        } else {
            // Regular content
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: section,
                            size: 22
                        })
                    ],
                    spacing: { after: 200 }
                })
            );
        }
    });
    
    // Create document
    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });
    
    // Generate and save
    Packer.toBlob(doc).then(blob => {
        saveAs(blob, "enhanced-resume.docx");
    });
}

generateEnhancedResumeContent() {
    // Parse the original resume and enhance it with AI suggestions
    let enhancedContent = this.resumeText;
    
    // Apply enhanced sections
    this.analysis.enhancedSections.forEach(section => {
        // Simple replacement - in a real app, this would be more sophisticated
        if (enhancedContent.toLowerCase().includes(section.original.toLowerCase())) {
            enhancedContent = enhancedContent.replace(
                new RegExp(section.original, 'gi'), 
                section.enhanced
            );
        }
    });
    
    // Add missing keywords naturally
    const keywordsToAdd = this.analysis.missingKeywords.slice(0, 5);
    
    // Add a skills section if it doesn't exist
    if (!enhancedContent.toLowerCase().includes('skills') && keywordsToAdd.length > 0) {
        enhancedContent += `\n\nKEY SKILLS\n${keywordsToAdd.join(' • ')}`;
    }
    
    // Enhance with quantifiable achievements
    enhancedContent = this.addQuantifiableAchievements(enhancedContent);
    
    // Add ATS-friendly formatting
    enhancedContent = this.optimizeForATS(enhancedContent);
    
    return enhancedContent;
}

addQuantifiableAchievements(content) {
    // Add sample quantifiable achievements based on common patterns
    const achievements = [
        "Improved efficiency by 25% through process optimization",
        "Led cross-functional team of 8+ members to deliver projects on time",
        "Reduced costs by $50K annually through strategic initiatives",
        "Increased customer satisfaction scores by 30%",
        "Managed budget of $100K+ with 95% accuracy"
    ];
    
    // If there's an experience section, enhance it
    if (content.toLowerCase().includes('experience') || content.toLowerCase().includes('work')) {
        const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];
        content += `\n• ${randomAchievement}`;
    }
    
    return content;
}

optimizeForATS(content) {
    // Add standard ATS-friendly section headers if missing
    const sections = ['PROFESSIONAL SUMMARY', 'WORK EXPERIENCE', 'EDUCATION', 'SKILLS'];
    
    sections.forEach(section => {
        if (!content.toUpperCase().includes(section)) {
            // Add placeholder sections based on the section type
            switch(section) {
                case 'PROFESSIONAL SUMMARY':
                    if (!content.toLowerCase().includes('summary') && !content.toLowerCase().includes('objective')) {
                        const summary = `PROFESSIONAL SUMMARY\nResults-driven professional with proven track record of delivering high-impact solutions. Strong expertise in ${this.analysis.matchedKeywords.slice(0, 3).join(', ')} with focus on continuous improvement and innovation.\n\n`;
                        content = summary + content;
                    }
                    break;
                case 'SKILLS':
                    if (!content.toLowerCase().includes('skills')) {
                        const allSkills = [...this.analysis.matchedKeywords, ...this.analysis.missingKeywords.slice(0, 3)];
                        content += `\n\nSKILLS\n${allSkills.join(' • ')}`;
                    }
                    break;
            }
        }
    });
    
    return content;
}
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ResumeAnalyzer();
});
