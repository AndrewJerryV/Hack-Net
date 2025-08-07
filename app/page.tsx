"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Upload, FileText, Target, TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react'

interface AnalysisResult {
  atsScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  suggestions: string[]
  skillGaps: string[]
  enhancedSections: {
    section: string
    original: string
    enhanced: string
  }[]
}

export default function ResumeCustomizer() {
  const [resume, setResume] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/plain") {
      const reader = new FileReader()
      reader.onload = (e) => {
        setResume(e.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  const analyzeResume = async () => {
    if (!resume || !jobDescription) return

    setIsAnalyzing(true)
    
    // Simulate AI analysis - in a real app, this would call your AI service
    setTimeout(() => {
      const mockAnalysis: AnalysisResult = {
        atsScore: 78,
        matchedKeywords: ["JavaScript", "React", "Node.js", "Git", "Agile", "Problem-solving"],
        missingKeywords: ["TypeScript", "AWS", "Docker", "CI/CD", "Microservices"],
        suggestions: [
          "Add more quantifiable achievements with specific metrics",
          "Include relevant certifications or courses",
          "Optimize section headers for ATS scanning",
          "Add more industry-specific keywords naturally"
        ],
        skillGaps: ["Cloud Computing", "DevOps", "System Design", "Database Management"],
        enhancedSections: [
          {
            section: "Professional Summary",
            original: "Software developer with experience in web development.",
            enhanced: "Results-driven Software Developer with 3+ years of experience building scalable web applications using React, Node.js, and modern JavaScript frameworks. Proven track record of delivering high-quality solutions in Agile environments."
          },
          {
            section: "Experience",
            original: "Worked on various projects using React and JavaScript.",
            enhanced: "Developed and maintained 5+ responsive web applications using React and JavaScript, resulting in 25% improved user engagement and 30% faster load times."
          }
        ]
      }
      setAnalysis(mockAnalysis)
      setIsAnalyzing(false)
    }, 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    return "Needs Improvement"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Resume Customization AI</h1>
          <p className="text-xl text-gray-600">Optimize your resume for any job with AI-powered insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Resume Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Resume
              </CardTitle>
              <CardDescription>
                Upload your resume or paste the content below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="resume-upload">Upload Resume (TXT file)</Label>
                <Input
                  id="resume-upload"
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="resume-text">Or paste your resume content</Label>
                <Textarea
                  id="resume-text"
                  placeholder="Paste your resume content here..."
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  className="min-h-[300px] mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Job Description Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Job Description
              </CardTitle>
              <CardDescription>
                Paste the job description you want to target
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[350px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Analyze Button */}
        <div className="text-center mb-8">
          <Button
            onClick={analyzeResume}
            disabled={!resume || !jobDescription || isAnalyzing}
            size="lg"
            className="px-8"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Analyze & Customize Resume
              </>
            )}
          </Button>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* ATS Score Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  ATS Compatibility Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className={`text-4xl font-bold ${getScoreColor(analysis.atsScore)}`}>
                      {analysis.atsScore}%
                    </div>
                    <div className="text-sm text-gray-600">{getScoreLabel(analysis.atsScore)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">ATS Compatibility</div>
                    <Progress value={analysis.atsScore} className="w-32" />
                  </div>
                </div>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your resume has a {analysis.atsScore}% ATS compatibility score. 
                    {analysis.atsScore >= 80 ? " Excellent work!" : analysis.atsScore >= 60 ? " Good, but there's room for improvement." : " Consider implementing the suggestions below."}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Tabs defaultValue="keywords" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                <TabsTrigger value="skills">Skill Gaps</TabsTrigger>
                <TabsTrigger value="enhanced">Enhanced Content</TabsTrigger>
              </TabsList>

              {/* Keywords Analysis */}
              <TabsContent value="keywords" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Matched Keywords
                      </CardTitle>
                      <CardDescription>Keywords found in your resume</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysis.matchedKeywords.map((keyword, index) => (
                          <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Missing Keywords
                      </CardTitle>
                      <CardDescription>Important keywords to add</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysis.missingKeywords.map((keyword, index) => (
                          <Badge key={index} variant="destructive" className="bg-red-100 text-red-800">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Suggestions */}
              <TabsContent value="suggestions">
                <Card>
                  <CardHeader>
                    <CardTitle>Enhancement Suggestions</CardTitle>
                    <CardDescription>AI-powered recommendations to improve your resume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <p className="text-sm">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skill Gaps */}
              <TabsContent value="skills">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">Skill Gap Analysis</CardTitle>
                    <CardDescription>Skills mentioned in the job description but missing from your resume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.skillGaps.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="font-medium">{skill}</span>
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Missing
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Consider adding these skills to your resume if you have experience with them, or highlight related experience that demonstrates these capabilities.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Enhanced Content */}
              <TabsContent value="enhanced">
                <div className="space-y-4">
                  {analysis.enhancedSections.map((section, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>{section.section}</CardTitle>
                        <CardDescription>AI-enhanced version of your content</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-red-600">Original:</Label>
                          <div className="p-3 bg-red-50 rounded-lg mt-1">
                            <p className="text-sm">{section.original}</p>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium text-green-600">Enhanced:</Label>
                          <div className="p-3 bg-green-50 rounded-lg mt-1">
                            <p className="text-sm">{section.enhanced}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
