class ResumeAnalyzer {
    constructor() {
        // --- STATE ---
        this.resumeText = '';
        this.jobDescription = '';
        this.analysis = null;
        this.isLoading = false;
        this.chatbotInitialized = false;
        this.embeddingModelName = 'onnx-community/all-MiniLM-L6-v2-ONNX';
        this.textGenerationModelCandidates = [
            'onnx-community/Qwen2.5-0.5B-Instruct-ONNX',
            'onnx-community/Qwen3-0.6B-ONNX',
            'onnx-community/SmolLM2-360M-Instruct-ONNX'
        ];
        this.transformersModuleUrl = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.0/+esm';
        this.transformersModulePromise = null;
        this.embeddingExtractorPromise = null;
        this.textGeneratorPromise = null;
        this.activeTextGenerationModel = '';
        this.embeddingCache = new Map();
        this.maxEmbeddingCacheEntries = 400;
        this.maxResumeSourceChars = 4800;
        this.maxJobSourceChars = 3000;
        this.runtimeEvents = [];
        this.maxRuntimeEvents = 120;
        this.loadMonitorTimer = null;
        this.loadMonitorStartedAt = 0;
        this.loadMonitorLabel = '';
        this.lastProgressUpdateAt = 0;

        // --- LOCAL NLP CONFIG ---
        this.embeddingSize = 384;
        this.stopWords = new Set([
            'a', 'an', 'and', 'the', 'or', 'for', 'to', 'of', 'in', 'on', 'at', 'by', 'with',
            'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'as', 'that', 'this',
            'these', 'those', 'it', 'its', 'into', 'about', 'over', 'under', 'across', 'through',
            'will', 'would', 'should', 'can', 'could', 'must', 'may', 'might', 'have', 'has',
            'had', 'do', 'does', 'did', 'you', 'your', 'we', 'our', 'their', 'they', 'them',
            'he', 'she', 'his', 'her', 'i', 'me', 'my', 'mine', 'us', 'also', 'etc', 'per'
        ]);
        this.knownSkills = [
            'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'c#', 'go', 'rust', 'php',
            'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring',
            'html', 'css', 'tailwind', 'bootstrap', 'rest api', 'graphql', 'microservices',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'firebase', 'supabase',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'linux', 'git', 'github',
            'ci/cd', 'jenkins', 'github actions', 'unit testing', 'integration testing',
            'machine learning', 'deep learning', 'nlp', 'computer vision', 'pytorch', 'tensorflow',
            'data analysis', 'pandas', 'numpy', 'scikit-learn', 'power bi', 'tableau',
            'agile', 'scrum', 'communication', 'leadership', 'problem solving', 'project management'
        ];
        this.sampleResumeText = `Arjun Mehta
Bengaluru, India | arjun.mehta@email.com | +91 98765 43210
LinkedIn: linkedin.com/in/arjunmehta | GitHub: github.com/arjunmehta

Professional Summary
Software Engineer with 3+ years of experience building scalable web applications using React, TypeScript, Node.js, and PostgreSQL. Skilled in REST APIs, cloud deployment, and CI/CD automation. Strong track record of improving product performance and shipping customer-facing features in agile teams.

Work Experience
Software Engineer | NovaEdge Technologies | Jul 2022 - Present
- Built and maintained React + TypeScript modules for a SaaS dashboard used by 15,000+ monthly users.
- Designed and developed Node.js REST APIs that reduced response latency by 28% through query optimization and caching.
- Collaborated with product and design teams to launch analytics features that increased weekly active usage by 17%.
- Implemented GitHub Actions CI/CD workflows, cutting deployment time from 40 minutes to 12 minutes.

Associate Software Engineer | OrbitSoft Labs | Jan 2021 - Jun 2022
- Developed reusable UI components in React and improved accessibility scores from 72 to 93.
- Wrote unit and integration tests with Jest, raising critical module coverage to 85%.
- Automated report generation pipelines and reduced manual ops effort by 10 hours per week.

Projects
Smart Task Planner
- Built a full-stack task management app using React, Express, and PostgreSQL.
- Added role-based access and optimized API endpoints for better dashboard performance.

Skills
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, SQL, REST API, GitHub Actions, Docker, AWS, Unit Testing, Agile`;
        this.sampleJobDescription = `Job Title: Full Stack Software Engineer
Location: Bengaluru (Hybrid)

We are hiring a Full Stack Software Engineer to build modern, scalable applications across frontend and backend systems.

Responsibilities:
- Develop and maintain frontend features using React and TypeScript.
- Build backend services and REST APIs using Node.js.
- Design efficient SQL queries and work with PostgreSQL databases.
- Collaborate with product managers, designers, and QA in agile sprints.
- Improve application performance, reliability, and deployment velocity.
- Contribute to CI/CD automation and cloud deployment workflows.

Required Skills:
React, TypeScript, Node.js, REST API development, PostgreSQL, SQL, Git, CI/CD, Docker, AWS, unit testing, integration testing, problem solving, communication.

Preferred:
Experience with performance tuning, analytics dashboards, and cross-functional collaboration.`;

        // Bind methods and initialize
        this.handleAnalyzeClick = this.handleAnalyzeClick.bind(this);
        this.initializeEventListeners();
        this.applySampleInputs();
        this.setStatus('Sample resume and job description loaded. Edit them and click Analyze & Customize.', 'info');
        this.startBackgroundModelPreload();
    }

    startBackgroundModelPreload() {
        try {
            if (window.location.protocol === 'file:') return;
        } catch (_) { return; }
        setTimeout(() => {
            this.addRuntimeEvent('Pre-loading MiniLM model in background for faster first analysis...', 'info');
            this.getEmbeddingExtractor()
                .then(() => {
                    this.addRuntimeEvent('MiniLM model cached and ready. Analysis will start immediately on next click.', 'success');
                })
                .catch(() => {});
        }, 100);
    }

    setStatus(message, type = 'info') {
        const statusEl = document.getElementById('app-status');
        if (!statusEl) return;

        const variants = {
            info: 'bg-blue-50 text-blue-700 border-blue-200',
            success: 'bg-green-50 text-green-700 border-green-200',
            warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            error: 'bg-red-50 text-red-700 border-red-200'
        };
        const icons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle'
        };

        statusEl.className = `mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${variants[type] || variants.info}`;
        statusEl.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span></span>`;
        const textEl = statusEl.querySelector('span');
        if (textEl) {
            textEl.textContent = message;
        }
    }

    setLoadingMessage(message) {
        const loadingMessageEl = document.getElementById('loading-message');
        if (loadingMessageEl) {
            loadingMessageEl.textContent = message;
        }
    }

    formatElapsedTime(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    }

    addRuntimeEvent(message, level = 'info') {
        const now = new Date();
        const timestamp = now.toLocaleTimeString();
        this.runtimeEvents.push({ timestamp, message, level });
        if (this.runtimeEvents.length > this.maxRuntimeEvents) {
            this.runtimeEvents.shift();
        }

        const logEl = document.getElementById('runtime-log');
        const detailsEl = document.getElementById('runtime-details');
        if (!logEl) return;

        const styleMap = {
            info: 'text-slate-700',
            success: 'text-emerald-700',
            warning: 'text-amber-700',
            error: 'text-rose-700'
        };

        logEl.innerHTML = this.runtimeEvents.map(event => {
            const cls = styleMap[event.level] || styleMap.info;
            return `<div class="${cls}">[${event.timestamp}] ${event.message}</div>`;
        }).join('');
        logEl.scrollTop = logEl.scrollHeight;
    }

    startLoadMonitor(label) {
        this.stopLoadMonitor();
        this.loadMonitorLabel = label;
        this.loadMonitorStartedAt = Date.now();

        this.loadMonitorTimer = window.setInterval(() => {
            const elapsed = Date.now() - this.loadMonitorStartedAt;
            this.setLoadingMessage(`${this.loadMonitorLabel} in progress... ${this.formatElapsedTime(elapsed)} elapsed.`);

            if (elapsed > 15000 && elapsed % 10000 < 1000) {
                this.addRuntimeEvent(`${this.loadMonitorLabel} is still running (${this.formatElapsedTime(elapsed)}). First-time downloads can take several minutes on slower networks.`, 'warning');
            }
        }, 1000);
    }

    stopLoadMonitor() {
        if (this.loadMonitorTimer) {
            window.clearInterval(this.loadMonitorTimer);
            this.loadMonitorTimer = null;
        }
        this.loadMonitorStartedAt = 0;
        this.loadMonitorLabel = '';
    }

    handlePipelineProgress(progress, contextLabel) {
        if (!progress || typeof progress !== 'object') return;

        const now = Date.now();
        if (now - this.lastProgressUpdateAt < 300) {
            return;
        }
        this.lastProgressUpdateAt = now;

        const status = progress.status || 'loading';
        const isFromCache = status === 'cache' || progress.cached === true;
        const file = progress.file || progress.name || 'model file';
        const loaded = typeof progress.loaded === 'number' ? progress.loaded : null;
        const total = typeof progress.total === 'number' ? progress.total : null;
        const percentValue = typeof progress.progress === 'number'
            ? (progress.progress <= 1 ? progress.progress * 100 : progress.progress)
            : (loaded !== null && total ? (loaded / total) * 100 : null);
        const percent = typeof percentValue === 'number'
            ? Math.round(percentValue * 10) / 10
            : null;

        const label = isFromCache ? 'Loaded from cache' : status;
        const details = percent !== null
            ? `${label}: ${file} (${percent.toFixed(1)}%)`
            : `${label}: ${file}`;

        this.setLoadingMessage(`${contextLabel} ${details}`);
        const eventLevel = isFromCache ? 'success' : 'info';
        this.addRuntimeEvent(`${contextLabel} ${details}`, eventLevel);
    }

    applySampleInputs() {
        const resumeEl = document.getElementById('resume-text');
        const jobEl = document.getElementById('job-description');
        if (!resumeEl || !jobEl) return;

        resumeEl.value = this.sampleResumeText;
        jobEl.value = this.sampleJobDescription;
        this.resumeText = this.sampleResumeText;
        this.jobDescription = this.sampleJobDescription;
        this.updateAnalyzeButtonState();
    }

    escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    normalizeWhitespace(text) {
        return (text || '').replace(/\r/g, '').replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
    }

    tokenize(text) {
        return (text || '')
            .toLowerCase()
            .replace(/[^a-z0-9+#./\-\s]/g, ' ')
            .split(/\s+/)
            .map(token => token.trim())
            .filter(token => token.length > 1 && !this.stopWords.has(token));
    }

    hasPhrase(text, phrase) {
        if (!text || !phrase) return false;
        const pattern = new RegExp(`(^|[^a-z0-9+#./-])${this.escapeRegExp(phrase.toLowerCase())}([^a-z0-9+#./-]|$)`, 'i');
        return pattern.test(text.toLowerCase());
    }

    async getTransformersModule() {
        if (this.transformersModulePromise) {
            return this.transformersModulePromise;
        }

        this.transformersModulePromise = (async () => {
            const module = await import(this.transformersModuleUrl);
            const pipeline = module.pipeline || (module.default && module.default.pipeline);
            const env = module.env || (module.default && module.default.env);

            if (!pipeline || !env) {
                throw new Error('Transformers library failed to load correctly from CDN.');
            }

            env.allowLocalModels = false;
            env.allowRemoteModels = true;

            let cacheAvailable = false;
            try {
                if (typeof globalThis !== 'undefined'
                    && globalThis.caches
                    && typeof globalThis.caches.open === 'function'
                    && globalThis.location
                    && globalThis.location.protocol !== 'file:') {
                    await globalThis.caches.open('__transformers_cache_test__');
                    await globalThis.caches.delete('__transformers_cache_test__');
                    cacheAvailable = true;
                }
            } catch (_err) {
                cacheAvailable = false;
            }
            if (cacheAvailable) {
                env.useBrowserCache = true;
                this.addRuntimeEvent('Browser model cache enabled. Models will persist across sessions.', 'info');
            } else {
                env.useBrowserCache = false;
                this.addRuntimeEvent('Browser Cache API unavailable (or restricted context). Models will download each session.', 'warning');
            }

            if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
                env.backends.onnx.wasm.proxy = false;
                env.backends.onnx.wasm.numThreads = 1;
            }

            return { pipeline, env };
        })().catch(error => {
            this.transformersModulePromise = null;
            throw error;
        });

        return this.transformersModulePromise;
    }

    getPreferredInferenceDevice() {
        const hasWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu;
        return hasWebGPU ? 'webgpu' : 'wasm';
    }

    async getEmbeddingExtractor() {
        if (this.embeddingExtractorPromise) {
            return this.embeddingExtractorPromise;
        }

        this.embeddingExtractorPromise = (async () => {
            try {
                if (window.location.protocol === 'file:') {
                    throw new Error('This app must be opened via http(s), not file://. Use GitHub Pages, Vercel, or a local web server.');
                }

                this.setLoadingMessage('Loading sentence-embedding model (using browser cache if available)...');
                this.setStatus('Loading local sentence model. Cached across sessions via browser Cache API.', 'info');
                this.addRuntimeEvent('Starting sentence embedding model load (MiniLM).', 'info');
                this.startLoadMonitor('Sentence model load');

                const { pipeline } = await this.getTransformersModule();

                const extractor = await pipeline('feature-extraction', this.embeddingModelName, {
                    dtype: 'fp32',
                    progress_callback: progress => this.handlePipelineProgress(progress, 'MiniLM:')
                });

                this.setLoadingMessage('Sentence model loaded. Running semantic matching...');
                this.setStatus('Sentence model is ready. Starting semantic analysis.', 'info');
                this.addRuntimeEvent('Sentence embedding model loaded successfully.', 'success');
                this.stopLoadMonitor();
                return extractor;
            } catch (error) {
                this.embeddingExtractorPromise = null;
                this.stopLoadMonitor();
                const reason = error && error.message ? error.message : 'Unknown model initialization error.';
                this.setStatus(`Model load failed: ${reason}`, 'error');
                this.addRuntimeEvent(`Sentence model load failed: ${reason}`, 'error');
                throw new Error(`Sentence model failed to initialize: ${reason}`);
            }
        })();

        return this.embeddingExtractorPromise;
    }

    async getTextGenerator() {
        if (this.textGeneratorPromise) {
            return this.textGeneratorPromise;
        }

        this.textGeneratorPromise = (async () => {
            try {
                if (window.location.protocol === 'file:') {
                    throw new Error('This app must be opened via http(s), not file://. Use GitHub Pages, Vercel, or a local web server.');
                }

                this.setLoadingMessage('Loading local small LLM for high-quality resume rewriting...');
                this.setStatus('Loading local resume-writing LLM. First run can take a while while model files download.', 'info');
                this.addRuntimeEvent('Starting local small LLM initialization for resume rewriting.', 'info');

                const { pipeline } = await this.getTransformersModule();
                const device = this.getPreferredInferenceDevice();
                const attempts = [];
                const totalCandidates = this.textGenerationModelCandidates.length;
                let attemptNumber = 0;

                for (const modelName of this.textGenerationModelCandidates) {
                    const optionCandidates = device === 'webgpu'
                        ? [{ device, dtype: 'q4f16' }, { device }]
                        : [{ device, dtype: 'q8' }, { device }];

                    for (const options of optionCandidates) {
                        attemptNumber++;
                        const modeLabel = options.dtype ? `${options.device}/${options.dtype}` : options.device;
                        this.setLoadingMessage(`Loading rewrite model ${attemptNumber}/${totalCandidates * optionCandidates.length}: ${modelName} (${modeLabel})...`);
                        this.setStatus(`Attempt ${attemptNumber}: loading ${modelName} on ${modeLabel}.`, 'info');
                        this.addRuntimeEvent(`Attempt ${attemptNumber}: trying ${modelName} (${modeLabel}).`, 'info');
                        this.startLoadMonitor(`LLM load (${modelName})`);

                        try {
                            const generator = await pipeline('text-generation', modelName, {
                                ...options,
                                progress_callback: progress => this.handlePipelineProgress(progress, `${modelName}:`)
                            });
                            this.stopLoadMonitor();
                            this.activeTextGenerationModel = modelName;
                            this.setStatus(`Local LLM ready (${modelName}). Generating upgraded resume draft.`, 'info');
                            this.addRuntimeEvent(`Loaded rewrite model successfully: ${modelName} (${modeLabel}).`, 'success');
                            return generator;
                        } catch (err) {
                            this.stopLoadMonitor();
                            const reason = err && err.message ? err.message : 'Unknown error';
                            attempts.push(`${modelName} (${JSON.stringify(options)}): ${reason}`);
                            this.addRuntimeEvent(`Attempt failed for ${modelName} (${modeLabel}): ${reason}`, 'warning');
                        }
                    }
                }

                throw new Error(attempts.slice(0, 2).join(' | '));
            } catch (error) {
                this.textGeneratorPromise = null;
                this.stopLoadMonitor();
                const reason = error && error.message ? error.message : 'Unknown text-generation model initialization error.';
                this.setStatus(`Resume LLM load failed: ${reason}`, 'error');
                this.addRuntimeEvent(`Resume LLM initialization failed: ${reason}`, 'error');
                throw new Error(`Resume LLM failed to initialize: ${reason}`);
            }
        })();

        return this.textGeneratorPromise;
    }

    cacheEmbedding(cacheKey, vector) {
        if (this.embeddingCache.size >= this.maxEmbeddingCacheEntries) {
            const oldest = this.embeddingCache.keys().next().value;
            if (oldest) {
                this.embeddingCache.delete(oldest);
            }
        }
        this.embeddingCache.set(cacheKey, vector);
    }

    async embedText(text) {
        const normalized = this.normalizeWhitespace(text).slice(0, 1800);
        if (!normalized) {
            return new Float32Array(this.embeddingSize);
        }

        if (this.embeddingCache.has(normalized)) {
            return this.embeddingCache.get(normalized);
        }

        try {
            const extractor = await this.getEmbeddingExtractor();
            const output = await extractor(normalized, {
                pooling: 'mean',
                normalize: true
            });

            const vector = Float32Array.from(output.data);
            this.cacheEmbedding(normalized, vector);
            return vector;
        } catch (error) {
            const reason = error && error.message ? error.message : 'Unknown inference error.';
            throw new Error(`Sentence model inference failed: ${reason}`);
        }
    }

    cosineSimilarity(vectorA, vectorB) {
        let dot = 0;
        for (let i = 0; i < vectorA.length; i++) dot += vectorA[i] * vectorB[i];
        return Math.max(0, Math.min(1, (dot + 1) / 2));
    }

    splitSentences(text) {
        return (text || '')
            .split(/[\n.!?]+/)
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length >= 25);
    }

    extractImportantTerms(text, maxTerms = 20) {
        const tokens = this.tokenize(text);
        const counts = new Map();

        tokens.forEach(token => {
            counts.set(token, (counts.get(token) || 0) + 1);
        });

        for (let i = 0; i < tokens.length - 1; i++) {
            const bigram = `${tokens[i]} ${tokens[i + 1]}`;
            if (tokens[i].length > 2 && tokens[i + 1].length > 2) {
                counts.set(bigram, (counts.get(bigram) || 0) + 1.7);
            }
        }

        this.knownSkills.forEach(skill => {
            if (this.hasPhrase(text, skill)) {
                counts.set(skill, (counts.get(skill) || 0) + 2.5);
            }
        });

        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
            .map(([term]) => term)
            .filter((term, index, arr) => arr.indexOf(term) === index)
            .slice(0, maxTerms);
    }

    extractSkillMentions(text) {
        const mentions = this.knownSkills.filter(skill => this.hasPhrase(text, skill));
        return [...new Set(mentions)];
    }

    async calculateSemanticAlignment(resume, jobDesc) {
        const resumeSentences = this.splitSentences(resume);
        const jdSentences = this.splitSentences(jobDesc);

        if (!resumeSentences.length || !jdSentences.length) return 0;

        const resumeEmbeddings = await Promise.all(resumeSentences.map(sentence => this.embedText(sentence)));
        const jdEmbeddings = await Promise.all(jdSentences.map(sentence => this.embedText(sentence)));

        let cumulativeScore = 0;
        jdEmbeddings.forEach(jdVector => {
            let best = 0;
            resumeEmbeddings.forEach(resumeVector => {
                best = Math.max(best, this.cosineSimilarity(jdVector, resumeVector));
            });
            cumulativeScore += best;
        });

        return cumulativeScore / jdEmbeddings.length;
    }

    calculateFormatScore(resume) {
        const hasEmail = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(resume);
        const hasPhone = /(\+\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/.test(resume);
        const hasBullets = /^\s*[-*•]/m.test(resume);
        const hasSections = /(experience|education|skills|projects|summary)/i.test(resume);

        const checks = [hasEmail, hasPhone, hasBullets, hasSections];
        return checks.filter(Boolean).length / checks.length;
    }

    parseResumeStructure(resume) {
        const lines = (resume || '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);

        const name = lines[0] && !/@/.test(lines[0]) ? lines[0] : 'Candidate Name';

        const contact = lines
            .slice(0, 8)
            .filter(line => /@|linkedin|github|\+?\d{7,}|portfolio|www\./i.test(line))
            .slice(0, 4);

        const headingPattern = /^(professional\s+summary|summary|objective|experience|work\s+experience|professional\s+experience|education|projects?|skills?|technical\s+skills|certifications?|achievements?|internships?)$/i;
        const isContactLine = (line) => /@|linkedin|github|\+?\d{7,}|portfolio|www\./i.test(line);

        const sections = [];
        let current = null;

        lines.slice(1).forEach(line => {
            if (headingPattern.test(line.toLowerCase())) {
                if (current && current.lines.length) {
                    sections.push(current);
                }
                current = { title: this.toTitleCase(line), lines: [] };
                return;
            }

            if (!current) {
                if (!isContactLine(line)) {
                    current = { title: 'Professional Experience', lines: [line] };
                }
                return;
            }

            current.lines.push(line);
        });

        if (current && current.lines.length) {
            sections.push(current);
        }

        const mappedSections = sections
            .slice(0, 7)
            .map(section => ({
                title: section.title,
                items: this.parseSectionItems(section)
            }))
            .filter(section => section.items.length);

        return {
            name,
            contact,
            sections: mappedSections.length ? mappedSections : [{
                title: 'Professional Experience',
                items: [{
                    header: 'Experience Highlights',
                    subheader: '',
                    points: []
                }]
            }]
        };
    }

    parseSectionItems(section) {
        const sectionTitle = section && section.title ? section.title : 'Section';
        const rawLines = Array.isArray(section && section.lines) ? section.lines : [];

        if (/skills|other/i.test(sectionTitle)) {
            const skills = [...new Set(
                rawLines
                    .flatMap(line => line.replace(/^[-*•]\s*/, '').split(/[,;|]/))
                    .map(token => token.trim())
                    .filter(token => token.length >= 2 && token.length <= 35)
            )];

            return [{
                header: /other/i.test(sectionTitle) ? 'Technical Skills' : 'Skills',
                subheader: '',
                points: skills
            }];
        }

        const items = [];
        let current = null;

        const pushCurrent = () => {
            if (!current) return;
            if (current.header || current.subheader || current.points.length) {
                items.push(current);
            }
        };

        rawLines.forEach(rawLine => {
            const line = String(rawLine || '').trim();
            if (!line) return;

            if (/^[-*•]\s*/.test(line)) {
                if (!current) {
                    current = { header: `${sectionTitle} Highlights`, subheader: '', points: [] };
                }
                current.points.push(line.replace(/^[-*•]\s*/, ''));
                return;
            }

            const looksLikeRoleDateLine = line.includes('|') && line.length <= 130;
            if (looksLikeRoleDateLine) {
                pushCurrent();
                current = { header: line, subheader: '', points: [] };
                return;
            }

            if (!current) {
                current = { header: `${sectionTitle} Highlights`, subheader: '', points: [] };
            }

            const canBeSubheader = !current.subheader
                && line.length <= 100
                && !/[.!?]$/.test(line)
                && /[a-z]/i.test(line)
                && !/^\d+$/.test(line);

            if (canBeSubheader) {
                current.subheader = line;
            } else {
                current.points.push(line);
            }
        });

        pushCurrent();

        return items.length
            ? items
            : [{ header: `${sectionTitle} Highlights`, subheader: '', points: rawLines.slice(0, 5) }];
    }

    toTitleCase(text) {
        const normalized = (text || '').toLowerCase().trim();
        const titleMap = {
            'professional summary': 'Professional Summary',
            'summary': 'Professional Summary',
            'objective': 'Career Objective',
            'experience': 'Professional Experience',
            'work experience': 'Professional Experience',
            'professional experience': 'Professional Experience',
            'education': 'Education',
            'project': 'Projects',
            'projects': 'Projects',
            'skill': 'Skills',
            'skills': 'Skills',
            'technical skills': 'Skills',
            'certification': 'Certifications',
            'certifications': 'Certifications',
            'achievement': 'Achievements',
            'achievements': 'Achievements',
            'internship': 'Internships',
            'internships': 'Internships'
        };

        if (titleMap[normalized]) {
            return titleMap[normalized];
        }

        return normalized
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .trim();
    }

    buildTemplateEnhancedResume(resume, jobDesc, matchedKeywords, missingKeywords, jdSkills = [], resumeSkills = [], prioritizedPoints = []) {
        const parsed = this.parseResumeStructure(resume);
        const roleHint = this.extractRoleTitle(jobDesc);
        const sharedSkills = jdSkills.filter(skill => resumeSkills.includes(skill));

        const summaryKeywords = [...new Set([...sharedSkills, ...matchedKeywords])].slice(0, 6).join(', ');
        const summary = `Results-driven ${roleHint} candidate with hands-on experience in ${summaryKeywords || 'core technical and professional skills'}. Proven ability to deliver measurable product improvements, collaborate across teams, and build reliable solutions aligned with business goals.`;

        const normalizedPriority = prioritizedPoints.map(point => this.enhancePointText(point));

        const sections = parsed.sections
            .filter(section => !/summary|objective/i.test(section.title))
            .map(section => ({
                title: section.title,
                items: (section.items || []).map(item => {
                    const isSkillsSection = /skills|other/i.test(section.title || '');
                    const basePoints = Array.isArray(item.points) ? item.points : [];
                    const improvedPoints = isSkillsSection
                        ? basePoints.map(point => this.formatSkillLabel(point)).filter(Boolean).slice(0, 18)
                        : basePoints.map(point => this.enhancePointText(point)).filter(Boolean).slice(0, 5);

                    return {
                        header: item.header,
                        subheader: item.subheader,
                        points: improvedPoints.length
                            ? improvedPoints
                            : (isSkillsSection
                                ? [...new Set(resumeSkills)].slice(0, 14).map(skill => this.formatSkillLabel(skill))
                                : normalizedPriority.slice(0, 4))
                    };
                })
            }))
            .filter(section => section.items && section.items.length);

        if (!sections.length) {
            sections.push({
                title: 'Professional Experience',
                items: [{
                    header: 'Relevant Highlights',
                    subheader: '',
                    points: normalizedPriority.length
                        ? normalizedPriority.slice(0, 5)
                        : ['Add measurable impact bullets from recent projects and roles.']
                }]
            });
        }

        const hasSkillsSection = sections.some(section => /skills|other/i.test(section.title || ''));
        if (!hasSkillsSection && resumeSkills.length) {
            sections.push({
                title: 'Other',
                items: [{
                    header: 'Technical Skills',
                    subheader: '',
                    points: [...new Set(resumeSkills)].slice(0, 14).map(skill => this.formatSkillLabel(skill))
                }]
            });
        }

        return {
            name: parsed.name,
            contact: parsed.contact.length ? parsed.contact : ['email@example.com', 'LinkedIn URL', 'Phone Number'],
            summary,
            sections
        };
    }

    extractRoleTitle(jobDesc) {
        const raw = jobDesc || '';
        const explicitTitleMatch = raw.match(/job\s*title\s*:\s*([^\n]+)/i);
        if (explicitTitleMatch && explicitTitleMatch[1]) {
            return explicitTitleMatch[1].trim();
        }

        const firstLine = raw
            .split(/\r?\n/)
            .map(line => line.trim())
            .find(Boolean);

        if (firstLine && firstLine.length <= 80) {
            return firstLine;
        }

        return 'target role';
    }

    formatSkillLabel(skill) {
        if (!skill) return '';
        return skill
            .split(/\s+/)
            .map(token => token.length > 2 ? token.charAt(0).toUpperCase() + token.slice(1) : token.toUpperCase())
            .join(' ')
            .trim();
    }

    enhancePointText(point) {
        if (!point || typeof point !== 'string') return '';
        let clean = point.replace(/\s+/g, ' ').replace(/^[-*•]\s*/, '').trim();
        if (!clean) return '';

        if (!/^(Built|Designed|Developed|Implemented|Led|Optimized|Automated|Improved|Created|Delivered|Collaborated|Managed|Architected|Reduced|Increased|Launched|Owned)\b/i.test(clean)) {
            clean = `Delivered ${clean.charAt(0).toLowerCase()}${clean.slice(1)}`;
        }

        if (!/[.!?]$/.test(clean)) {
            clean += '.';
        }

        return clean;
    }

    async getMostRelevantResumePoints(resume, jobDesc, maxPoints = 10) {
        const candidates = [...new Set(
            (resume || '')
                .split(/\r?\n/)
                .map(line => line.trim())
                .map(line => line.replace(/^[-*•]\s*/, ''))
                .filter(line => line.length >= 20)
        )];

        if (!candidates.length) {
            return [];
        }

        try {
            const jdVector = await this.embedText(jobDesc);
            const candidateVectors = await Promise.all(candidates.map(point => this.embedText(point)));

            return candidates
                .map((point, index) => ({ point, score: this.cosineSimilarity(jdVector, candidateVectors[index]) }))
                .sort((a, b) => b.score - a.score)
                .slice(0, maxPoints)
                .map(item => item.point);
        } catch (error) {
            this.addRuntimeEvent('Could not rank bullets by semantic relevance. Falling back to resume order.', 'warning');
            return candidates.slice(0, maxPoints);
        }
    }

    sanitizeSourceForPrompt(text, maxChars) {
        return (text || '').replace(/\u0000/g, '').slice(0, maxChars).trim();
    }

    getResumeRewriteMessages(resume, jobDesc, matchedKeywords, missingKeywords) {
        const resumeText = this.sanitizeSourceForPrompt(resume, this.maxResumeSourceChars);
        const jdText = this.sanitizeSourceForPrompt(jobDesc, this.maxJobSourceChars);
        const matched = matchedKeywords.slice(0, 10).join(', ') || 'none';
        const missing = missingKeywords.slice(0, 10).join(', ') || 'none';

        return [
            {
                role: 'system',
                content: 'You are an expert resume writer for ATS optimization. Rewrite resumes with truthful, concise, measurable bullets. Return ONLY valid JSON with this exact schema: {"name":"string","contact":["string"],"summary":"string","sections":[{"title":"string","items":[{"header":"string","subheader":"string","points":["string"]}]}]}. Do not include markdown fences, explanations, or extra keys. Keep 3-6 sections and 2-5 bullets per item. Preserve facts from source resume, never invent companies, dates, or metrics.'
            },
            {
                role: 'user',
                content: `Target job description:\n${jdText}\n\nSource resume:\n${resumeText}\n\nMatched keywords: ${matched}\nMissing keywords to weave in only when truthful: ${missing}\n\nTask: produce an improved ATS-friendly resume in the required JSON schema.`
            }
        ];
    }

    extractGeneratedText(output) {
        if (!Array.isArray(output) || !output.length) return '';
        const payload = output[0] && output[0].generated_text;
        if (typeof payload === 'string') return payload;
        if (Array.isArray(payload)) {
            const last = payload[payload.length - 1];
            if (last && typeof last.content === 'string') return last.content;
            return payload.map(item => (item && item.content) ? item.content : '').join('\n').trim();
        }
        if (payload && typeof payload.content === 'string') return payload.content;
        return '';
    }

    extractFirstJSONObject(text) {
        if (!text) return null;

        const start = text.indexOf('{');
        if (start === -1) return null;

        let depth = 0;
        let inString = false;
        let escaping = false;

        for (let i = start; i < text.length; i++) {
            const ch = text[i];

            if (inString) {
                if (escaping) {
                    escaping = false;
                } else if (ch === '\\') {
                    escaping = true;
                } else if (ch === '"') {
                    inString = false;
                }
                continue;
            }

            if (ch === '"') {
                inString = true;
                continue;
            }
            if (ch === '{') {
                depth++;
                continue;
            }
            if (ch === '}') {
                depth--;
                if (depth === 0) {
                    return text.slice(start, i + 1);
                }
            }
        }

        return null;
    }

    sanitizeEnhancedResume(rawResume, fallbackResume) {
        if (!rawResume || typeof rawResume !== 'object') {
            return fallbackResume;
        }

        const cleanText = (value, fallback = '') => {
            if (typeof value !== 'string') return fallback;
            return value.replace(/\s+/g, ' ').trim();
        };

        const name = cleanText(rawResume.name, fallbackResume.name || 'Candidate Name');
        const summary = cleanText(rawResume.summary, fallbackResume.summary || '');

        const contact = Array.isArray(rawResume.contact)
            ? rawResume.contact.map(item => cleanText(item)).filter(Boolean).slice(0, 6)
            : [];

        const sections = Array.isArray(rawResume.sections)
            ? rawResume.sections
                .map(section => {
                    const title = cleanText(section && section.title);
                    const items = Array.isArray(section && section.items)
                        ? section.items.map(item => {
                            const header = cleanText(item && item.header);
                            const subheader = cleanText(item && item.subheader);
                            const points = Array.isArray(item && item.points)
                                ? item.points.map(point => cleanText(point)).filter(Boolean).slice(0, 6)
                                : [];

                            return {
                                header,
                                subheader,
                                points
                            };
                        }).filter(item => item.header || item.points.length)
                        : [];

                    return { title, items };
                })
                .filter(section => section.title && section.items.length)
                .slice(0, 7)
            : [];

        return {
            name: name || fallbackResume.name,
            contact: contact.length ? contact : fallbackResume.contact,
            summary: summary || fallbackResume.summary,
            sections: sections.length ? sections : fallbackResume.sections
        };
    }

    async buildEnhancedResume(resume, jobDesc, matchedKeywords, missingKeywords) {
        this.setLoadingMessage('Composing enhanced resume from structured template and MiniLM relevance signals...');
        this.setStatus('Using template-guided enhancement (lightweight local mode).', 'info');
        this.addRuntimeEvent('Template-guided enhancement started (Qwen generation disabled in active flow).', 'info');

        const cleanResume = this.normalizeWhitespace(resume);
        const cleanJobDesc = this.normalizeWhitespace(jobDesc);
        const jdSkills = this.extractSkillMentions(cleanJobDesc);
        const resumeSkills = this.extractSkillMentions(cleanResume);
        const prioritizedPoints = await this.getMostRelevantResumePoints(resume, jobDesc, 10);

        const enhanced = this.buildTemplateEnhancedResume(
            resume,
            jobDesc,
            matchedKeywords,
            missingKeywords,
            jdSkills,
            resumeSkills,
            prioritizedPoints
        );

        this.addRuntimeEvent('Template-guided enhancement completed.', 'success');
        return enhanced;
    }

    buildSuggestions(matchedKeywords, missingKeywords, skillGaps, resume, score) {
        const suggestions = [];

        if (missingKeywords.length) {
            suggestions.push(`Integrate these high-priority job keywords into relevant experience bullets: ${missingKeywords.slice(0, 5).join(', ')}.`);
        }

        if (skillGaps.length) {
            suggestions.push(`Address visible skill gaps by adding proof-based bullets for: ${skillGaps.slice(0, 4).join(', ')}.`);
        }

        if (!/(\d+%|\d+\+|\$\d+|improved|reduced|increased|saved|grew)/i.test(resume)) {
            suggestions.push('Quantify achievements with metrics (percentages, time saved, revenue impact, users served) to improve ATS and recruiter confidence.');
        }

        if (!/(summary|objective)/i.test(resume)) {
            suggestions.push('Add a concise professional summary tailored to the target role and include 3-4 core competencies.');
        }

        if (score < 65) {
            suggestions.push('Reorder sections so the most relevant experience and skills for this job appear near the top of your resume.');
        }

        if (suggestions.length < 3) {
            suggestions.push('Use strong action verbs at the start of bullet points (Built, Led, Optimized, Designed, Automated).');
        }

        return suggestions.slice(0, 5);
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
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.exportAnalysisToPDF());
        }

        const exportEnhancedPdfBtn = document.getElementById('export-enhanced-pdf-btn');
        if (exportEnhancedPdfBtn) {
            exportEnhancedPdfBtn.addEventListener('click', () => this.exportEnhancedResumeToPDF());
        }

        // Modal close button
        document.getElementById('close-modal-btn').addEventListener('click', () => this.showErrorModal(false));
    }

    /**
     * Reads a .txt file and populates the resume textarea.
     * @param {Event} event - The file input change event.
     */
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            let text = e.target.result;
            const name = file.name.toLowerCase();

            if (name.endsWith('.pdf')) {
                text = this.extractTextFromPDF(text);
            } else if (name.endsWith('.docx')) {
                try {
                    text = this.extractTextFromDocx(text);
                } catch (_) {
                    text = text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
                }
            } else if (name.endsWith('.doc')) {
                text = text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
            }

            this.resumeText = text;
            document.getElementById('resume-text').value = text;
            this.updateAnalyzeButtonState();
            this.setStatus(`Loaded ${file.name} — text extracted. Please review and edit if needed.`, 'success');
        };
        reader.onerror = () => {
            this.setStatus('Could not read the selected file.', 'error');
        };
        reader.readAsText(file);
    }

    extractTextFromPDF(raw) {
        const cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
        const lines = cleaned.split(/\r?\n/).filter(Boolean);
        const filtered = lines.filter(line => {
            const s = line.trim();
            if (!s || s.length < 3) return false;
            if (/^[\s!-/:-@\[-`{-~]+$/.test(s)) return false;
            if (/^\d+\s*\d*\s*$/.test(s)) return false;
            return true;
        });
        return filtered.join('\n').trim() || cleaned.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    extractTextFromDocx(raw) {
        const text = raw.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
        const lines = text.split(/\s{3,}/).filter(Boolean);
        return lines.length > 3 ? lines.join('\n') : text;
    }

    /**
     * Enables or disables the "Analyze" button based on input content.
     */
    updateAnalyzeButtonState() {
        const analyzeBtn = document.getElementById('analyze-btn');
        if (!analyzeBtn) return;
        const hasContent = this.resumeText.trim() && this.jobDescription.trim();
        analyzeBtn.disabled = !hasContent || this.isLoading;
    }

    /**
     * Toggles the loading state of the UI.
     * @param {boolean} isLoading - Whether to show the loading indicator.
     */
    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        const loadingEl = document.getElementById('loading');
        const btnEl = document.getElementById('analyze-btn');
        if (loadingEl) loadingEl.classList.toggle('hidden', !isLoading);
        if (btnEl) btnEl.classList.toggle('hidden', isLoading);
        if (!isLoading) {
            this.stopLoadMonitor();
            this.setLoadingMessage('MiniLM runs fully in-browser for ATS matching and template-guided resume enhancement.');
        }
        this.updateAnalyzeButtonState();
    }

    /**
     * Main handler for the "Analyze" button click.
     */
    async handleAnalyzeClick() {
        if (!this.resumeText.trim() || !this.jobDescription.trim()) {
            this.setStatus('Please provide both resume and job description before analyzing.', 'warning');
            this.showErrorModal(true, "Please provide both your resume and the job description.");
            return;
        }

        this.setStatus('Starting analysis...', 'info');
        this.addRuntimeEvent('Analysis started by user.', 'info');
        this.setLoadingMessage('Preparing local MiniLM analysis and template composer...');
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
                this.setStatus('Analysis complete. Review ATS score, suggestions, and enhanced resume below.', 'success');
                this.addRuntimeEvent('Analysis completed successfully.', 'success');
            }
        } catch (error) {
            console.error("Analysis failed:", error);
            this.setStatus(error.message || 'Analysis failed due to a runtime error.', 'error');
            this.addRuntimeEvent(`Analysis failed: ${error.message || 'Unknown runtime error.'}`, 'error');
            this.showErrorModal(true, error.message || "An unknown error occurred during analysis.");
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Performs fully local analysis using in-browser sentence embeddings and heuristic scoring.
     * @param {string} resume - The user's resume text.
     * @param {string} jobDesc - The target job description text.
     * @returns {Promise<object>} - The analysis object.
     */
    async getAiAnalysis(resume, jobDesc) {
        this.setLoadingMessage('Extracting job keywords and required skills...');
        const rawResume = resume || '';
        const rawJobDesc = jobDesc || '';
        const cleanResume = this.normalizeWhitespace(rawResume);
        const cleanJobDesc = this.normalizeWhitespace(rawJobDesc);

        const jdTerms = this.extractImportantTerms(cleanJobDesc, 18);
        const matchedKeywords = jdTerms.filter(term => this.hasPhrase(cleanResume, term)).slice(0, 10);
        const missingKeywords = jdTerms.filter(term => !this.hasPhrase(cleanResume, term)).slice(0, 10);

        const jdSkills = this.extractSkillMentions(cleanJobDesc);
        const resumeSkills = this.extractSkillMentions(cleanResume);
        const skillGaps = jdSkills.filter(skill => !resumeSkills.includes(skill)).slice(0, 10);

        const keywordCoverage = jdTerms.length ? matchedKeywords.length / jdTerms.length : 0;
        this.setLoadingMessage('Running MiniLM semantic similarity checks...');
        const semanticAlignment = await this.calculateSemanticAlignment(cleanResume, cleanJobDesc);
        const formatScore = this.calculateFormatScore(cleanResume);

        const weightedScore = (keywordCoverage * 0.55) + (semanticAlignment * 0.35) + (formatScore * 0.10);
        const atsScore = Math.max(0, Math.min(100, Math.round(weightedScore * 100)));

        this.setLoadingMessage('Finalizing ATS score, suggestions, and template-enhanced resume...');
        const enhancedResume = await this.buildEnhancedResume(rawResume, rawJobDesc, matchedKeywords, missingKeywords);

        return {
            atsScore,
            matchedKeywords,
            missingKeywords,
            suggestions: this.buildSuggestions(matchedKeywords, missingKeywords, skillGaps, cleanResume, atsScore),
            skillGaps,
            enhancedResume
        };
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
        scoreElement.className = `absolute inset-0 flex items-center justify-center text-3xl font-bold tracking-tight ${colorClass}`;
        labelElement.textContent = label;
        labelElement.className = `mt-2.5 text-xs font-semibold text-center uppercase tracking-wider ${colorClass}`;
        messageElement.textContent = message;

        const statsEl = document.getElementById('analysis-stats');
        if (statsEl) {
            const setStat = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            setStat('stat-matched', this.analysis.matchedKeywords.length);
            setStat('stat-missing', this.analysis.missingKeywords.length);
            setStat('stat-gaps', this.analysis.skillGaps.length);
            statsEl.classList.remove('hidden');
        }
    }

    displayKeywords() {
        const createKeywordBadge = (keyword, type, index) => {
            const colors = type === 'matched'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                : 'bg-red-50 text-red-600 border-red-200/50';
            return `<span class="py-1.5 px-3.5 rounded-full text-sm font-medium border ${colors}" style="animation:fadeIn 0.25s ease-out ${index * 0.04}s both">${keyword}</span>`;
        };

        document.getElementById('matched-keywords').innerHTML = this.analysis.matchedKeywords.map((k, i) => createKeywordBadge(k, 'matched', i)).join('');
        document.getElementById('missing-keywords').innerHTML = this.analysis.missingKeywords.map((k, i) => createKeywordBadge(k, 'missing', i)).join('');
    }

    displaySuggestions() {
        document.getElementById('suggestions-list').innerHTML = this.analysis.suggestions.map((s, i) => `
            <div class="flex items-start p-4 bg-blue-50/80 rounded-xl border border-blue-100/50" style="animation:fadeIn 0.3s ease-out ${i * 0.08}s both">
                <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <i class="fas fa-lightbulb text-blue-600 text-sm"></i>
                </div>
                <p class="text-gray-700 text-sm ml-3 leading-relaxed">${s}</p>
            </div>
        `).join('');
    }

    displaySkillGaps() {
        document.getElementById('skill-gaps').innerHTML = this.analysis.skillGaps.map((skill, i) => `
            <span class="py-1.5 px-4 rounded-full text-sm font-medium bg-amber-50 text-amber-700 flex items-center border border-amber-200/50" style="animation:fadeIn 0.25s ease-out ${i * 0.05}s both">
                <i class="fas fa-exclamation-triangle text-amber-400 mr-2 text-xs"></i>${skill}
            </span>
        `).join('');
    }

    escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    splitHeaderRow(text) {
        const raw = String(text || '').trim();
        if (!raw) return { left: '', right: '' };

        const parts = raw.split('|').map(part => part.trim()).filter(Boolean);
        if (parts.length < 2) {
            return { left: raw, right: '' };
        }

        const candidateRight = parts[parts.length - 1];
        const looksLikeMeta = /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b\s*\d{4}|present|\d{4}|remote|hybrid|onsite|[A-Za-z]+\s*,\s*[A-Za-z]{2,})/i.test(candidateRight);
        if (!looksLikeMeta) {
            return { left: raw, right: '' };
        }

        return {
            left: parts.slice(0, -1).join(' | '),
            right: candidateRight
        };
    }

    getDisplaySectionTitle(title) {
        const normalized = String(title || '').trim().toLowerCase();
        const map = {
            'professional experience': 'WORK EXPERIENCE',
            'work experience': 'WORK EXPERIENCE',
            'experience': 'WORK EXPERIENCE',
            'education': 'EDUCATION',
            'skills': 'SKILLS SUMMARY',
            'projects': 'PROJECTS',
            'certifications': 'CERTIFICATES',
            'other': 'OTHER'
        };

        if (map[normalized]) {
            return map[normalized];
        }

        return String(title || 'SECTION').toUpperCase();
    }

    formatContactLine(entry) {
        const text = String(entry || '').trim();
        if (!text) return '';

        const match = text.match(/^([A-Za-z][A-Za-z\s/+-]{1,20})\s*:\s*(.+)$/);
        if (!match) return text;

        return `${match[1].trim()}: ${match[2].trim()}`;
    }

    getContactColumns(contactEntries) {
        const left = [];
        const right = [];

        (contactEntries || []).forEach((entry, index) => {
            const text = this.formatContactLine(entry);
            if (!text) return;

            if (/(email|mobile|phone|contact)/i.test(text)) {
                right.push(text);
            } else if (/(linkedin|github|behance|portfolio|website|location|address)/i.test(text)) {
                left.push(text);
            } else {
                (index % 2 === 0 ? left : right).push(text);
            }
        });

        const mergedLeft = left.length ? left : (contactEntries || []).map(entry => this.formatContactLine(entry)).slice(0, 2);
        const mergedRight = right.length ? right : (contactEntries || []).map(entry => this.formatContactLine(entry)).slice(2, 4);

        return {
            left: mergedLeft.filter(Boolean),
            right: mergedRight.filter(Boolean)
        };
    }

    displayEnhancedResume() {
        const container = document.getElementById('enhanced-resume-content');
        const resume = this.analysis.enhancedResume;
        if (!resume) {
            container.innerHTML = '<p>Could not generate enhanced resume.</p>';
            return;
        }

        const contactColumns = this.getContactColumns(resume.contact || []);
        const sections = Array.isArray(resume.sections) ? resume.sections : [];

        const parts = [];
        parts.push('<article class="enhanced-resume-paper enhanced-resume-modern">');
        parts.push('<header class="resume-header-grid">');
        parts.push('<div class="resume-header-left">');
        parts.push(`<h1 class="resume-name">${this.escapeHtml(resume.name || 'Candidate Name')}</h1>`);
        contactColumns.left.forEach(line => {
            parts.push(`<p class="resume-contact-line">${this.escapeHtml(line)}</p>`);
        });
        parts.push('</div>');
        parts.push('<div class="resume-header-right">');
        contactColumns.right.forEach(line => {
            parts.push(`<p class="resume-contact-line">${this.escapeHtml(line)}</p>`);
        });
        parts.push('</div>');
        parts.push('</header>');

        if (resume.summary) {
            parts.push(`<p class="resume-summary">${this.escapeHtml(resume.summary)}</p>`);
        }

        sections.forEach(section => {
            const displayTitle = this.getDisplaySectionTitle(section.title || 'Section');
            parts.push('<section class="resume-section">');
            parts.push(`<div class="resume-section-heading"><span>${this.escapeHtml(displayTitle)}</span></div>`);

            const items = Array.isArray(section.items) ? section.items : [];
            items.forEach(item => {
                const row = this.splitHeaderRow(item.header || '');
                const sub = this.splitHeaderRow(item.subheader || '');
                const points = Array.isArray(item.points) ? item.points.filter(Boolean) : [];

                parts.push('<div class="resume-item">');
                if (row.left || row.right) {
                    parts.push(`<div class="resume-item-row"><h3>${this.escapeHtml(row.left || item.header || '')}</h3><span>${this.escapeHtml(row.right || '')}</span></div>`);
                }
                if (sub.left || sub.right || item.subheader) {
                    parts.push(`<div class="resume-item-subrow"><p>${this.escapeHtml(sub.left || item.subheader || '')}</p><span>${this.escapeHtml(sub.right || '')}</span></div>`);
                }

                if (points.length) {
                    const useTwoColumnSkills = /skills/i.test(displayTitle) && points.length >= 8;
                    if (useTwoColumnSkills) {
                        const middle = Math.ceil(points.length / 2);
                        const leftPoints = points.slice(0, middle);
                        const rightPoints = points.slice(middle);

                        parts.push('<div class="resume-skills-grid">');
                        parts.push('<ul class="resume-bullets">');
                        leftPoints.forEach(point => {
                            parts.push(`<li>${this.escapeHtml(point)}</li>`);
                        });
                        parts.push('</ul>');
                        parts.push('<ul class="resume-bullets">');
                        rightPoints.forEach(point => {
                            parts.push(`<li>${this.escapeHtml(point)}</li>`);
                        });
                        parts.push('</ul>');
                        parts.push('</div>');
                    } else {
                        parts.push('<ul class="resume-bullets">');
                        points.forEach(point => {
                            parts.push(`<li>${this.escapeHtml(point)}</li>`);
                        });
                        parts.push('</ul>');
                    }
                }
                parts.push('</div>');
            });

            parts.push('</section>');
        });

        parts.push('</article>');
        container.innerHTML = parts.join('');
        container.style.animation = 'none';
        void container.offsetHeight;
        container.style.animation = 'fadeIn 0.4s ease-out';
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
        const msgEl = document.getElementById('error-message');
        if (!modal) return;
        if (show) {
            if (msgEl) msgEl.textContent = message;
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



    exportEnhancedResumeToPDF() {
        if (!this.analysis || !this.analysis.enhancedResume) return;

        const content = document.getElementById('enhanced-resume-content');
        if (!content || !content.innerHTML.trim() || content.innerHTML.includes('Could not generate')) {
            alert('Nothing to export — please run the analysis first.');
            return;
        }

        const styleText = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\n');

        // Create a hidden iframe for print preview
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.write([
            '<html><head><title>',
            this.escapeHtml(this.analysis.enhancedResume.name || 'Enhanced Resume'),
            ' — Enhanced Resume</title>',
            '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&family=JetBrains+Mono:wght@400;600&family=Lora:wght@500;600;700&family=Source+Serif+4:wght@500;600;700&display=swap" rel="stylesheet">',
            '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />',
            '<style>', styleText, '<\/style>',
            '<style>',
            '@page { size: A4; margin: 0; }',
            'body { margin: 0; background: white; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; display: flex; justify-content: center; }',
            '.enhanced-resume-paper { box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; }',
            '<\/style>',
            '<\/head><body>',
            content.innerHTML,
            '<\/body><\/html>'
        ].join(''));

        doc.close();

        iframe.contentWindow.focus();
        iframe.contentWindow.document.fonts.ready.then(() => {
            setTimeout(() => {
                iframe.contentWindow.print();
                setTimeout(() => iframe.remove(), 1000);
            }, 300);
        });
    }



    initializeChatbot() {
        const chatbot = document.getElementById('chatbot');
        if (!chatbot) return;
        const chatIcon = document.getElementById('chat-icon');
        const chatWindow = document.getElementById('chat-window');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        if (!chatIcon || !chatWindow || !chatForm || !chatInput) return;
        
        // Show chatbot after analysis
        chatbot.classList.remove('hidden');

        if (this.chatbotInitialized) {
            return;
        }
        this.chatbotInitialized = true;
        this.setStatus('Resume assistant is ready. Ask follow-up questions anytime.', 'success');

        // Toggle chat window
        const toggleChat = () => {
            chatWindow.classList.toggle('hidden');
            if (!chatWindow.classList.contains('hidden')) {
                chatInput.focus();
            }
        };
        chatIcon.addEventListener('click', toggleChat);

        // Minimize button
        const minimizeBtn = chatWindow.querySelector('[data-minimize]');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', toggleChat);
        }

        // Handle chat form submission
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;

            // Add user message to chat
            this.addChatMessage(message, true);
            chatInput.value = '';
            this.addChatLoader();
            this.setStatus('Generating assistant response...', 'info');

            window.setTimeout(async () => {
                try {
                    const answer = await this.getLocalChatResponse(message);
                    this.removeChatLoader();
                    this.addChatMessage(answer, false);
                    this.setStatus('Assistant response ready.', 'success');
                } catch (error) {
                    console.error('Local chat response error:', error);
                    this.removeChatLoader();
                    this.addChatMessage('I hit a local processing error. Please try asking a shorter question.', false);
                    this.setStatus('Assistant response failed. Please try again.', 'error');
                }
            }, 220);
        });
    }

    async getLocalChatResponse(question) {
        if (!this.analysis) {
            return 'Please run an analysis first so I can answer based on your resume and job description.';
        }

        const q = question.toLowerCase();
        const score = this.analysis.atsScore;

        if (/ats|score|rate|rating/.test(q)) {
            return `Your current ATS score is **${score}%**. Focus on adding missing keywords and quantified impact points to improve it.`;
        }

        if (/missing keyword|keywords missing|keyword/.test(q)) {
            const missing = this.analysis.missingKeywords;
            return missing.length
                ? `Top missing keywords:\n* ${missing.slice(0, 8).join('\n* ')}`
                : 'Great news: no critical keywords are currently missing from the extracted job-description terms.';
        }

        if (/skill gap|skills missing|missing skills|skills/.test(q)) {
            const gaps = this.analysis.skillGaps;
            return gaps.length
                ? `Skill gaps detected:\n* ${gaps.slice(0, 8).join('\n* ')}`
                : 'No major skill gaps were detected from the known skill set in this job description.';
        }

        if (/improve|suggest|recommend|better|optimi[sz]e/.test(q)) {
            return `Actionable improvements:\n* ${this.analysis.suggestions.join('\n* ')}`;
        }

        if (/summary|rewrite|professional summary/.test(q)) {
            return `Suggested summary:\n${this.analysis.enhancedResume.summary}`;
        }

        const snippets = await this.getTopContextSnippets(question, 3);
        if (snippets.length) {
            return `Based on your resume and the target job description, these are the most relevant points:\n* ${snippets.join('\n* ')}`;
        }

        return 'I can help with ATS score interpretation, missing keywords, skill gaps, and targeted resume improvements. Ask a specific question in one of those areas.';
    }

    async getTopContextSnippets(question, topK = 3) {
        const rawChunks = [
            ...this.splitSentences(this.resumeText),
            ...this.splitSentences(this.jobDescription),
            ...this.analysis.suggestions,
            ...this.analysis.matchedKeywords.map(keyword => `Matched keyword: ${keyword}`),
            ...this.analysis.missingKeywords.map(keyword => `Missing keyword: ${keyword}`)
        ];

        const chunks = [...new Set(rawChunks)].filter(chunk => chunk && chunk.length > 15);
        if (!chunks.length) return [];

        const qVec = await this.embedText(question);
        const chunkEmbeddings = await Promise.all(chunks.map(chunk => this.embedText(chunk)));

        return chunks
            .map((chunk, index) => ({
                chunk,
                score: this.cosineSimilarity(qVec, chunkEmbeddings[index])
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(item => item.chunk);
    }

    /**
     * Formats a bot's message from markdown-like text to HTML.
     * @param {string} message - The raw text from the AI.
     * @returns {string} - The formatted HTML string.
     */
    formatBotMessage(message) {
        // Convert **text** to <strong>text</strong>
        let formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Process lines for bullet points and paragraphs
        const lines = formattedMessage.split('\n');
        let html = '';
        let inList = false;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('* ')) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                html += `<li>${trimmedLine.substring(2)}</li>`; // Add list item
            } else {
                if (inList) {
                    html += '</ul>'; // Close the list
                    inList = false;
                }
                if (trimmedLine) {
                    html += `<p>${line}</p>`; // Wrap non-list, non-empty lines in paragraphs
                }
            }
        }

        if (inList) {
            html += '</ul>'; // Ensure any open list is closed at the end
        }

        return html;
    }

    addChatMessage(message, isUser) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        if (isUser) {
            messageDiv.textContent = message;
        } else {
            messageDiv.innerHTML = this.formatBotMessage(message);
        }
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Adds a loading indicator to the chat window.
     */
    addChatLoader() {
        const chatMessages = document.getElementById('chat-messages');
        const loaderDiv = document.createElement('div');
        loaderDiv.id = 'chat-loader';
        loaderDiv.className = 'message bot-message'; // Align to the left like bot messages
        loaderDiv.innerHTML = `
            <div class="flex items-center justify-center space-x-1.5 p-2">
                <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.1s;"></div>
                <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.2s;"></div>
            </div>
        `;
        chatMessages.appendChild(loaderDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Removes the loading indicator from the chat window.
     */
    removeChatLoader() {
        const loader = document.getElementById('chat-loader');
        if (loader) {
            loader.remove();
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ResumeAnalyzer();
});
