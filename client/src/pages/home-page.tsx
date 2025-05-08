import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Interview } from "@shared/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";
import JobDescriptionForm from "@/components/job-description-form";
import RecentInterviews from "@/components/recent-interviews";
import StatsCards from "@/components/stats-cards";
import { Helmet } from "react-helmet";

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: interviews = [], isLoading: isLoadingInterviews } = useQuery<Interview[]>({
    queryKey: ["/api/interviews"],
  });

  const firstName = user?.fullName.split(" ")[0] || "User";

  return (
    <>
      <Helmet>
        <title>InterviewAI Dashboard - Practice Your Interview Skills</title>
        <meta name="description" content="Prepare for your next job interview with InterviewAI. Upload a job description and practice with our AI interviewer to improve your skills and confidence." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen bg-neutral-50">
        <Header />
        
        <main className="flex-grow">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 pt-10 pb-6 mb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6 max-w-3xl">
                <h1 className="text-3xl sm:text-4xl font-bold text-primary-900 mb-3">Welcome back, {firstName}</h1>
                <p className="text-primary-800 text-lg">Ready to ace your next interview? Practice with our AI interview simulator to improve your skills and confidence.</p>
              </div>
              
              <StatsCards interviews={interviews} isLoading={isLoadingInterviews} />
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Start New Interview</h2>
                  <JobDescriptionForm />
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Recent Interviews</h2>
                    {interviews.length > 0 && (
                      <span className="text-sm font-medium text-primary-600">
                        {interviews.length} interview{interviews.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <RecentInterviews interviews={interviews} isLoading={isLoadingInterviews} />
                </div>
              </div>
              
              <div className="lg:col-span-5">
                <div className="sticky top-6">
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Tips</h2>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 inline-flex items-center justify-center mr-2 mt-0.5">
                          <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span>Speak clearly and take your time to articulate your thoughts</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 inline-flex items-center justify-center mr-2 mt-0.5">
                          <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span>Use concrete examples from your experience</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 inline-flex items-center justify-center mr-2 mt-0.5">
                          <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span>Follow the STAR method: Situation, Task, Action, Result</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 inline-flex items-center justify-center mr-2 mt-0.5">
                          <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span>Review your performance and focus on areas for improvement</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-primary-50 rounded-lg shadow-sm p-6 border border-primary-100">
                    <div className="flex items-center mb-4">
                      <svg className="h-8 w-8 text-primary-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <h2 className="text-xl font-semibold text-primary-900">Practice Tips</h2>
                    </div>
                    <p className="text-primary-800 mb-4">For best results, practice in a quiet environment and speak clearly. Review your feedback to improve with each interview.</p>
                    <a href="https://www.indeed.com/career-advice/interviewing/common-interview-questions-and-answers" target="_blank" rel="noopener noreferrer" className="w-full inline-block text-center bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 transition duration-200">
                      Interview Resources
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
