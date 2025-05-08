import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { Mic, Check, PlayCircle, BookOpen, Star, Database, ArrowRight, Globe, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import { useEffect } from "react";

export default function LandingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <>
      <Helmet>
        <title>InterviewAI - The AI-Powered Interview Simulator</title>
        <meta 
          name="description" 
          content="Practice your interview skills with our AI-powered interview simulator. Upload job descriptions, answer questions via voice, and get detailed feedback." 
        />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <header className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Mic className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-primary-800 dark:text-primary-400 text-xl font-bold">InterviewAI</span>
              </div>
              <div className="space-x-4">
                <Link href="/auth">
                  <Button variant="outline" className="border-primary-500 text-primary-700 hover:bg-primary-50">
                    Log In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="bg-primary-600 text-white hover:bg-primary-700">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 md:pr-8">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                  Ace Your Next <span className="text-primary-600 dark:text-primary-400">Interview</span> with AI-Powered Practice
                </h1>
                <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
                  Upload a job description, practice with real-time voice conversations,
                  and get detailed feedback to improve your interview skills.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                  <Link href="/auth">
                    <Button size="lg" className="bg-primary-600 text-white hover:bg-primary-700 px-8">
                      Get Started
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button variant="outline" size="lg" className="border-primary-500 text-primary-700 hover:bg-primary-50 px-8">
                      Learn More
                    </Button>
                  </a>
                </div>
              </div>
              <div className="mt-10 md:mt-0 md:w-1/2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                  <div className="p-8 bg-primary-50 dark:bg-gray-700">
                    <div className="flex items-center mb-6">
                      <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-gray-600 flex items-center justify-center">
                        <Mic className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Interviewer</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Software Developer Position</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
                      <p className="text-gray-800 dark:text-gray-200">
                        "Can you describe your experience with React and how you've used it to build responsive user interfaces?"
                      </p>
                    </div>
                    <div className="bg-primary-100 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-gray-700 dark:text-gray-300 text-sm">Your answer was clear and comprehensive. Good job mentioning specific projects.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-8 py-4 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Recording in progress...</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300">
                      Skip Question <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          {/* How it Works */}
          <section className="py-16 bg-white dark:bg-gray-900" id="features">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">How InterviewAI Works</h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  Our AI-powered platform makes interview practice simple, effective, and personalized to your needs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900 rounded-full mb-6">
                    <Database className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upload Job Description</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Paste a job description or upload a document and our AI will create tailored interview questions.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900 rounded-full mb-6">
                    <Mic className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Practice with Voice</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Engage in real-time voice conversations with our AI interviewer for a realistic interview experience.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900 rounded-full mb-6">
                    <BarChart className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Get Detailed Feedback</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Receive comprehensive feedback on your responses, highlighting strengths and areas for improvement.
                  </p>
                </div>
              </div>

              <div className="mt-16 text-center">
                <Link href="/auth">
                  <Button className="bg-primary-600 text-white hover:bg-primary-700">
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Features Designed for Success</h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  Our platform is packed with features to help you prepare, practice, and perfect your interview skills.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Feature 1 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm flex">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Industry-Specific Questions</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Our AI generates questions tailored to your specific industry, job role, and experience level.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm flex">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Star className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Performance Scoring</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Receive detailed scores on clarity, relevance, and completeness of your answers.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm flex">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <PlayCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Natural Voice Interaction</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Engage with our AI using natural speech for a realistic interview experience.
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm flex">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Progress Tracking</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Track your improvement over time with comprehensive interview history and analytics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials/CTA Section */}
          <section className="py-16 bg-primary-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold mb-8">Ready to Ace Your Next Interview?</h2>
              <p className="text-xl mb-8 max-w-3xl mx-auto">
                Join thousands of job seekers who have improved their interview skills and landed their dream jobs with InterviewAI.
              </p>
              <Link href="/auth">
                <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-100">
                  Start Practicing Now
                </Button>
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}