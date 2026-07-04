/**
 * CBC AUTOMATED ASSESSMENT SYSTEM
 * Supports all grades (1-12) and subjects with AI-powered grading & feedback
 */

const ASSESSMENT_STORAGE_KEY = "cbeAssessments";
const ASSESSMENT_RESULTS_KEY = "cbeAssessmentResults";
const ASSESSMENT_BANK_KEY = "cbeAssessmentBank";
const MAX_ASSESSMENT_SIZE = 50; // Max questions per assessment

/**
 * Question Types Supported
 */
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: "multiple_choice",
  SHORT_ANSWER: "short_answer",
  TRUE_FALSE: "true_false",
  FILL_BLANK: "fill_blank",
  ESSAY: "essay",
  MATCHING: "matching",
  ORDERING: "ordering"
};

/**
 * Scoring Rubrics by Grade Level
 */
const GRADE_RUBRICS = {
  elementary: {
    description: "Grades 1-3: Basic competencies",
    markingScheme: "0-100%",
    passMarks: 50,
    grades: ["Grade 1", "Grade 2", "Grade 3"]
  },
  upper_primary: {
    description: "Grades 4-6: Intermediate competencies",
    markingScheme: "0-100%",
    passMarks: 55,
    grades: ["Grade 4", "Grade 5", "Grade 6"]
  },
  junior_secondary: {
    description: "Grades 7-9: Advanced competencies",
    markingScheme: "0-100%",
    passMarks: 60,
    grades: ["Grade 7", "Grade 8", "Grade 9"]
  },
  senior_secondary: {
    description: "Grades 10-12: Mastery level",
    markingScheme: "0-100%",
    passMarks: 65,
    grades: ["Grade 10", "Grade 11", "Grade 12"]
  }
};

/**
 * Assessment Class - Core Assessment Engine
 */
class Assessment {
  constructor(config = {}) {
    this.id = config.id || `assessment-${Date.now()}`;
    this.title = config.title || "Untitled Assessment";
    this.grade = config.grade || "Grade 1";
    this.subject = config.subject || "Mathematics";
    this.term = config.term || "Term 1";
    this.totalMarks = config.totalMarks || 0;
    this.duration = config.duration || 30; // minutes
    this.questions = config.questions || [];
    this.instructions = config.instructions || "Answer all questions";
    this.passMark = config.passMark || this.calculatePassMark();
    this.createdAt = config.createdAt || new Date().toISOString();
    this.status = config.status || "draft"; // draft, active, archived
    this.learnerCount = config.learnerCount || 0;
  }

  calculatePassMark() {
    const rubric = Object.values(GRADE_RUBRICS).find((r) =>
      r.grades.includes(this.grade)
    );
    return rubric ? rubric.passMarks : 50;
  }

  addQuestion(question) {
    if (this.questions.length >= MAX_ASSESSMENT_SIZE) {
      throw new Error(`Maximum ${MAX_ASSESSMENT_SIZE} questions per assessment.`);
    }
    this.questions.push({
      id: `q-${this.questions.length + 1}`,
      ...question,
      marks: question.marks || 1
    });
    this.totalMarks += question.marks || 1;
    return this;
  }

  removeQuestion(questionId) {
    const question = this.questions.find((q) => q.id === questionId);
    if (question) {
      this.totalMarks -= question.marks;
      this.questions = this.questions.filter((q) => q.id !== questionId);
    }
    return this;
  }

  getQuestionsByType(type) {
    return this.questions.filter((q) => q.type === type);
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      grade: this.grade,
      subject: this.subject,
      term: this.term,
      totalMarks: this.totalMarks,
      duration: this.duration,
      questions: this.questions,
      instructions: this.instructions,
      passMark: this.passMark,
      createdAt: this.createdAt,
      status: this.status,
      learnerCount: this.learnerCount
    };
  }
}

/**
 * AssessmentResult Class - Track learner performance
 */
class AssessmentResult {
  constructor(config = {}) {
    this.id = config.id || `result-${Date.now()}`;
    this.assessmentId = config.assessmentId;
    this.assessmentTitle = config.assessmentTitle;
    this.learner = config.learner;
    this.learnerPhone = config.learnerPhone;
    this.grade = config.grade;
    this.subject = config.subject;
    this.answers = config.answers || {}; // {questionId: answer}
    this.scores = config.scores || {}; // {questionId: score}
    this.totalScore = config.totalScore || 0;
    this.totalMarks = config.totalMarks || 0;
    this.percentage = config.percentage || 0;
    this.status = config.status || "pending"; // pending, graded, reviewed
    this.feedback = config.feedback || "";
    this.remarks = config.remarks || "";
    this.startedAt = config.startedAt || new Date().toISOString();
    this.submittedAt = config.submittedAt || null;
    this.gradedAt = config.gradedAt || null;
  }

  calculatePercentage() {
    if (this.totalMarks === 0) return 0;
    this.percentage = Math.round((this.totalScore / this.totalMarks) * 100);
    return this.percentage;
  }

  generateRemarks(passMark) {
    if (this.percentage >= 90)
      this.remarks = "Excellent! Outstanding performance.";
    else if (this.percentage >= 80)
      this.remarks = "Very Good! Strong understanding demonstrated.";
    else if (this.percentage >= 70)
      this.remarks = "Good! Solid grasp of the concepts.";
    else if (this.percentage >= passMark)
      this.remarks = "Satisfactory. Meet minimum standards.";
    else this.remarks = "Needs Improvement. Review and practice weak areas.";
    return this.remarks;
  }

  toJSON() {
    return {
      id: this.id,
      assessmentId: this.assessmentId,
      assessmentTitle: this.assessmentTitle,
      learner: this.learner,
      learnerPhone: this.learnerPhone,
      grade: this.grade,
      subject: this.subject,
      answers: this.answers,
      scores: this.scores,
      totalScore: this.totalScore,
      totalMarks: this.totalMarks,
      percentage: this.percentage,
      status: this.status,
      feedback: this.feedback,
      remarks: this.remarks,
      startedAt: this.startedAt,
      submittedAt: this.submittedAt,
      gradedAt: this.gradedAt
    };
  }
}

/**
 * Grading Engine - Automatic Marking System
 */
class GradingEngine {
  /**
   * Grade multiple choice question
   */
  static gradeMultipleChoice(answer, correctAnswer, marks) {
    return answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      ? marks
      : 0;
  }

  /**
   * Grade true/false question
   */
  static gradeTrueFalse(answer, correctAnswer, marks) {
    const normalized = String(answer).toLowerCase();
    const isCorrect =
      (normalized === "true" || normalized === "t" || normalized === "1") ===
      (correctAnswer === true || correctAnswer === "true");
    return isCorrect ? marks : 0;
  }

  /**
   * Grade short answer with keyword matching (basic NLP)
   */
  static gradeShortAnswer(answer, keywords, marks) {
    if (!answer || !keywords) return 0;
    const answerLower = answer.toLowerCase();
    const matchedKeywords = keywords.filter((keyword) =>
      answerLower.includes(keyword.toLowerCase())
    );
    const score = Math.round((matchedKeywords.length / keywords.length) * marks);
    return Math.min(score, marks);
  }

  /**
   * Grade fill-in-blank with variation tolerance
   */
  static gradeFillBlank(answer, correctAnswers, marks) {
    if (!answer || !Array.isArray(correctAnswers)) return 0;
    const answerNorm = answer.trim().toLowerCase();
    const isCorrect = correctAnswers.some(
      (correct) => answerNorm === correct.trim().toLowerCase()
    );
    return isCorrect ? marks : 0;
  }

  /**
   * Grade matching question
   */
  static gradeMatching(answers, correctAnswers, marks) {
    let correct = 0;
    for (const [key, value] of Object.entries(answers)) {
      if (correctAnswers[key] === value) correct++;
    }
    const totalPairs = Object.keys(correctAnswers).length;
    return Math.round((correct / totalPairs) * marks);
  }

  /**
   * Grade ordering/sequence question
   */
  static gradeOrdering(answer, correctOrder, marks) {
    if (!Array.isArray(answer) || !Array.isArray(correctOrder)) return 0;
    const isCorrect = JSON.stringify(answer) === JSON.stringify(correctOrder);
    return isCorrect ? marks : marks / 2; // Partial credit for partial order
  }

  /**
   * Master grading function
   */
  static gradeQuestion(question, answer) {
    const { type, correctAnswer, keywords, correctAnswers, marks = 1 } =
      question;

    switch (type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return this.gradeMultipleChoice(answer, correctAnswer, marks);
      case QUESTION_TYPES.TRUE_FALSE:
        return this.gradeTrueFalse(answer, correctAnswer, marks);
      case QUESTION_TYPES.SHORT_ANSWER:
        return this.gradeShortAnswer(answer, keywords, marks);
      case QUESTION_TYPES.FILL_BLANK:
        return this.gradeFillBlank(answer, correctAnswers, marks);
      case QUESTION_TYPES.MATCHING:
        return this.gradeMatching(answer, correctAnswers, marks);
      case QUESTION_TYPES.ORDERING:
        return this.gradeOrdering(answer, correctAnswers, marks);
      case QUESTION_TYPES.ESSAY:
        return 0; // Requires manual grading
      default:
        return 0;
    }
  }
}

/**
 * AssessmentManager - Central Management System
 */
class AssessmentManager {
  constructor() {
    this.assessments = this.loadAssessments();
    this.results = this.loadResults();
  }

  loadAssessments() {
    try {
      return JSON.parse(localStorage.getItem(ASSESSMENT_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  loadResults() {
    try {
      return JSON.parse(localStorage.getItem(ASSESSMENT_RESULTS_KEY)) || [];
    } catch {
      return [];
    }
  }

  saveAssessments() {
    localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(this.assessments));
  }

  saveResults() {
    localStorage.setItem(ASSESSMENT_RESULTS_KEY, JSON.stringify(this.results));
  }

  /**
   * Create and save new assessment
   */
  createAssessment(config) {
    const assessment = new Assessment(config);
    this.assessments.push(assessment.toJSON());
    this.saveAssessments();
    return assessment;
  }

  /**
   * Get assessment by ID
   */
  getAssessment(assessmentId) {
    return this.assessments.find((a) => a.id === assessmentId);
  }

  /**
   * Get assessments by grade
   */
  getAssessmentsByGrade(grade) {
    return this.assessments.filter((a) => a.grade === grade);
  }

  /**
   * Get assessments by subject
   */
  getAssessmentsBySubject(subject) {
    return this.assessments.filter((a) => a.subject === subject);
  }

  /**
   * Get assessments by grade and subject
   */
  getAssessmentsByGradeAndSubject(grade, subject) {
    return this.assessments.filter((a) => a.grade === grade && a.subject === subject);
  }

  /**
   * Submit and auto-grade assessment
   */
  submitAssessment(assessmentId, learner, learnerPhone, answers) {
    const assessment = this.getAssessment(assessmentId);
    if (!assessment)
      throw new Error(`Assessment ${assessmentId} not found.`);

    const result = new AssessmentResult({
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      learner,
      learnerPhone,
      grade: assessment.grade,
      subject: assessment.subject,
      totalMarks: assessment.totalMarks,
      answers
    });

    let totalScore = 0;
    const scores = {};

    // Auto-grade each question
    for (const question of assessment.questions) {
      const answer = answers[question.id];
      const score = GradingEngine.gradeQuestion(question, answer);
      scores[question.id] = score;
      totalScore += score;
    }

    result.scores = scores;
    result.totalScore = totalScore;
    result.calculatePercentage();
    result.generateRemarks(assessment.passMark);
    result.status = "graded";
    result.gradedAt = new Date().toISOString();
    result.submittedAt = new Date().toISOString();

    this.results.push(result.toJSON());
    this.saveResults();

    // Increment learner count
    assessment.learnerCount = (assessment.learnerCount || 0) + 1;
    this.saveAssessments();

    return result.toJSON();
  }

  /**
   * Get results for specific learner
   */
  getLearnerResults(learner) {
    return this.results.filter((r) => r.learner.toLowerCase() === learner.toLowerCase());
  }

  /**
   * Get class results for assessment
   */
  getClassResults(assessmentId) {
    return this.results.filter((r) => r.assessmentId === assessmentId);
  }

  /**
   * Generate assessment analytics
   */
  generateAnalytics(assessmentId) {
    const classResults = this.getClassResults(assessmentId);
    if (classResults.length === 0) {
      return { message: "No results yet" };
    }

    const scores = classResults.map((r) => r.percentage);
    const average = Math.round(scores.reduce((a, b) => a + b) / scores.length);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passed = classResults.filter((r) => r.percentage >= 50).length;
    const passRate = Math.round((passed / classResults.length) * 100);

    return {
      totalAttempts: classResults.length,
      averageScore: average,
      highestScore: highest,
      lowestScore: lowest,
      passedCount: passed,
      passRate,
      scoreDistribution: this.calculateDistribution(scores),
      performanceByTopic: this.analyzeByTopic(assessmentId, classResults)
    };
  }

  calculateDistribution(scores) {
    return {
      "90-100%": scores.filter((s) => s >= 90).length,
      "80-89%": scores.filter((s) => s >= 80 && s < 90).length,
      "70-79%": scores.filter((s) => s >= 70 && s < 80).length,
      "60-69%": scores.filter((s) => s >= 60 && s < 70).length,
      "50-59%": scores.filter((s) => s >= 50 && s < 60).length,
      "Below 50%": scores.filter((s) => s < 50).length
    };
  }

  analyzeByTopic(assessmentId, classResults) {
    const assessment = this.getAssessment(assessmentId);
    const analysis = {};

    for (const question of assessment.questions) {
      const topic = question.topic || "General";
      if (!analysis[topic]) {
        analysis[topic] = {
          correct: 0,
          total: 0,
          percentage: 0
        };
      }

      for (const result of classResults) {
        analysis[topic].total++;
        if ((result.scores[question.id] || 0) === question.marks) {
          analysis[topic].correct++;
        }
      }

      analysis[topic].percentage = Math.round(
        (analysis[topic].correct / analysis[topic].total) * 100
      );
    }

    return analysis;
  }

  /**
   * Delete assessment
   */
  deleteAssessment(assessmentId) {
    this.assessments = this.assessments.filter((a) => a.id !== assessmentId);
    this.results = this.results.filter((r) => r.assessmentId !== assessmentId);
    this.saveAssessments();
    this.saveResults();
  }

  /**
   * Export results as CSV
   */
  exportResultsCSV(assessmentId) {
    const results = this.getClassResults(assessmentId);
    if (results.length === 0) return "No results to export.";

    const headers = [
      "Learner Name",
      "Phone",
      "Score",
      "Total Marks",
      "Percentage",
      "Remarks",
      "Submitted At"
    ];
    const rows = results.map((r) => [
      r.learner,
      r.learnerPhone,
      r.totalScore,
      r.totalMarks,
      `${r.percentage}%`,
      r.remarks,
      new Date(r.submittedAt).toLocaleString()
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach((row) => {
      csv += row.join(",") + "\n";
    });

    return csv;
  }
}

/**
 * Initialize and export
 */
const assessmentManager = new AssessmentManager();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    Assessment,
    AssessmentResult,
    GradingEngine,
    AssessmentManager,
    QUESTION_TYPES,
    GRADE_RUBRICS,
    assessmentManager
  };
}
